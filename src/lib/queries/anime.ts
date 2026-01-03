/**
 * Anime Query Functions
 *
 * Server-side data fetching functions for anime data.
 * These are NOT server actions - they are regular async functions
 * meant to be called from Server Components only.
 *
 * For client-side mutations, use the server actions in @/app/actions/
 */

import { createClient } from "@/lib/supabase/server";
import type {
    Anime,
    AnimeFormat,
    AnimeRelationType,
    AnimeRow,
    AnimeSeason,
    AnimeStatus,
    AnimeWithRelations,
    RelatedAnimeResult,
    StreamingPlatform,
} from "@/types/anime";
import type { ActionResult, PaginatedResponse } from "@/types/common";
import { transformAnimeRow } from "@/types/anime";

// =============================================
// Core Anime Query Functions
// =============================================

/**
 * Fetches a paginated list of anime from the database
 * Sorted by popularity (ascending = most popular first, since lower rank = more popular)
 *
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page (default: 20, max: 100)
 * @returns Paginated list of anime or error
 */
export async function getAnimeList(
    page: number = 1,
    pageSize: number = 20
): Promise<ActionResult<PaginatedResponse<Anime>>> {
    try {
        // Validate pagination params
        const validPage = Math.max(1, page);
        const validPageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (validPage - 1) * validPageSize;

        const supabase = await createClient();

        // Fetch anime with count for pagination
        const { data, error, count } = await supabase
            .from("anime")
            .select("*", { count: "exact" })
            .order("popularity", { ascending: true })
            .range(offset, offset + validPageSize - 1);

        if (error) {
            console.error("Error fetching anime list:", error);
            return { success: false, error: "Failed to fetch anime list" };
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / validPageSize);

        // Transform database rows to domain types
        const animeList = (data as AnimeRow[]).map(transformAnimeRow);

        return {
            success: true,
            data: {
                data: animeList,
                pagination: {
                    page: validPage,
                    pageSize: validPageSize,
                    totalCount,
                    totalPages,
                    hasNextPage: validPage < totalPages,
                    hasPreviousPage: validPage > 1,
                },
            },
        };
    } catch (error) {
        console.error("Error fetching anime list:", error);
        return { success: false, error: "Failed to fetch anime list" };
    }
}

/**
 * Fetches a single anime by its slug
 * Includes related data: studios, streaming links, and related anime
 *
 * @param slug - URL-friendly identifier for the anime
 * @returns Anime with relations or error
 */
export async function getAnimeBySlug(
    slug: string
): Promise<ActionResult<AnimeWithRelations>> {
    try {
        if (!slug || typeof slug !== "string") {
            return {
                success: false,
                error: "Invalid slug",
                code: "INVALID_INPUT",
            };
        }

        const supabase = await createClient();

        // Fetch anime with related studios via junction table
        const { data, error } = await supabase
            .from("anime")
            .select(
                `
        *,
        anime_studios(
          studio:studios(id, name, slug)
        ),
        streaming_links(id, platform, url, region)
      `
            )
            .eq("slug", slug)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                // No rows returned
                return {
                    success: false,
                    error: "Anime not found",
                    code: "NOT_FOUND",
                };
            }
            console.error("Error fetching anime by slug:", error);
            return { success: false, error: "Failed to fetch anime" };
        }

        if (!data) {
            return {
                success: false,
                error: "Anime not found",
                code: "NOT_FOUND",
            };
        }

        // Transform the response
        const animeRow = data as AnimeRow & {
            anime_studios: Array<{
                studio: { id: string; name: string; slug: string };
            }>;
            streaming_links: Array<{
                id: string;
                platform: StreamingPlatform;
                url: string;
                region: string;
            }>;
        };

        const anime = transformAnimeRow(animeRow);

        // Extract studios from junction table results
        const studios = (animeRow.anime_studios || [])
            .filter((as) => as.studio)
            .map((as) => ({
                id: as.studio.id,
                name: as.studio.name,
                slug: as.studio.slug,
            }));

        // Transform streaming links
        const streamingLinks = (animeRow.streaming_links || []).map((link) => ({
            id: link.id,
            animeId: anime.id,
            platform: link.platform,
            url: link.url,
            region: link.region,
        }));

        // Fetch related anime
        const relatedAnime = await fetchRelatedAnime(supabase, anime.id);

        const animeWithRelations: AnimeWithRelations = {
            ...anime,
            genres: [], // Genres not implemented in current schema
            studios,
            streamingLinks,
            relatedAnime,
        };

        return { success: true, data: animeWithRelations };
    } catch (error) {
        console.error("Error fetching anime by slug:", error);
        return { success: false, error: "Failed to fetch anime" };
    }
}

