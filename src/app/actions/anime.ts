"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    Anime,
    AnimeRelationType,
    AnimeRow,
    AnimeSeason,
    AnimeWithPlanningCount,
    AnimeWithRelations,
    GenreWithCount,
    NextSeasonStats,
    PlatformInfo,
    RelatedAnimeResult,
    SeasonInfo,
    StreamingPlatform,
    Studio,
    StudioWithCount,
} from "@/types/anime";
import type { ActionResult, PaginatedResponse } from "@/types/common";
import {
    createPlatformSlug,
    createSeasonSlug,
    transformAnimeRow,
} from "@/types/anime";
import { getPlatformName } from "@/lib/anime-utils";

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
        console.error("Error fetching anime by short ID:", error);
        return { success: false, error: "Failed to fetch anime" };
    }
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
// Studio Browse Actions
// =============================================

/**
 * Fetches all studios with their anime counts
 * Sorted alphabetically by name
 *
 * @returns List of studios with anime counts or error
 */
export async function getStudios(): Promise<ActionResult<StudioWithCount[]>> {
    try {
        const supabase = await createClient();

        // Fetch studios with anime count via junction table
        const { data, error } = await supabase
            .from("studios")
            .select(
                `
        id,
        name,
        slug,
        anime_studios(count)
      `
            )
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching studios:", error);
            return { success: false, error: "Failed to fetch studios" };
        }

        // Transform to StudioWithCount
        const studios: StudioWithCount[] = (data || []).map((studio) => ({
            id: studio.id,
            name: studio.name,
            slug: studio.slug,
            animeCount:
                (studio.anime_studios as Array<{ count: number }>)?.[0]
                    ?.count || 0,
        }));

        // Filter out studios with no anime
        const studiosWithAnime = studios.filter((s) => s.animeCount > 0);

        return { success: true, data: studiosWithAnime };
    } catch (error) {
        console.error("Error fetching studios:", error);
        return { success: false, error: "Failed to fetch studios" };
    }
}

/**
 * Fetches a studio by slug with paginated anime list
 *
 * @param slug - Studio slug
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Studio with paginated anime or error
 */
export async function getStudioBySlug(
    slug: string,
    page: number = 1,
    pageSize: number = 24
): Promise<ActionResult<{ studio: Studio; anime: PaginatedResponse<Anime> }>> {
    try {
        if (!slug || typeof slug !== "string") {
            return {
                success: false,
                error: "Invalid slug",
                code: "INVALID_INPUT",
            };
        }

        const validPage = Math.max(1, page);
        const validPageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (validPage - 1) * validPageSize;

        const supabase = await createClient();

        // First, get the studio
        const { data: studioData, error: studioError } = await supabase
            .from("studios")
            .select("id, name, slug")
            .eq("slug", slug)
            .single();

        if (studioError) {
            if (studioError.code === "PGRST116") {
                return {
                    success: false,
                    error: "Studio not found",
                    code: "NOT_FOUND",
                };
            }
            console.error("Error fetching studio:", studioError);
            return { success: false, error: "Failed to fetch studio" };
        }

        // Get total count of anime for this studio
        const { count: totalCount, error: countError } = await supabase
            .from("anime_studios")
            .select("*", { count: "exact", head: true })
            .eq("studio_id", studioData.id);

        if (countError) {
            console.error("Error counting anime:", countError);
            return { success: false, error: "Failed to count anime" };
        }

        // Fetch paginated anime for this studio
        // Get anime IDs first, then fetch anime data
        const { data: animeIds, error: idsError } = await supabase
            .from("anime_studios")
            .select("anime_id")
            .eq("studio_id", studioData.id)
            .range(offset, offset + validPageSize - 1);

        if (idsError) {
            console.error("Error fetching anime IDs:", idsError);
            return { success: false, error: "Failed to fetch anime" };
        }

        // Fetch anime data by IDs
        const ids = (animeIds || []).map((row) => row.anime_id);

        if (ids.length === 0) {
            return {
                success: true,
                data: {
                    studio: studioData,
                    anime: {
                        data: [],
                        pagination: {
                            page: validPage,
                            pageSize: validPageSize,
                            totalCount: totalCount || 0,
                            totalPages: Math.ceil(
                                (totalCount || 0) / validPageSize
                            ),
                            hasNextPage: false,
                            hasPreviousPage: validPage > 1,
                        },
                    },
                },
            };
        }

        const { data: animeData, error: animeError } = await supabase
            .from("anime")
            .select("*")
            .in("id", ids)
            .order("popularity", { ascending: true });

        if (animeError) {
            console.error("Error fetching anime:", animeError);
            return { success: false, error: "Failed to fetch anime" };
        }

        // Transform anime data
        const animeList = (animeData as AnimeRow[]).map(transformAnimeRow);

        const total = totalCount || 0;
        const totalPages = Math.ceil(total / validPageSize);

        return {
            success: true,
            data: {
                studio: studioData,
                anime: {
                    data: animeList,
                    pagination: {
                        page: validPage,
                        pageSize: validPageSize,
                        totalCount: total,
                        totalPages,
                        hasNextPage: validPage < totalPages,
                        hasPreviousPage: validPage > 1,
                    },
                },
            },
        };
    } catch (error) {
        console.error("Error fetching studio by slug:", error);
        return { success: false, error: "Failed to fetch studio" };
    }
}

