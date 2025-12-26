/**
 * Kitsu API Client
 *
 * A rate-limited client for the Kitsu.io API with exponential backoff retry logic.
 * Respects API limits by making at most 1 request every 2 seconds.
 */

import type {
    KitsuAnimeListResponse,
    KitsuErrorResponse,
    Season,
    SeasonFilter,
} from "./types";
import {
    RateLimiter,
    calculateBackoff,
    isRetryableHttpStatus,
    sleep,
} from "@/lib/rate-limiter";

// ============================================================================
// Constants
// ============================================================================

/** Base URL for Kitsu API */
const KITSU_API_BASE = "https://kitsu.io/api/edge";

/** Minimum delay between requests in milliseconds (1 request per 2 seconds) */
const RATE_LIMIT_DELAY_MS = 2000;

/** Maximum number of retry attempts */
const MAX_RETRIES = 5;

/** Maximum backoff delay in milliseconds */
const MAX_BACKOFF_MS = 32000;

/** Default page size for API requests */
const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// Types
// ============================================================================

/**
 * Options for fetching anime by season
 */
export interface FetchSeasonAnimeOptions {
    /** The season to fetch */
    season: Season;
    /** The year to fetch */
    year: number;
    /** Page number (1-indexed) */
    page?: number;
    /** Number of items per page (max 20) */
    pageSize?: number;
    /** Include related resources */
    include?: string[];
}

/**
 * Result of a single page fetch
 */
export interface FetchPageResult {
    data: KitsuAnimeListResponse;
    fromCache: boolean;
}

// ============================================================================
// Rate Limiter Instance
// ============================================================================

/**
 * Global rate limiter for Kitsu API requests
 * Configured for 1 request per 2 seconds
 */
const kitsuRateLimiter = new RateLimiter({
    minDelayMs: RATE_LIMIT_DELAY_MS,
    name: "KitsuAPI",
});

// ============================================================================
// Kitsu Client Class
// ============================================================================

/**
 * Client for interacting with the Kitsu API
 */
export class KitsuClient {
    /**
     * Makes a rate-limited request to the Kitsu API with retry logic
     *
     * @param url - Full URL to request
     * @returns Parsed JSON response
     * @throws Error if all retries fail
     */
    private async request<T>(url: string): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                // Wait for rate limiter
                await kitsuRateLimiter.waitForSlot();

                // Make the request
                const response = await fetch(url, {
                    headers: {
                        Accept: "application/vnd.api+json",
                        "Content-Type": "application/vnd.api+json",
                    },
                });

                // Handle non-OK responses
                if (!response.ok) {
                    // Check if retryable
                    if (
                        isRetryableHttpStatus(response.status) &&
                        attempt < MAX_RETRIES
                    ) {
                        const backoff = calculateBackoff(attempt, {
                            maxDelayMs: MAX_BACKOFF_MS,
                        });
                        console.warn(
                            `[KitsuClient] Request failed with status ${response.status}, ` +
                                `retrying in ${backoff}ms (attempt ${
                                    attempt + 1
                                }/${MAX_RETRIES})`
                        );
                        await sleep(backoff);
                        continue;
                    }

                    // Parse error response if possible
                    let errorMessage = `HTTP ${response.status}`;
                    try {
                        const errorData =
                            (await response.json()) as KitsuErrorResponse;
                        if (errorData.errors?.[0]?.detail) {
                            errorMessage = errorData.errors[0].detail;
                        }
                    } catch {
                        // Ignore JSON parse errors
                    }

                    throw new Error(
                        `Kitsu API error: ${errorMessage} (status: ${response.status})`
                    );
                }