/**
 * Fetches basic anime data by short ID for metadata generation
 * This is a lightweight query that skips related anime fetching
 *
 * @param shortId - 8-character uppercase alphanumeric identifier
 * @returns Basic anime data or error
 */
export async function getAnimeByShortIdForMetadata(
    shortId: string
): Promise<ActionResult<Anime>> {
    try {
        // Validate short ID format
        if (!shortId || typeof shortId !== "string") {
            return {
                success: false,
                error: "Invalid short ID",
                code: "INVALID_INPUT",
            };
        }

        const normalizedId = shortId.toUpperCase();
        if (!/^[A-Z0-9]{8}$/.test(normalizedId)) {
            return {
                success: false,
                error: "Invalid short ID format",
                code: "INVALID_INPUT",
            };
        }

        const supabase = await createClient();

        // Simple query - no joins needed for metadata
        const { data, error } = await supabase
            .from("anime")
            .select("*")
            .eq("short_id", normalizedId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return {
                    success: false,
                    error: "Anime not found",
                    code: "NOT_FOUND",
                };
            }
            console.error("Error fetching anime for metadata:", error);
            return { success: false, error: "Failed to fetch anime" };
        }

        if (!data) {
            return {
                success: false,
                error: "Anime not found",
                code: "NOT_FOUND",
            };
        }

        const anime = transformAnimeRow(data as AnimeRow);
        return { success: true, data: anime };
    } catch (error) {
        console.error("Error fetching anime for metadata:", error);
        return { success: false, error: "Failed to fetch anime" };
    }
}

/**
 * Fetches a single anime by its short ID
 * Includes related data: studios, streaming links, and related anime
 *
 * Short IDs are 8-character uppercase alphanumeric strings used in URLs
 * for stable, immutable references independent of title changes.
 *
 * @param shortId - 8-character uppercase alphanumeric identifier
 * @returns Anime with relations or error
 */
export async function getAnimeByShortId(
    shortId: string
): Promise<ActionResult<AnimeWithRelations>> {
    try {
        // Validate short ID format (8 uppercase alphanumeric characters)
        if (!shortId || typeof shortId !== "string") {
            return {
                success: false,
                error: "Invalid short ID",
                code: "INVALID_INPUT",
            };
        }

        // Normalize to uppercase and validate format
        const normalizedId = shortId.toUpperCase();
        if (!/^[A-Z0-9]{8}$/.test(normalizedId)) {
            return {
                success: false,
                error: "Invalid short ID format",
                code: "INVALID_INPUT",
            };
        }

        const supabase = await createClient();

        // Fetch anime with related studios via junction table
        const { data, error } = await supabase
            .from("anime")
            .select(
                `
        *,
        anime_studios(
          studio:studios(id, name, slug)
        ),
        streaming_links(id, platform, url, region)
      `
            )
            .eq("short_id", normalizedId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                // No rows returned
                return {
                    success: false,
                    error: "Anime not found",
                    code: "NOT_FOUND",
                };
            }
            console.error("Error fetching anime by short ID:", error);
            return { success: false, error: "Failed to fetch anime" };
        }

        if (!data) {
            return {
                success: false,
                error: "Anime not found",
                code: "NOT_FOUND",
            };
        }

        // Transform the response
        const animeRow = data as AnimeRow & {
            anime_studios: Array<{
                studio: { id: string; name: string; slug: string };
            }>;
            streaming_links: Array<{
                id: string;
                platform: StreamingPlatform;
                url: string;
                region: string;
            }>;
        };

        const anime = transformAnimeRow(animeRow);

        // Extract studios from junction table results
        const studios = (animeRow.anime_studios || [])
            .filter((as) => as.studio)
            .map((as) => ({
                id: as.studio.id,
                name: as.studio.name,
                slug: as.studio.slug,
            }));

        // Transform streaming links
        const streamingLinks = (animeRow.streaming_links || []).map((link) => ({
            id: link.id,
            animeId: anime.id,
            platform: link.platform,
            url: link.url,
            region: link.region,
        }));

        // Skip related anime fetch - it will be loaded separately via Suspense
        const animeWithRelations: AnimeWithRelations = {
            ...anime,
            genres: [], // Genres not implemented in current schema
            studios,
            streamingLinks,
            relatedAnime: { data: [], hasError: false }, // Placeholder - loaded separately
        };

        return { success: true, data: animeWithRelations };
    } catch (error) {
        console.error("Error fetching anime by short ID:", error);
        return { success: false, error: "Failed to fetch anime" };
    }
}

