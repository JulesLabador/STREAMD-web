"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    Anime,
    AnimeRow,
    AnimeSeason,
    AnimeWithRelations,
    GenreWithCount,
    PlatformInfo,
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
    pageSize: number = 20,
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
 * Includes related data: studios and streaming links
 *
 * @param slug - URL-friendly identifier for the anime
 * @returns Anime with relations or error
 */
export async function getAnimeBySlug(
    slug: string,
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
      `,
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

        const animeWithRelations: AnimeWithRelations = {
            ...anime,
            genres: [], // Genres not implemented in current schema
            studios,
            streamingLinks,
        };

        return { success: true, data: animeWithRelations };
    } catch (error) {
        console.error("Error fetching anime by slug:", error);
        return { success: false, error: "Failed to fetch anime" };
    }
}

/**
 * Fetches a single anime by its ID
 *
 * @param id - UUID of the anime
 * @returns Anime with relations or error
 */
export async function getAnimeById(
    id: string,
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
      `,
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

        const animeWithRelations: AnimeWithRelations = {
            ...anime,
            genres: [],
            studios,
            streamingLinks,
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
      `,
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
    pageSize: number = 24,
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
                                (totalCount || 0) / validPageSize,
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
                        row.season_year,
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
    pageSize: number = 24,
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
      `,
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
    pageSize: number = 24,
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
    pageSize: number = 24,
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
            offset + validPageSize,
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
