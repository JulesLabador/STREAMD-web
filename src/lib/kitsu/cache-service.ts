/**
 * Kitsu Cache Service
 *
 * Manages caching of Kitsu API responses in Supabase to minimize API calls.
 * Cache entries expire after 30 days.
 */

import { createClient } from "@supabase/supabase-js";
import type {
    CacheKeyParams,
    CachedResponse,
    KitsuAnimeListResponse,
    Season,
} from "./types";

// ============================================================================
// Constants
// ============================================================================

/** Cache TTL in days */
const CACHE_TTL_DAYS = 7;

/** Cache key prefix */
const CACHE_KEY_PREFIX = "kitsu:anime";

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a cache lookup
 */
export interface CacheLookupResult {
    /** Whether a valid cache entry was found */
    hit: boolean;
    /** The cached response data (if hit) */
    data: KitsuAnimeListResponse | null;
    /** The cache key used for lookup */
    cacheKey: string;
}

/**
 * Statistics about cache operations
 */
export interface CacheStats {
    /** Number of cache hits */
    hits: number;
    /** Number of cache misses */
    misses: number;
    /** Total entries in cache */
    totalEntries: number;
    /** Number of expired entries */
    expiredEntries: number;
}

// ============================================================================
// Cache Key Functions
// ============================================================================

/**
 * Generates a cache key for a season/year/page combination
 *
 * @param params - Cache key parameters
 * @returns Cache key string (e.g., "kitsu:anime:winter:2025:page:1")
 */
export function generateCacheKey(params: CacheKeyParams): string {
    const { season, year, page } = params;
    return `${CACHE_KEY_PREFIX}:${season}:${year}:page:${page}`;
}

/**
 * Parses a cache key into its components
 *
 * @param cacheKey - Cache key string
 * @returns Parsed components or null if invalid
 */
export function parseCacheKey(cacheKey: string): CacheKeyParams | null {
    const pattern = new RegExp(
        `^${CACHE_KEY_PREFIX}:(winter|spring|summer|fall):(\\d{4}):page:(\\d+)$`
    );
    const match = cacheKey.match(pattern);

    if (!match) return null;

    return {
        season: match[1] as Season,
        year: parseInt(match[2], 10),
        page: parseInt(match[3], 10),
    };
}

/**
 * Generates a pattern for matching all cache keys for a season/year
 *
 * @param season - The season
 * @param year - The year
 * @returns Pattern string for matching cache keys
 */
export function generateSeasonCachePattern(
    season: Season,
    year: number
): string {
    return `${CACHE_KEY_PREFIX}:${season}:${year}:page:%`;
}

// ============================================================================
// Cache Service Class
// ============================================================================

/**
 * Service for managing Kitsu response cache in Supabase
 */
export class KitsuCacheService {
    private supabase;

    /**
     * Creates a new cache service instance
     *
     * @param supabaseUrl - Supabase project URL
     * @param supabaseKey - Supabase service role key
     */
    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    /**
     * Gets a cached response if it exists and hasn't expired
     *
     * @param params - Cache key parameters
     * @returns Cache lookup result
     */
    async get(params: CacheKeyParams): Promise<CacheLookupResult> {
        const cacheKey = generateCacheKey(params);

        try {
            const { data, error } = await this.supabase
                .from("kitsu_response_cache")
                .select("*")
                .eq("cache_key", cacheKey)
                .gt("expires_at", new Date().toISOString())
                .single();

            if (error || !data) {
                return { hit: false, data: null, cacheKey };
            }

            const cached = data as CachedResponse;
            console.log(`[KitsuCache] Cache HIT for ${cacheKey}`);

            return {
                hit: true,
                data: cached.response,
                cacheKey,
            };
        } catch (error) {
            console.error(`[KitsuCache] Error reading cache: ${error}`);
            return { hit: false, data: null, cacheKey };
        }
    }

    /**
     * Stores a response in the cache
     *
     * @param params - Cache key parameters
     * @param response - Kitsu API response to cache
     * @returns True if successfully cached
     */
    async set(
        params: CacheKeyParams,
        response: KitsuAnimeListResponse
    ): Promise<boolean> {
        const cacheKey = generateCacheKey(params);
        const now = new Date();
        const expiresAt = new Date(
            now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
        );

        try {
            const { error } = await this.supabase
                .from("kitsu_response_cache")
                .upsert(
                    {
                        cache_key: cacheKey,
                        response: response,
                        created_at: now.toISOString(),
                        expires_at: expiresAt.toISOString(),
                    },
                    { onConflict: "cache_key" }
                );

            if (error) {
                console.error(
                    `[KitsuCache] Error writing cache for ${cacheKey}: ${error.message}`
                );
                return false;
            }

            console.log(`[KitsuCache] Cached response for ${cacheKey}`);
            return true;
        } catch (error) {
            console.error(`[KitsuCache] Error writing cache: ${error}`);
            return false;
        }
    }