/**
 * Fetches related anime for a given anime ID
 * Exported for use with Suspense to defer loading
 *
 * @param animeId - UUID of the source anime
 * @returns RelatedAnimeResult with data array and error state
 */
export async function getRelatedAnime(
    animeId: string
): Promise<RelatedAnimeResult> {
    const supabase = await createClient();
    return fetchRelatedAnime(supabase, animeId);
}

/**
 * Fetches related anime for a given anime ID using a single query with join
 * Returns anime that are sequels, prequels, side stories, etc.
 *
 * @param supabase - Supabase client instance
 * @param animeId - UUID of the source anime
 * @returns RelatedAnimeResult with data array and error state
 */
async function fetchRelatedAnime(
    supabase: Awaited<ReturnType<typeof createClient>>,
    animeId: string
): Promise<RelatedAnimeResult> {
    try {
        // Single query with join - fetches relations and target anime data together
        const { data: relations, error } = await supabase
            .from("anime_relations")
            .select(
                `
                relation_type,
                target_anime:target_anime_id(*)
            `
            )
            .eq("source_anime_id", animeId);

        if (error) {
            // Table might not exist yet - this is expected before migration is run
            if (error.code === "42P01") {
                return { data: [], hasError: false };
            }
            console.error("Error fetching anime relations:", error);
            return { data: [], hasError: true };
        }

        if (!relations || relations.length === 0) {
            return { data: [], hasError: false };
        }

        // Transform the relations into RelatedAnime objects
        // Filter out any relations where the target anime wasn't found
        const relatedAnime = relations
            .filter((rel) => rel.target_anime !== null)
            .map((rel) => ({
                relationType: rel.relation_type as AnimeRelationType,
                // Supabase returns joined data as object, cast through unknown for type safety
                anime: transformAnimeRow(
                    rel.target_anime as unknown as AnimeRow
                ),
            }));

        return { data: relatedAnime, hasError: false };
    } catch (error) {
        console.error("Error fetching related anime:", error);
        return { data: [], hasError: true };
    }
}

/**
 * Fetches a single anime by its ID
 * Includes related data: studios, streaming links, and related anime
 *
 * @param id - UUID of the anime
 * @returns Anime with relations or error
 */
export async function getAnimeById(
    id: string
): Promise<ActionResult<AnimeWithRelations>> {
    try {
        if (!id || typeof id !== "string") {
            return {
                success: false,
                error: "Invalid ID",
                code: "INVALID_INPUT",
            };
        }

        const supabase = await createClient();

        // Fetch anime with related studios via junction table
        const { data, error } = await supabase
            .from("anime")
            .select(
                `
        *,
        anime_studios(
          studio:studios(id, name, slug)
        ),
        streaming_links(id, platform, url, region)
      `
            )
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return {
                    success: false,
                    error: "Anime not found",
                    code: "NOT_FOUND",
                };
            }
            console.error("Error fetching anime by ID:", error);
            return { success: false, error: "Failed to fetch anime" };
        }

        if (!data) {
            return {
                success: false,
                error: "Anime not found",
                code: "NOT_FOUND",
            };
        }

        // Transform the response (same as getAnimeBySlug)
        const animeRow = data as AnimeRow & {
            anime_studios: Array<{
                studio: { id: string; name: string; slug: string };
            }>;
            streaming_links: Array<{
                id: string;
                platform: StreamingPlatform;
                url: string;
                region: string;
            }>;
        };

        const anime = transformAnimeRow(animeRow);

        const studios = (animeRow.anime_studios || [])
            .filter((as) => as.studio)
            .map((as) => ({
                id: as.studio.id,
                name: as.studio.name,
                slug: as.studio.slug,
            }));

        const streamingLinks = (animeRow.streaming_links || []).map((link) => ({
            id: link.id,
            animeId: anime.id,
            platform: link.platform,
            url: link.url,
            region: link.region,
        }));

        // Fetch related anime
        const relatedAnime = await fetchRelatedAnime(supabase, anime.id);

        const animeWithRelations: AnimeWithRelations = {
            ...anime,
            genres: [],
            studios,
            streamingLinks,
            relatedAnime,
        };

        return { success: true, data: animeWithRelations };
    } catch (error) {
        console.error("Error fetching anime by ID:", error);
        return { success: false, error: "Failed to fetch anime" };
    }
}