// =============================================
// Season Browse Actions
// =============================================

/**
 * Fetches all unique season/year combinations with anime counts
 * Sorted by year (descending) then season order
 *
 * @returns List of seasons with anime counts or error
 */
export async function getSeasons(): Promise<ActionResult<SeasonInfo[]>> {
    try {
        const supabase = await createClient();

        // Fetch distinct season/year combinations with counts
        const { data, error } = await supabase
            .from("anime")
            .select("season, season_year")
            .not("season", "is", null)
            .not("season_year", "is", null);

        if (error) {
            console.error("Error fetching seasons:", error);
            return { success: false, error: "Failed to fetch seasons" };
        }

        // Group by season/year and count
        const seasonMap = new Map<string, SeasonInfo>();
        const seasonOrder: Record<AnimeSeason, number> = {
            WINTER: 0,
            SPRING: 1,
            SUMMER: 2,
            FALL: 3,
        };

        for (const row of data || []) {
            if (!row.season || !row.season_year) continue;

            const key = `${row.season}-${row.season_year}`;
            const existing = seasonMap.get(key);

            if (existing) {
                existing.animeCount++;
            } else {
                seasonMap.set(key, {
                    season: row.season as AnimeSeason,
                    year: row.season_year,
                    slug: createSeasonSlug(
                        row.season as AnimeSeason,
                        row.season_year
                    ),
                    animeCount: 1,
                });
            }
        }

        // Convert to array and sort by year (desc) then season order
        const seasons = Array.from(seasonMap.values()).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return seasonOrder[b.season] - seasonOrder[a.season];
        });

        return { success: true, data: seasons };
    } catch (error) {
        console.error("Error fetching seasons:", error);
        return { success: false, error: "Failed to fetch seasons" };
    }
}

/**
 * Fetches anime for a specific season/year
 *
 * @param season - The anime season
 * @param year - The year
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated anime list or error
 */
export async function getAnimeBySeason(
    season: AnimeSeason,
    year: number,
    page: number = 1,
    pageSize: number = 24
): Promise<
    ActionResult<{ seasonInfo: SeasonInfo; anime: PaginatedResponse<Anime> }>
