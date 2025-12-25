"use server";

import {
    algoliaClient,
    ANIME_INDEX,
    type AnimeSearchDocument,
} from "@/lib/algolia/client";
import type { Anime } from "@/types/anime";
import type { ActionResult } from "@/types/common";

/**
 * Searches anime using Algolia
 *
 * Provides fast, typo-tolerant search across anime titles (English, Romaji, Japanese).
 * Results are ranked by relevance and popularity.
 *
 * @param query - The search query string
 * @param limit - Maximum number of results to return (default: 10, max: 50)
 * @returns ActionResult containing array of matching Anime objects
 */
export async function searchAnime(
    query: string,
    limit: number = 10
): Promise<ActionResult<Anime[]>> {
    try {
        // Return empty results for empty/whitespace queries
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            return { success: true, data: [] };
        }

        // Clamp limit to reasonable bounds
        const validLimit = Math.min(50, Math.max(1, limit));

        // Search Algolia index
        const result =
            await algoliaClient.searchSingleIndex<AnimeSearchDocument>({
                indexName: ANIME_INDEX,
                searchParams: {
                    query: trimmedQuery,
                    hitsPerPage: validLimit,
                },
            });

        // Transform search results to Anime type
        // Note: Some fields are not stored in the search index,
        // so we provide default values for them
        const anime: Anime[] = result.hits.map((hit) => ({
            id: hit.objectID,
            slug: hit.slug,
            titles: hit.titles,
            format: hit.format as Anime["format"],
            status: hit.status as Anime["status"],
            season: hit.season as Anime["season"],
            seasonYear: hit.seasonYear,
            popularity: hit.popularity,
            averageRating: hit.averageRating,
            coverImageUrl: hit.coverImageUrl,
            episodeCount: hit.episodeCount,
            // Fields not in search index - provide defaults
            episodeDuration: null,
            startDate: null,
            endDate: null,
            synopsis: null,
            malId: null,
            anilistId: null,
            kitsuId: null,
            bannerImageUrl: null,
            createdAt: "",
            updatedAt: "",
        }));

        return { success: true, data: anime };
    } catch (error) {
        console.error("Search error:", error);

        // Provide user-friendly error message
        const errorMessage =
            error instanceof Error
                ? error.message
                : "An unexpected error occurred";

        // Check for common Algolia errors
        if (
            errorMessage.includes("Invalid Application-ID") ||
            errorMessage.includes("Invalid API key")
        ) {
            return {
                success: false,
                error: "Search service configuration error. Please contact support.",
                code: "SEARCH_CONFIG_ERROR",
            };
        }

        if (
            errorMessage.includes("ECONNREFUSED") ||
            errorMessage.includes("network")
        ) {
            return {
                success: false,
                error: "Search service is unavailable. Please try again later.",
                code: "SEARCH_UNAVAILABLE",
            };
        }

        return {
            success: false,
            error: "Search failed. Please try again.",
            code: "SEARCH_ERROR",
        };
    }
}
