"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    Anime,
    AnimeRow,
    AnimeSeason,
    Studio,
    StudioWithCount,
} from "@/types/anime";
import type { ActionResult, PaginatedResponse } from "@/types/common";
import { transformAnimeRow } from "@/types/anime";

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

/**
 * Determines the current anime season based on the current date
 *
 * @returns Object with current season and year
 */
function getCurrentSeasonInfo(): { season: AnimeSeason; year: number } {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let season: AnimeSeason;
    if (currentMonth >= 1 && currentMonth <= 3) {
        season = "WINTER";
    } else if (currentMonth >= 4 && currentMonth <= 6) {
        season = "SPRING";
    } else if (currentMonth >= 7 && currentMonth <= 9) {
        season = "SUMMER";
    } else {
        season = "FALL";
    }

    return { season, year: currentYear };
}

/**
 * Fetches studios with the most anime in the current season
 * Used for the "Trending Studios" section on the home page
 *
 * @param limit - Maximum number of studios to return (default: 6)
 * @returns List of studios with their current season anime count
 */
export async function getCurrentSeasonStudios(
    limit: number = 6
): Promise<ActionResult<StudioWithCount[]>> {
    try {
        const validLimit = Math.min(20, Math.max(1, limit));
        const { season, year } = getCurrentSeasonInfo();

        const supabase = await createClient();

        // Get anime IDs for current season
        const { data: seasonAnime, error: seasonError } = await supabase
            .from("anime")
            .select("id")
            .eq("season", season)
            .eq("season_year", year);

        if (seasonError) {
            console.error("Error fetching season anime:", seasonError);
            return { success: false, error: "Failed to fetch studios" };
        }

        const animeIds = (seasonAnime || []).map((a) => a.id);

        if (animeIds.length === 0) {
            return { success: true, data: [] };
        }

        // Get studio counts for these anime
        const { data: studioLinks, error: linksError } = await supabase
            .from("anime_studios")
            .select(
                `
                studio_id,
                studios(id, name, slug)
            `
            )
            .in("anime_id", animeIds);

        if (linksError) {
            console.error("Error fetching studio links:", linksError);
            return { success: false, error: "Failed to fetch studios" };
        }

        // Count anime per studio
        const studioCountMap = new Map<
            string,
            { studio: Studio; count: number }
        >();

        for (const link of studioLinks || []) {
            const studio = link.studios as unknown as Studio;
            if (!studio) continue;

            const existing = studioCountMap.get(studio.id);
            if (existing) {
                existing.count++;
            } else {
                studioCountMap.set(studio.id, { studio, count: 1 });
            }
        }

        // Convert to array, sort by count, and limit
        const studios: StudioWithCount[] = Array.from(studioCountMap.values())
            .map(({ studio, count }) => ({
                id: studio.id,
                name: studio.name,
                slug: studio.slug,
                animeCount: count,
            }))
            .sort((a, b) => b.animeCount - a.animeCount)
            .slice(0, validLimit);

        return { success: true, data: studios };
    } catch (error) {
        console.error("Error fetching current season studios:", error);
        return { success: false, error: "Failed to fetch studios" };
    }
}