> {
    try {
        const validSeasons: AnimeSeason[] = [
            "WINTER",
            "SPRING",
            "SUMMER",
            "FALL",
        ];
        if (!validSeasons.includes(season)) {
            return {
                success: false,
                error: "Invalid season",
                code: "INVALID_INPUT",
            };
        }

        const validPage = Math.max(1, page);
        const validPageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (validPage - 1) * validPageSize;

        const supabase = await createClient();

        // Fetch anime with count
        const { data, error, count } = await supabase
            .from("anime")
            .select("*", { count: "exact" })
            .eq("season", season)
            .eq("season_year", year)
            .order("popularity", { ascending: true })
            .range(offset, offset + validPageSize - 1);

        if (error) {
            console.error("Error fetching anime by season:", error);
            return { success: false, error: "Failed to fetch anime" };
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / validPageSize);

        const animeList = (data as AnimeRow[]).map(transformAnimeRow);

        return {
            success: true,
            data: {
                seasonInfo: {
                    season,
                    year,
                    slug: createSeasonSlug(season, year),
                    animeCount: totalCount,
                },
                anime: {
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
            },
        };
    } catch (error) {
        console.error("Error fetching anime by season:", error);
        return { success: false, error: "Failed to fetch anime" };
    }
}

// =============================================
// Genre Browse Actions
// =============================================

/**
 * Fetches all genres with their anime counts
 * Sorted alphabetically by name
 *
 * @returns List of genres with anime counts or error
 */
export async function getGenres(): Promise<ActionResult<GenreWithCount[]>> {
    try {
        const supabase = await createClient();

        // Fetch genres with anime count via junction table
        const { data, error } = await supabase
            .from("genres")
            .select(
                `
        id,
        name,
        slug,
        anime_genres(count)
      `
            )
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching genres:", error);
            return { success: false, error: "Failed to fetch genres" };
        }

        // Transform to GenreWithCount
        const genres: GenreWithCount[] = (data || []).map((genre) => ({
            id: genre.id,
            name: genre.name,
            slug: genre.slug,
            animeCount:
                (genre.anime_genres as Array<{ count: number }>)?.[0]?.count ||
                0,
        }));

        // Filter out genres with no anime
        const genresWithAnime = genres.filter((g) => g.animeCount > 0);

        return { success: true, data: genresWithAnime };
    } catch (error) {
        console.error("Error fetching genres:", error);
        return { success: false, error: "Failed to fetch genres" };
    }
}

/**
 * Fetches a genre by slug with paginated anime list
 *
 * @param slug - Genre slug
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Genre with paginated anime or error
 */
export async function getGenreBySlug(
    slug: string,
    page: number = 1,
    pageSize: number = 24
): Promise<
    ActionResult<{
        genre: { id: string; name: string; slug: string };
        anime: PaginatedResponse<Anime>;
    }>
> {
    try {
        if (!slug || typeof slug !== "string") {
            return {
                success: false,
                error: "Invalid slug",
                code: "INVALID_INPUT",
            };
        }

        const validPage = Math.max(1, page);
        const validPageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (validPage - 1) * validPageSize;

        const supabase = await createClient();

        // First, get the genre
        const { data: genreData, error: genreError } = await supabase
            .from("genres")
            .select("id, name, slug")
            .eq("slug", slug)
            .single();

        if (genreError) {
            if (genreError.code === "PGRST116") {
                return {
                    success: false,
                    error: "Genre not found",
                    code: "NOT_FOUND",
                };
            }
            console.error("Error fetching genre:", genreError);
            return { success: false, error: "Failed to fetch genre" };
        }

        // Get total count of anime for this genre
        const { count: totalCount, error: countError } = await supabase
            .from("anime_genres")
            .select("*", { count: "exact", head: true })
            .eq("genre_id", genreData.id);

        if (countError) {
            console.error("Error counting anime:", countError);
            return { success: false, error: "Failed to count anime" };
        }

        // Fetch paginated anime for this genre
        // Get anime IDs first, then fetch anime data
        const { data: animeIds, error: idsError } = await supabase
            .from("anime_genres")
            .select("anime_id")
            .eq("genre_id", genreData.id)
            .range(offset, offset + validPageSize - 1);

        if (idsError) {
            console.error("Error fetching anime IDs:", idsError);
            return { success: false, error: "Failed to fetch anime" };
        }

        const total = totalCount || 0;
        const totalPages = Math.ceil(total / validPageSize);

        // Fetch anime data by IDs
        const ids = (animeIds || []).map((row) => row.anime_id);

        if (ids.length === 0) {
            return {
                success: true,
                data: {
                    genre: genreData,
                    anime: {
                        data: [],
                        pagination: {
                            page: validPage,
                            pageSize: validPageSize,
                            totalCount: total,
                            totalPages,
                            hasNextPage: false,
                            hasPreviousPage: validPage > 1,
                        },
                    },
                },
            };
        }

        const { data: animeData, error: animeError } = await supabase
            .from("anime")
            .select("*")
            .in("id", ids)
            .order("popularity", { ascending: true });

        if (animeError) {
            console.error("Error fetching anime:", animeError);
            return { success: false, error: "Failed to fetch anime" };
        }

        // Transform anime data
        const animeList = (animeData as AnimeRow[]).map(transformAnimeRow);

        return {
            success: true,
            data: {
                genre: genreData,
                anime: {
                    data: animeList,
                    pagination: {
                        page: validPage,
                        pageSize: validPageSize,
                        totalCount: total,
                        totalPages,
                        hasNextPage: validPage < totalPages,
                        hasPreviousPage: validPage > 1,
                    },
                },
            },
        };
    } catch (error) {
        console.error("Error fetching genre by slug:", error);
        return { success: false, error: "Failed to fetch genre" };
    }
}