                // Parse and return successful response
                return (await response.json()) as T;
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));

                // Check if it's a network error (no status code)
                const isNetworkError =
                    !("status" in (error as object)) &&
                    (error instanceof TypeError ||
                        lastError.message.includes("fetch"));

                if (isNetworkError && attempt < MAX_RETRIES) {
                    const backoff = calculateBackoff(attempt, {
                        maxDelayMs: MAX_BACKOFF_MS,
                    });
                    console.warn(
                        `[KitsuClient] Network error, retrying in ${backoff}ms ` +
                            `(attempt ${attempt + 1}/${MAX_RETRIES}): ${
                                lastError.message
                            }`
                    );
                    await sleep(backoff);
                    continue;
                }

                // If not retryable or out of retries, throw
                if (attempt === MAX_RETRIES) {
                    throw lastError;
                }
            }
        }

        throw lastError || new Error("Unknown error during request");
    }

    /**
     * Builds the URL for fetching anime by season
     *
     * @param options - Fetch options
     * @returns Full URL with query parameters
     */
    private buildSeasonAnimeUrl(options: FetchSeasonAnimeOptions): string {
        const {
            season,
            year,
            page = 1,
            pageSize = DEFAULT_PAGE_SIZE,
            include = [],
        } = options;

        const params = new URLSearchParams();

        // Season and year filters
        params.set("filter[season]", season);
        params.set("filter[seasonYear]", year.toString());

        // Pagination (Kitsu uses offset-based pagination)
        const offset = (page - 1) * pageSize;
        params.set("page[limit]", pageSize.toString());
        params.set("page[offset]", offset.toString());

        // Sort by popularity (most popular first)
        params.set("sort", "-userCount");

        // Include related resources if specified
        if (include.length > 0) {
            params.set("include", include.join(","));
        }

        return `${KITSU_API_BASE}/anime?${params.toString()}`;
    }

    /**
     * Fetches a single page of anime for a given season
     *
     * @param options - Fetch options including season, year, and page
     * @returns Kitsu API response for the page
     */
    async fetchSeasonAnimePage(
        options: FetchSeasonAnimeOptions
    ): Promise<KitsuAnimeListResponse> {
        const url = this.buildSeasonAnimeUrl(options);
        console.log(
            `[KitsuClient] Fetching page ${options.page || 1} for ${
                options.season
            } ${options.year}`
        );
        return this.request<KitsuAnimeListResponse>(url);
    }

    /**
     * Fetches all pages of anime for a given season
     *
     * @param seasonFilter - Season and year to fetch
     * @param include - Related resources to include
     * @returns Array of all anime from all pages
     */
    async fetchAllSeasonAnime(
        seasonFilter: SeasonFilter,
        include: string[] = []
    ): Promise<KitsuAnimeListResponse[]> {
        const allResponses: KitsuAnimeListResponse[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await this.fetchSeasonAnimePage({
                ...seasonFilter,
                page,
                include,
            });

            allResponses.push(response);

            // Check if there are more pages
            hasMore = !!response.links.next;
            page++;

            // Safety limit to prevent infinite loops
            if (page > 100) {
                console.warn(
                    "[KitsuClient] Reached maximum page limit (100), stopping pagination"
                );
                break;
            }
        }

        console.log(
            `[KitsuClient] Fetched ${allResponses.length} pages for ${seasonFilter.season} ${seasonFilter.year}`
        );

        return allResponses;
    }

    /**
     * Fetches anime with genres included
     *
     * @param seasonFilter - Season and year to fetch
     * @returns All anime responses with genres included
     */
    async fetchSeasonAnimeWithGenres(
        seasonFilter: SeasonFilter
    ): Promise<KitsuAnimeListResponse[]> {
        return this.fetchAllSeasonAnime(seasonFilter, ["genres", "categories"]);
    }

    /**
     * Fetches anime with all related data (genres, productions/studios)
     *
     * @param seasonFilter - Season and year to fetch
     * @returns All anime responses with related data included
     */
    async fetchSeasonAnimeWithRelations(
        seasonFilter: SeasonFilter
    ): Promise<KitsuAnimeListResponse[]> {
        // Note: Including too many relations can slow down the API
        // We include genres and categories, but productions/studios
        // require separate API calls
        return this.fetchAllSeasonAnime(seasonFilter, ["genres", "categories"]);
    }

    /**
     * Gets the current rate limiter statistics
     */
    getRateLimiterStats() {
        return kitsuRateLimiter.getStats();
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Default Kitsu client instance
 */
export const kitsuClient = new KitsuClient();
