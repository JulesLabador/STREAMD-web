/**
 * Cached Kitsu Client
 *
 * Wraps the raw Kitsu client with a cache-first strategy.
 * Checks the database cache before making API calls.
 */

import { KitsuClient } from "./client";
import {
    KitsuCacheService,
    createCacheService,
    generateCacheKey,
} from "./cache-service";
import type {
    KitsuAnimeListResponse,
    Season,
    SeasonFilter,
    CacheKeyParams,
} from "./types";

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a cached fetch operation
 */
export interface CachedFetchResult {
    /** The fetched data */
    data: KitsuAnimeListResponse;
    /** Whether the data came from cache */
    fromCache: boolean;
    /** The cache key used */
    cacheKey: string;
}

/**
 * Statistics for a sync operation
 */
export interface SyncStats {
    /** Total pages fetched */
    totalPages: number;
    /** Pages served from cache */
    cacheHits: number;
    /** Pages fetched from API */
    cacheMisses: number;
    /** Total anime records */
    totalAnime: number;
}

/**
 * Options for cached fetch operations
 */
export interface CachedFetchOptions {
    /** Force bypass cache and fetch from API */
    forceRefresh?: boolean;
    /** Include related resources */
    include?: string[];
}

// ============================================================================
// Cached Client Class
// ============================================================================

/**
 * Kitsu client with caching layer
 */
export class CachedKitsuClient {
    private client: KitsuClient;
    private cache: KitsuCacheService;

    /**
     * Creates a new cached client instance
     *
     * @param client - Raw Kitsu client (optional, creates new if not provided)
     * @param cache - Cache service (optional, creates new if not provided)
     */
    constructor(client?: KitsuClient, cache?: KitsuCacheService) {
        this.client = client || new KitsuClient();
        this.cache = cache || createCacheService();
    }

    /**
     * Fetches a single page with cache-first strategy
     *
     * @param params - Cache key parameters (season, year, page)
     * @param options - Fetch options
     * @returns Cached fetch result
     */
    async fetchPage(
        params: CacheKeyParams,
        options: CachedFetchOptions = {}
    ): Promise<CachedFetchResult> {
        const { forceRefresh = false, include = [] } = options;
        const cacheKey = generateCacheKey(params);

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = await this.cache.get(params);
            if (cached.hit && cached.data) {
                return {
                    data: cached.data,
                    fromCache: true,
                    cacheKey,
                };
            }
        }

        // Cache miss or force refresh - fetch from API
        console.log(
            `[CachedKitsuClient] Cache ${
                forceRefresh ? "bypassed" : "miss"
            } for ${cacheKey}, fetching from API`
        );

        const data = await this.client.fetchSeasonAnimePage({
            season: params.season,
            year: params.year,
            page: params.page,
            include,
        });

        // Store in cache
        await this.cache.set(params, data);

        return {
            data,
            fromCache: false,
            cacheKey,
        };
    }

    /**
     * Fetches all pages for a season with cache-first strategy
     *
     * @param seasonFilter - Season and year to fetch
     * @param options - Fetch options
     * @returns Array of all responses and sync statistics
     */
    async fetchAllPages(
        seasonFilter: SeasonFilter,
        options: CachedFetchOptions = {}
    ): Promise<{ responses: KitsuAnimeListResponse[]; stats: SyncStats }> {
        const { forceRefresh = false, include = ["genres", "categories"] } =
            options;

        const responses: KitsuAnimeListResponse[] = [];
        let page = 1;
        let hasMore = true;
        let cacheHits = 0;
        let cacheMisses = 0;
        let totalAnime = 0;

        console.log(
            `[CachedKitsuClient] Starting fetch for ${seasonFilter.season} ${seasonFilter.year}` +
                (forceRefresh ? " (force refresh)" : "")
        );

        while (hasMore) {
            const params: CacheKeyParams = {
                season: seasonFilter.season,
                year: seasonFilter.year,
                page,
            };

            const result = await this.fetchPage(params, {
                forceRefresh,
                include,
            });

            responses.push(result.data);
            totalAnime += result.data.data.length;

            if (result.fromCache) {
                cacheHits++;
            } else {
                cacheMisses++;
            }

            // Check if there are more pages
            hasMore = !!result.data.links.next;
            page++;

            // Safety limit
            if (page > 100) {
                console.warn(
                    "[CachedKitsuClient] Reached maximum page limit (100)"
                );
                break;
            }
        }

        const stats: SyncStats = {
            totalPages: responses.length,
            cacheHits,
            cacheMisses,
            totalAnime,
        };

        console.log(
            `[CachedKitsuClient] Completed: ${stats.totalPages} pages, ` +
                `${stats.cacheHits} cache hits, ${stats.cacheMisses} API calls, ` +
                `${stats.totalAnime} anime`
        );

        return { responses, stats };
    }

    /**
     * Invalidates cache for a specific season and fetches fresh data
     *
     * @param seasonFilter - Season and year to refresh
     * @param include - Related resources to include
     * @returns Fresh responses and sync statistics
     */
    async refreshSeason(
        seasonFilter: SeasonFilter,
        include: string[] = ["genres", "categories"]
    ): Promise<{ responses: KitsuAnimeListResponse[]; stats: SyncStats }> {
        // Invalidate existing cache
        await this.cache.invalidateSeason(
            seasonFilter.season,
            seasonFilter.year
        );

        // Fetch fresh data
        return this.fetchAllPages(seasonFilter, {
            forceRefresh: true,
            include,
        });
    }

    /**
     * Cleans up expired cache entries
     *
     * @returns Number of entries cleaned up
     */
    async cleanupCache(): Promise<number> {
        return this.cache.cleanupExpired();
    }

    /**
     * Gets cache statistics
     */
    async getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Checks if cache exists for a specific page
     *
     * @param params - Cache key parameters
     * @returns True if valid cache exists
     */
    async hasCachedPage(params: CacheKeyParams): Promise<boolean> {
        return this.cache.exists(params);
    }

    /**
     * Invalidates cache for a specific season
     *
     * @param season - The season
     * @param year - The year
     * @returns Number of entries invalidated
     */
    async invalidateSeasonCache(season: Season, year: number): Promise<number> {
        return this.cache.invalidateSeason(season, year);
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a cached Kitsu client instance
 *
 * @returns CachedKitsuClient instance
 */
export function createCachedKitsuClient(): CachedKitsuClient {
    return new CachedKitsuClient();
}