// =============================================
// Platform Browse Actions
// =============================================

/**
 * Fetches all streaming platforms with their anime counts
 *
 * @returns List of platforms with anime counts or error
 */
export async function getPlatforms(): Promise<ActionResult<PlatformInfo[]>> {
    try {
        const supabase = await createClient();

        // Fetch streaming links with platform and anime_id to count unique anime per platform
        const { data: linksWithAnime, error: linksError } = await supabase
            .from("streaming_links")
            .select("platform, anime_id");

        if (linksError) {
            console.error("Error fetching streaming links:", linksError);
            return { success: false, error: "Failed to fetch platforms" };
        }

        // Count unique anime per platform
        const platformCounts = new Map<StreamingPlatform, Set<string>>();

        for (const link of linksWithAnime || []) {
            const platform = link.platform as StreamingPlatform;
            if (!platformCounts.has(platform)) {
                platformCounts.set(platform, new Set());
            }
            platformCounts.get(platform)!.add(link.anime_id);
        }

        // Transform to PlatformInfo array
        const platforms: PlatformInfo[] = Array.from(platformCounts.entries())
            .map(([platform, animeIds]) => ({
                platform,
                slug: createPlatformSlug(platform),
                name: getPlatformName(platform),
                animeCount: animeIds.size,
            }))
            .filter((p) => p.animeCount > 0)
            .sort((a, b) => b.animeCount - a.animeCount);

        return { success: true, data: platforms };
    } catch (error) {
        console.error("Error fetching platforms:", error);
        return { success: false, error: "Failed to fetch platforms" };
    }
}

/**
 * Fetches anime for a specific streaming platform
 *
 * @param platform - The streaming platform
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Platform info with paginated anime or error
 */
export async function getAnimeByPlatform(
    platform: StreamingPlatform,
    page: number = 1,
    pageSize: number = 24
): Promise<
    ActionResult<{
        platformInfo: PlatformInfo;
        anime: PaginatedResponse<Anime>;
    }>
