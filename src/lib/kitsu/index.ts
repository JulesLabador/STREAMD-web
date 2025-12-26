/**
 * Kitsu Module Exports
 *
 * Central export file for the Kitsu sync system.
 */

// Types
export type {
    KitsuAnime,
    KitsuAnimeListResponse,
    KitsuGenre,
    KitsuCategory,
    Season,
    SeasonFilter,
    CacheKeyParams,
    CachedResponse,
} from "./types";

// Season utilities
export {
    getCurrentSeason,
    getCurrentYear,
    getCurrentSeasonFilter,
    getSeasonForDate,
    getSeasonStartDate,
    getSeasonEndDate,
    getPreviousSeason,
    getNextSeason,
    isValidSeason,
    isValidYear,
    parseSeason,
    formatSeasonYear,
    createSeasonSlug,
    parseSeasonSlug,
    SEASONS_IN_ORDER,
} from "./season-utils";

// Kitsu client
export { KitsuClient, kitsuClient } from "./client";
export type { FetchSeasonAnimeOptions, FetchPageResult } from "./client";

// Cache service
export {
    KitsuCacheService,
    createCacheService,
    generateCacheKey,
    parseCacheKey,
} from "./cache-service";
export type { CacheLookupResult, CacheStats } from "./cache-service";

// Cached client
export { CachedKitsuClient, createCachedKitsuClient } from "./cached-client";
export type {
    CachedFetchResult,
    SyncStats,
    CachedFetchOptions,
} from "./cached-client";

// Transformer
export {
    transformAnime,
    transformResponse,
    transformResponses,
    extractGenres,
    buildAnimeGenreMap,
    mapFormat,
    mapStatus,
    mapSeason,
    generateSlug,
    scaleRating,
} from "./transformer";
export type {
    TransformedAnime,
    TransformedGenre,
    TransformedStudio,
    TransformResult,
} from "./transformer";

// Database service
export { KitsuDbService, createDbService } from "./db-service";
export type { DbSyncResult } from "./db-service";

// Sync service
export {
    KitsuSyncService,
    createSyncService,
    parseCliArgs,
    printCliHelp,
} from "./sync-service";
export type { SyncOptions, SyncResult } from "./sync-service";