    /**
     * Invalidates (deletes) a specific cache entry
     *
     * @param params - Cache key parameters
     * @returns True if successfully invalidated
     */
    async invalidate(params: CacheKeyParams): Promise<boolean> {
        const cacheKey = generateCacheKey(params);

        try {
            const { error } = await this.supabase
                .from("kitsu_response_cache")
                .delete()
                .eq("cache_key", cacheKey);

            if (error) {
                console.error(
                    `[KitsuCache] Error invalidating cache for ${cacheKey}: ${error.message}`
                );
                return false;
            }

            console.log(`[KitsuCache] Invalidated cache for ${cacheKey}`);
            return true;
        } catch (error) {
            console.error(`[KitsuCache] Error invalidating cache: ${error}`);
            return false;
        }
    }

    /**
     * Invalidates all cache entries for a specific season/year
     *
     * @param season - The season
     * @param year - The year
     * @returns Number of entries deleted
     */
    async invalidateSeason(season: Season, year: number): Promise<number> {
        const pattern = generateSeasonCachePattern(season, year);

        try {
            const { data, error } = await this.supabase
                .from("kitsu_response_cache")
                .delete()
                .like("cache_key", pattern)
                .select("id");

            if (error) {
                console.error(
                    `[KitsuCache] Error invalidating season cache: ${error.message}`
                );
                return 0;
            }

            const count = data?.length || 0;
            console.log(
                `[KitsuCache] Invalidated ${count} cache entries for ${season} ${year}`
            );
            return count;
        } catch (error) {
            console.error(
                `[KitsuCache] Error invalidating season cache: ${error}`
            );
            return 0;
        }
    }

    /**
     * Cleans up expired cache entries
     *
     * @returns Number of entries deleted
     */
    async cleanupExpired(): Promise<number> {
        try {
            const { data, error } = await this.supabase
                .from("kitsu_response_cache")
                .delete()
                .lt("expires_at", new Date().toISOString())
                .select("id");

            if (error) {
                console.error(
                    `[KitsuCache] Error cleaning up expired entries: ${error.message}`
                );
                return 0;
            }

            const count = data?.length || 0;
            if (count > 0) {
                console.log(
                    `[KitsuCache] Cleaned up ${count} expired cache entries`
                );
            }
            return count;
        } catch (error) {
            console.error(
                `[KitsuCache] Error cleaning up expired entries: ${error}`
            );
            return 0;
        }
    }

    /**
     * Gets cache statistics
     *
     * @returns Cache statistics
     */
    async getStats(): Promise<CacheStats> {
        try {
            const now = new Date().toISOString();

            // Get total count
            const { count: totalEntries } = await this.supabase
                .from("kitsu_response_cache")
                .select("*", { count: "exact", head: true });

            // Get expired count
            const { count: expiredEntries } = await this.supabase
                .from("kitsu_response_cache")
                .select("*", { count: "exact", head: true })
                .lt("expires_at", now);

            return {
                hits: 0, // Would need to track this separately
                misses: 0, // Would need to track this separately
                totalEntries: totalEntries || 0,
                expiredEntries: expiredEntries || 0,
            };
        } catch (error) {
            console.error(`[KitsuCache] Error getting stats: ${error}`);
            return {
                hits: 0,
                misses: 0,
                totalEntries: 0,
                expiredEntries: 0,
            };
        }
    }

    /**
     * Checks if a cache entry exists and is valid
     *
     * @param params - Cache key parameters
     * @returns True if valid cache entry exists
     */
    async exists(params: CacheKeyParams): Promise<boolean> {
        const cacheKey = generateCacheKey(params);

        try {
            const { count, error } = await this.supabase
                .from("kitsu_response_cache")
                .select("*", { count: "exact", head: true })
                .eq("cache_key", cacheKey)
                .gt("expires_at", new Date().toISOString());

            if (error) return false;
            return (count || 0) > 0;
        } catch {
            return false;
        }
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a cache service instance using environment variables
 *
 * @returns KitsuCacheService instance
 * @throws Error if environment variables are not set
 */
export function createCacheService(): KitsuCacheService {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required"
        );
    }

    return new KitsuCacheService(supabaseUrl, supabaseKey);
}