> {
    try {
        const validPlatforms: StreamingPlatform[] = [
            "CRUNCHYROLL",
            "FUNIMATION",
            "NETFLIX",
            "HULU",
            "AMAZON",
            "HIDIVE",
            "OTHER",
        ];

        if (!validPlatforms.includes(platform)) {
            return {
                success: false,
                error: "Invalid platform",
                code: "INVALID_INPUT",
            };
        }

        const validPage = Math.max(1, page);
        const validPageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (validPage - 1) * validPageSize;

        const supabase = await createClient();

        // Get unique anime IDs for this platform
        const { data: links, error: linksError } = await supabase
            .from("streaming_links")
            .select("anime_id")
            .eq("platform", platform);

        if (linksError) {
            console.error("Error fetching streaming links:", linksError);
            return { success: false, error: "Failed to fetch anime" };
        }

        // Get unique anime IDs
        const animeIds = [...new Set((links || []).map((l) => l.anime_id))];
        const totalCount = animeIds.length;

        if (totalCount === 0) {
            return {
                success: true,
                data: {
                    platformInfo: {
                        platform,
                        slug: createPlatformSlug(platform),
                        name: getPlatformName(platform),
                        animeCount: 0,
                    },
                    anime: {
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
                },
            };
        }

        // Paginate the anime IDs first to avoid HeadersOverflowError
        // when passing too many IDs to the .in() filter
        const paginatedAnimeIds = animeIds.slice(
            offset,
            offset + validPageSize
        );

        // Fetch paginated anime using only the subset of IDs for this page
        const { data: animeData, error: animeError } = await supabase
            .from("anime")
            .select("*")
            .in("id", paginatedAnimeIds)
            .order("popularity", { ascending: true });

        if (animeError) {
            console.error("Error fetching anime:", animeError);
            return { success: false, error: "Failed to fetch anime" };
        }

        const animeList = (animeData as AnimeRow[]).map(transformAnimeRow);
        const totalPages = Math.ceil(totalCount / validPageSize);

        return {
            success: true,
            data: {
                platformInfo: {
                    platform,
                    slug: createPlatformSlug(platform),
                    name: getPlatformName(platform),
                    animeCount: totalCount,
                },
                anime: {
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
            },
        };
    } catch (error) {
        console.error("Error fetching anime by platform:", error);
        return { success: false, error: "Failed to fetch anime" };
    }
}

// =============================================
// Upcoming Anime Actions
// =============================================

/**
 * Fetches anime that are currently releasing or not yet released
 * Sorted by start date (ascending) to show soonest first
 *
 * @param limit - Maximum number of anime to return (default: 12)
 * @returns List of upcoming/releasing anime or error
 */
export async function getUpcomingAnime(
    limit: number = 12
): Promise<ActionResult<Anime[]>> {
    try {
        const validLimit = Math.min(50, Math.max(1, limit));

        const supabase = await createClient();

        // Fetch anime with status RELEASING or NOT_YET_RELEASED
        // Sort by start_date ascending (soonest first), then by popularity
        const { data, error } = await supabase
            .from("anime")
            .select("*")
            .in("status", ["RELEASING", "NOT_YET_RELEASED"])
            .order("start_date", { ascending: true, nullsFirst: false })
            .order("popularity", { ascending: true })
            .limit(validLimit);

        if (error) {
            console.error("Error fetching upcoming anime:", error);
            return { success: false, error: "Failed to fetch upcoming anime" };
        }

        // Transform database rows to domain types
        const animeList = (data as AnimeRow[]).map(transformAnimeRow);

        return { success: true, data: animeList };
    } catch (error) {
        console.error("Error fetching upcoming anime:", error);
        return { success: false, error: "Failed to fetch upcoming anime" };
    }
}

/**
 * Gets anime counts for current and upcoming seasons
 * Used for the upcoming page hero section
 *
 * @returns Object with current season info and next seasons info
 */
export async function getUpcomingSeasonStats(): Promise<
    ActionResult<{
        currentSeason: SeasonInfo | null;
        nextSeasons: SeasonInfo[];
    }>
> {
    try {
        const supabase = await createClient();

        // Get current date info
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Determine current season
        let currentSeasonName: AnimeSeason;
        if (currentMonth >= 1 && currentMonth <= 3) {
            currentSeasonName = "WINTER";
        } else if (currentMonth >= 4 && currentMonth <= 6) {
            currentSeasonName = "SPRING";
        } else if (currentMonth >= 7 && currentMonth <= 9) {
            currentSeasonName = "SUMMER";
        } else {
            currentSeasonName = "FALL";
        }

        // Fetch all season/year combinations for current and future
        const { data, error } = await supabase
            .from("anime")
            .select("season, season_year")
            .not("season", "is", null)
            .not("season_year", "is", null)
            .gte("season_year", currentYear);

        if (error) {
            console.error("Error fetching season stats:", error);
            return { success: false, error: "Failed to fetch season stats" };
        }

        // Group by season/year and count
        const seasonMap = new Map<string, SeasonInfo>();
        const seasonOrder: Record<AnimeSeason, number> = {
            WINTER: 0,
            SPRING: 1,
            SUMMER: 2,
            FALL: 3,
        };

        for (const row of data || []) {
            if (!row.season || !row.season_year) continue;

            const key = `${row.season}-${row.season_year}`;
            const existing = seasonMap.get(key);

            if (existing) {
                existing.animeCount++;
            } else {
                seasonMap.set(key, {
                    season: row.season as AnimeSeason,
                    year: row.season_year,
                    slug: createSeasonSlug(
                        row.season as AnimeSeason,
                        row.season_year
                    ),
                    animeCount: 1,
                });
            }
        }

        // Convert to array and sort chronologically
        const allSeasons = Array.from(seasonMap.values()).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return seasonOrder[a.season] - seasonOrder[b.season];
        });

        // Find current season
        const currentSeasonKey = `${currentSeasonName}-${currentYear}`;
        const currentSeason = seasonMap.get(currentSeasonKey) || null;

        // Get next seasons (up to 3 future seasons after current)
        const currentSeasonIndex = allSeasons.findIndex(
            (s) => s.season === currentSeasonName && s.year === currentYear
        );

        let nextSeasons: SeasonInfo[] = [];
        if (currentSeasonIndex !== -1) {
            nextSeasons = allSeasons.slice(
                currentSeasonIndex + 1,
                currentSeasonIndex + 4
            );
        } else {
            // If current season not found, get all future seasons
            nextSeasons = allSeasons
                .filter((s) => {
                    if (s.year > currentYear) return true;
                    if (s.year === currentYear) {
                        return (
                            seasonOrder[s.season] >
                            seasonOrder[currentSeasonName]
                        );
                    }
                    return false;
                })
                .slice(0, 3);
        }

        return {
            success: true,
            data: {
                currentSeason,
                nextSeasons,
            },
        };
    } catch (error) {
        console.error("Error fetching upcoming season stats:", error);
        return { success: false, error: "Failed to fetch season stats" };
    }
}

