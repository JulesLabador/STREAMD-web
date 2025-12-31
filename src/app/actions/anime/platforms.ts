"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    Anime,
    AnimeRow,
    PlatformInfo,
    StreamingPlatform,
} from "@/types/anime";
import type { ActionResult, PaginatedResponse } from "@/types/common";
import { createPlatformSlug, transformAnimeRow } from "@/types/anime";
import { getPlatformName } from "@/lib/anime-utils";

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