// =============================================
// Filtered Browse Functions
// =============================================

/**
 * Filter parameters for browsing anime
 * All filters are optional and can be combined
 * Multiple values in arrays use OR logic within the same filter type
 */
export interface AnimeFilters {
    /** Genre slugs to filter by (AND logic - anime must have all genres) */
    genres?: string[];
    /** Years to filter by (OR logic - anime from any of these years) */
    years?: number[];
    /** Seasons to filter by (OR logic - WINTER, SPRING, SUMMER, FALL) */
    seasons?: AnimeSeason[];
    /** Formats to filter by (OR logic - TV, MOVIE, OVA, ONA, SPECIAL, MUSIC) */
    formats?: AnimeFormat[];
    /** Statuses to filter by (OR logic - FINISHED, RELEASING, NOT_YET_RELEASED, etc.) */
    statuses?: AnimeStatus[];
    /** Text search query (searches titles) */
    search?: string;
}

/**
 * Fetches a paginated list of anime with optional filters
 * Supports filtering by genres, year, season, format, status, and text search
 * Sorted by popularity (ascending = most popular first)
 *
 * @param filters - Optional filter parameters
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page (default: 24, max: 100)
 * @returns Paginated list of anime matching filters or error
 */
export async function getFilteredAnimeList(
    filters: AnimeFilters = {},
    page: number = 1,
    pageSize: number = 24
): Promise<ActionResult<PaginatedResponse<Anime>>> {
    try {
        // Validate pagination params
        const validPage = Math.max(1, page);
        const validPageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (validPage - 1) * validPageSize;

        const supabase = await createClient();

        // Handle genre filtering separately since it requires a join
        let animeIdsFromGenres: string[] | null = null;

        if (filters.genres && filters.genres.length > 0) {
            // Get genre IDs from slugs
            const { data: genreData, error: genreError } = await supabase
                .from("genres")
                .select("id")
                .in("slug", filters.genres);

            if (genreError) {
                console.error("Error fetching genre IDs:", genreError);
                return { success: false, error: "Failed to fetch genres" };
            }

            const genreIds = (genreData || []).map((g) => g.id);

            if (genreIds.length === 0) {
                // No matching genres found, return empty result
                return {
                    success: true,
                    data: {
                        data: [],
                        pagination: {
                            page: validPage,
                            pageSize: validPageSize,
                            totalCount: 0,
                            totalPages: 0,
                            hasNextPage: false,
                            hasPreviousPage: false,
                        },
                    },
                };
            }

            // Find anime that have ALL the specified genres (AND logic)
            // For each genre, get the anime IDs, then find the intersection
            const animeIdSets: Set<string>[] = [];

            for (const genreId of genreIds) {
                const { data: animeGenreData, error: animeGenreError } =
                    await supabase
                        .from("anime_genres")
                        .select("anime_id")
                        .eq("genre_id", genreId);

                if (animeGenreError) {
                    console.error(
                        "Error fetching anime for genre:",
                        animeGenreError
                    );
                    return {
                        success: false,
                        error: "Failed to filter by genre",
                    };
                }

                animeIdSets.push(
                    new Set((animeGenreData || []).map((ag) => ag.anime_id))
                );
            }

            // Find intersection of all sets
            if (animeIdSets.length > 0) {
                animeIdsFromGenres = [...animeIdSets[0]].filter((id) =>
                    animeIdSets.every((set) => set.has(id))
                );

                if (animeIdsFromGenres.length === 0) {
                    // No anime match all genres
                    return {
                        success: true,
                        data: {
                            data: [],
                            pagination: {
                                page: validPage,
                                pageSize: validPageSize,
                                totalCount: 0,
                                totalPages: 0,
                                hasNextPage: false,
                                hasPreviousPage: false,
                            },
                        },
                    };
                }

                // For genre filtering, we need to handle pagination differently
                // since we have all matching IDs in memory already
                const totalCountFromGenres = animeIdsFromGenres.length;
                const totalPagesFromGenres = Math.ceil(
                    totalCountFromGenres / validPageSize
                );

                // Get anime details for the current page&apos;s IDs only
                // Slice the IDs array to get only what we need for this page
                const pageStartIndex = offset;
                const pageEndIndex = offset + validPageSize;
                const pageAnimeIds = animeIdsFromGenres.slice(
                    pageStartIndex,
                    pageEndIndex
                );

                if (pageAnimeIds.length === 0) {
                    // No anime for this page
                    return {
                        success: true,
                        data: {
                            data: [],
                            pagination: {
                                page: validPage,
                                pageSize: validPageSize,
                                totalCount: totalCountFromGenres,
                                totalPages: totalPagesFromGenres,
                                hasNextPage: false,
                                hasPreviousPage: validPage > 1,
                            },
                        },
                    };
                }

                // Fetch anime details for just this page&apos;s IDs
                let genreQuery = supabase.from("anime").select("*");

                // Apply other filters if present (using .in() for multi-select OR logic)
                if (filters.years && filters.years.length > 0) {
                    genreQuery = genreQuery.in("season_year", filters.years);
                }
                if (filters.seasons && filters.seasons.length > 0) {
                    const validSeasons: AnimeSeason[] = [
                        "WINTER",
                        "SPRING",
                        "SUMMER",
                        "FALL",
                    ];
                    const validFilterSeasons = filters.seasons.filter((s) =>
                        validSeasons.includes(s)
                    );
                    if (validFilterSeasons.length > 0) {
                        genreQuery = genreQuery.in(
                            "season",
                            validFilterSeasons
                        );
                    }
                }
                if (filters.formats && filters.formats.length > 0) {
                    const validFormats: AnimeFormat[] = [
                        "TV",
                        "MOVIE",
                        "OVA",
                        "ONA",
                        "SPECIAL",
                        "MUSIC",
                    ];
                    const validFilterFormats = filters.formats.filter((f) =>
                        validFormats.includes(f)
                    );
                    if (validFilterFormats.length > 0) {
                        genreQuery = genreQuery.in(
                            "format",
                            validFilterFormats
                        );
                    }
                }
                if (filters.statuses && filters.statuses.length > 0) {
                    const validStatuses: AnimeStatus[] = [
                        "FINISHED",
                        "RELEASING",
                        "NOT_YET_RELEASED",
                        "CANCELLED",
                        "HIATUS",
                    ];
                    const validFilterStatuses = filters.statuses.filter((s) =>
                        validStatuses.includes(s)
                    );
                    if (validFilterStatuses.length > 0) {
                        genreQuery = genreQuery.in(
                            "status",
                            validFilterStatuses
                        );
                    }
                }
                if (filters.search && filters.search.trim()) {
                    const searchTerm = filters.search.trim().toLowerCase();
                    genreQuery = genreQuery.or(
                        `titles->english.ilike.%${searchTerm}%,titles->romaji.ilike.%${searchTerm}%,titles->japanese.ilike.%${searchTerm}%`
                    );
                }

                // Use .in() with only the page&apos;s IDs (max ~24 items, well under limit)
                genreQuery = genreQuery.in("id", pageAnimeIds);
                genreQuery = genreQuery.order("popularity", {
                    ascending: true,
                });

                const { data: genreAnimeData, error: genreAnimeError } =
                    await genreQuery;

                if (genreAnimeError) {
                    console.error(
                        "Error fetching anime for genres:",
                        genreAnimeError
                    );
                    return {
                        success: false,
                        error: "Failed to fetch anime list",
                    };
                }

                const animeList = (genreAnimeData as AnimeRow[]).map(
                    transformAnimeRow
                );

                return {
                    success: true,
                    data: {
                        data: animeList,
                        pagination: {
                            page: validPage,
                            pageSize: validPageSize,
                            totalCount: totalCountFromGenres,
                            totalPages: totalPagesFromGenres,
                            hasNextPage: validPage < totalPagesFromGenres,
                            hasPreviousPage: validPage > 1,
                        },
                    },
                };
            }
        }

        // Build the main query (for non-genre filters or no filters)
        let query = supabase.from("anime").select("*", { count: "exact" });

        // Apply year filter (multi-select OR logic)
        if (filters.years && filters.years.length > 0) {
            query = query.in("season_year", filters.years);
        }

        // Apply season filter (multi-select OR logic)
        if (filters.seasons && filters.seasons.length > 0) {
            const validSeasons: AnimeSeason[] = [
                "WINTER",
                "SPRING",
                "SUMMER",
                "FALL",
            ];
            const validFilterSeasons = filters.seasons.filter((s) =>
                validSeasons.includes(s)
            );
            if (validFilterSeasons.length > 0) {
                query = query.in("season", validFilterSeasons);
            }
        }

        // Apply format filter (multi-select OR logic)
        if (filters.formats && filters.formats.length > 0) {
            const validFormats: AnimeFormat[] = [
                "TV",
                "MOVIE",
                "OVA",
                "ONA",
                "SPECIAL",
                "MUSIC",
            ];
            const validFilterFormats = filters.formats.filter((f) =>
                validFormats.includes(f)
            );
            if (validFilterFormats.length > 0) {
                query = query.in("format", validFilterFormats);
            }
        }

        // Apply status filter (multi-select OR logic)
        if (filters.statuses && filters.statuses.length > 0) {
            const validStatuses: AnimeStatus[] = [
                "FINISHED",
                "RELEASING",
                "NOT_YET_RELEASED",
                "CANCELLED",
                "HIATUS",
            ];
            const validFilterStatuses = filters.statuses.filter((s) =>
                validStatuses.includes(s)
            );
            if (validFilterStatuses.length > 0) {
                query = query.in("status", validFilterStatuses);
            }
        }

        // Apply text search filter (searches in titles JSONB)
        if (filters.search && filters.search.trim()) {
            const searchTerm = filters.search.trim().toLowerCase();
            // Use ilike for case-insensitive search on the titles JSONB field
            // Search in english, romaji, and japanese titles
            query = query.or(
                `titles->english.ilike.%${searchTerm}%,titles->romaji.ilike.%${searchTerm}%,titles->japanese.ilike.%${searchTerm}%`
            );
        }

        // Apply ordering and pagination
        const { data, error, count } = await query
            .order("popularity", { ascending: true })
            .range(offset, offset + validPageSize - 1);

        if (error) {
            console.error("Error fetching filtered anime list:", error);
            return { success: false, error: "Failed to fetch anime list" };
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / validPageSize);

        // Transform database rows to domain types
        const animeList = (data as AnimeRow[]).map(transformAnimeRow);

        return {
            success: true,
            data: {
                data: animeList,
                pagination: {
                    page: validPage,
                    pageSize: validPageSize,
                    totalCount,
                    totalPages,
                    hasNextPage: validPage < totalPages,
                    hasPreviousPage: validPage > 1,
                },
            },
        };
    } catch (error) {
        console.error("Error fetching filtered anime list:", error);
        return { success: false, error: "Failed to fetch anime list" };
    }
}

/**
 * Gets the available years for filtering
 * Returns distinct years from the anime database sorted descending
 *
 * @returns List of available years or error
 */
export async function getAvailableYears(): Promise<ActionResult<number[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("anime")
            .select("season_year")
            .not("season_year", "is", null);

        if (error) {
            console.error("Error fetching available years:", error);
            return { success: false, error: "Failed to fetch years" };
        }

        // Get unique years and sort descending
        const years = [
            ...new Set(
                (data || [])
                    .map((d) => d.season_year)
                    .filter((y): y is number => y !== null)
            ),
        ].sort((a, b) => b - a);

        return { success: true, data: years };
    } catch (error) {
        console.error("Error fetching available years:", error);
        return { success: false, error: "Failed to fetch years" };
    }
}