/**
 * Gets detailed statistics for the next upcoming season
 * Includes user planning counts, format breakdown, and most anticipated anime
 *
 * @param limit - Maximum number of most anticipated anime to return (default: 6)
 * @returns Next season stats with most anticipated anime
 */
export async function getNextSeasonStats(
    limit: number = 6
): Promise<ActionResult<NextSeasonStats>> {
    try {
        const validLimit = Math.min(12, Math.max(1, limit));
        const supabase = await createClient();

        // Get current date info to determine next season
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Determine current and next season
        const seasonOrder: AnimeSeason[] = [
            "WINTER",
            "SPRING",
            "SUMMER",
            "FALL",
        ];
        let currentSeasonIndex: number;

        if (currentMonth >= 1 && currentMonth <= 3) {
            currentSeasonIndex = 0; // WINTER
        } else if (currentMonth >= 4 && currentMonth <= 6) {
            currentSeasonIndex = 1; // SPRING
        } else if (currentMonth >= 7 && currentMonth <= 9) {
            currentSeasonIndex = 2; // SUMMER
        } else {
            currentSeasonIndex = 3; // FALL
        }

        // Calculate next season
        const nextSeasonIndex = (currentSeasonIndex + 1) % 4;
        const nextSeason = seasonOrder[nextSeasonIndex];
        const nextYear = nextSeasonIndex === 0 ? currentYear + 1 : currentYear;

        // Calculate season start date and days until start
        const seasonStartMonths: Record<AnimeSeason, number> = {
            WINTER: 0, // January
            SPRING: 3, // April
            SUMMER: 6, // July
            FALL: 9, // October
        };
        const startDate = new Date(nextYear, seasonStartMonths[nextSeason], 1);
        const daysUntilStart = Math.max(
            0,
            Math.ceil(
                (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
        );

        // Fetch anime for next season
        const { data: animeData, error: animeError } = await supabase
            .from("anime")
            .select("*")
            .eq("season", nextSeason)
            .eq("season_year", nextYear);

        if (animeError) {
            console.error("Error fetching next season anime:", animeError);
            return {
                success: false,
                error: "Failed to fetch next season data",
            };
        }

        const animeCount = animeData?.length || 0;

        // Get anime IDs for this season
        const animeIds = (animeData || []).map((a) => a.id);

        // Calculate format breakdown
        const formatBreakdown: Record<string, number> = {};
        for (const anime of animeData || []) {
            const format = anime.format || "UNKNOWN";
            formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
        }

        // Count sequels vs new series (based on title patterns)
        // A sequel typically has "Season", "Part", "2nd", "3rd", etc. in the title
        let sequelCount = 0;
        let newSeriesCount = 0;
        const sequelPatterns =
            /season\s*\d|part\s*\d|\d+(st|nd|rd|th)\s*season|cour\s*\d|ii|iii|iv|2nd|3rd|4th/i;

        for (const anime of animeData || []) {
            const titles = anime.titles as {
                english?: string;
                romaji?: string;
            };
            const titleToCheck = titles?.english || titles?.romaji || "";
            if (sequelPatterns.test(titleToCheck)) {
                sequelCount++;
            } else {
                newSeriesCount++;
            }
        }

        // Calculate average popularity
        const totalPopularity = (animeData || []).reduce(
            (sum, a) => sum + (a.popularity || 0),
            0
        );
        const avgPopularity =
            animeCount > 0 ? Math.round(totalPopularity / animeCount) : 0;

        // Fetch planning counts for these anime from user_anime table
        const planningCounts = new Map<string, number>();
        let totalUsersPlanning = 0;
        let totalPlanningEntries = 0;

        if (animeIds.length > 0) {
            // Get count of users with PLANNING status for each anime
            const { data: planningData, error: planningError } = await supabase
                .from("user_anime")
                .select("anime_id, user_id")
                .in("anime_id", animeIds)
                .eq("status", "PLANNING")
                .eq("is_private", false);

            if (!planningError && planningData) {
                // Total planning entries
                totalPlanningEntries = planningData.length;

                // Count planning entries per anime
                for (const entry of planningData) {
                    const current = planningCounts.get(entry.anime_id) || 0;
                    planningCounts.set(entry.anime_id, current + 1);
                }

                // Count unique users planning any anime in this season
                const uniqueUsers = new Set(planningData.map((e) => e.user_id));
                totalUsersPlanning = uniqueUsers.size;
            }
        }

        // Transform anime and add planning counts
        const animeWithCounts: AnimeWithPlanningCount[] = (
            animeData as AnimeRow[]
        )
            .map((row) => ({
                ...transformAnimeRow(row),
                planningCount: planningCounts.get(row.id) || 0,
            }))
            // Sort by planning count (desc), then by popularity (asc)
            .sort((a, b) => {
                if (b.planningCount !== a.planningCount) {
                    return b.planningCount - a.planningCount;
                }
                return a.popularity - b.popularity;
            })
            .slice(0, validLimit);

        return {
            success: true,
            data: {
                season: {
                    season: nextSeason,
                    year: nextYear,
                    slug: createSeasonSlug(nextSeason, nextYear),
                    animeCount,
                },
                usersPlanning: totalUsersPlanning,
                totalPlanningEntries,
                mostAnticipated: animeWithCounts,
                daysUntilStart,
                startDate: startDate.toISOString(),
                formatBreakdown,
                sequelCount,
                newSeriesCount,
                avgPopularity,
            },
        };
    } catch (error) {
        console.error("Error fetching next season stats:", error);
        return { success: false, error: "Failed to fetch next season stats" };
    }
}

// =============================================
// Filtered Browse Actions
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
 * Valid anime format values
 */
type AnimeFormat = "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL" | "MUSIC";

/**
 * Valid anime status values
 */
type AnimeStatus =
    | "FINISHED"
    | "RELEASING"
    | "NOT_YET_RELEASED"
    | "CANCELLED"
    | "HIATUS";

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

                // Get anime details for the current page's IDs only
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

                // Fetch anime details for just this page's IDs
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

                // Use .in() with only the page's IDs (max ~24 items, well under limit)
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
