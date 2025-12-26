/**
 * Kitsu Sync Service
 *
 * Orchestrates the full sync flow: fetch from Kitsu (with caching) -> transform -> save to database.
 */

import {
    CachedKitsuClient,
    createCachedKitsuClient,
    SyncStats,
} from "./cached-client";
import { KitsuDbService, createDbService, DbSyncResult } from "./db-service";
import { transformResponses, TransformResult } from "./transformer";
import {
    getCurrentSeasonFilter,
    formatSeasonYear,
    isValidSeason,
    isValidYear,
    parseSeason,
} from "./season-utils";
import type { Season, SeasonFilter } from "./types";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for sync operations
 */
export interface SyncOptions {
    /** Force refresh from API (bypass cache) */
    forceRefresh?: boolean;
    /** Season to sync (defaults to current) */
    season?: Season;
    /** Year to sync (defaults to current) */
    year?: number;
}

/**
 * Result of a complete sync operation
 */
export interface SyncResult {
    /** Whether the sync was successful */
    success: boolean;
    /** Season that was synced */
    season: Season;
    /** Year that was synced */
    year: number;
    /** Formatted season string (e.g., "Winter 2025") */
    seasonDisplay: string;
    /** Statistics from fetching */
    fetchStats: SyncStats;
    /** Statistics from database operations */
    dbStats: DbSyncResult;
    /** Total duration in milliseconds */
    durationMs: number;
    /** Error message if failed */
    error?: string;
}

// ============================================================================
// Sync Service Class
// ============================================================================

/**
 * Service for synchronizing anime data from Kitsu to the database
 */
export class KitsuSyncService {
    private cachedClient: CachedKitsuClient;
    private dbService: KitsuDbService;

    /**
     * Creates a new sync service instance
     *
     * @param cachedClient - Cached Kitsu client (optional)
     * @param dbService - Database service (optional)
     */
    constructor(cachedClient?: CachedKitsuClient, dbService?: KitsuDbService) {
        this.cachedClient = cachedClient || createCachedKitsuClient();
        this.dbService = dbService || createDbService();
    }

    /**
     * Syncs anime data for a specific season
     *
     * @param options - Sync options
     * @returns Sync result with statistics
     */
    async syncSeason(options: SyncOptions = {}): Promise<SyncResult> {
        const startTime = Date.now();

        // Determine season and year
        const currentFilter = getCurrentSeasonFilter();
        const season = options.season || currentFilter.season;
        const year = options.year || currentFilter.year;
        const seasonDisplay = formatSeasonYear(season, year);

        console.log(`\n${"=".repeat(60)}`);
        console.log(`[KitsuSync] Starting sync for ${seasonDisplay}`);
        console.log(`${"=".repeat(60)}`);

        try {
            // Step 1: Fetch data from Kitsu (with caching)
            console.log(`\n[KitsuSync] Step 1: Fetching data from Kitsu...`);
            const { responses, stats: fetchStats } =
                await this.cachedClient.fetchAllPages(
                    { season, year },
                    { forceRefresh: options.forceRefresh }
                );

            if (responses.length === 0) {
                console.log(`[KitsuSync] No data found for ${seasonDisplay}`);
                return {
                    success: true,
                    season,
                    year,
                    seasonDisplay,
                    fetchStats: {
                        totalPages: 0,
                        cacheHits: 0,
                        cacheMisses: 0,
                        totalAnime: 0,
                    },
                    dbStats: {
                        animeUpserted: 0,
                        animeFailed: 0,
                        genresCreated: 0,
                        animeGenreLinksCreated: 0,
                        errors: [],
                    },
                    durationMs: Date.now() - startTime,
                };
            }

            // Step 2: Transform data
            console.log(
                `\n[KitsuSync] Step 2: Transforming ${fetchStats.totalAnime} anime...`
            );
            const transformResult: TransformResult = transformResponses(
                responses,
                season,
                year
            );

            console.log(
                `[KitsuSync] Transformed: ${transformResult.anime.length} anime, ` +
                    `${transformResult.genres.length} genres`
            );

            // Step 3: Save to database
            console.log(`\n[KitsuSync] Step 3: Saving to database...`);
            const dbStats = await this.dbService.syncTransformResult(
                transformResult
            );

            // Calculate duration
            const durationMs = Date.now() - startTime;

            // Log summary
            console.log(`\n${"=".repeat(60)}`);
            console.log(`[KitsuSync] Sync complete for ${seasonDisplay}`);
            console.log(`${"=".repeat(60)}`);
            console.log(`  Duration: ${(durationMs / 1000).toFixed(2)}s`);
            console.log(`  Pages fetched: ${fetchStats.totalPages}`);
            console.log(`  Cache hits: ${fetchStats.cacheHits}`);
            console.log(`  API calls: ${fetchStats.cacheMisses}`);
            console.log(`  Anime upserted: ${dbStats.animeUpserted}`);
            console.log(`  Anime failed: ${dbStats.animeFailed}`);
            console.log(`  Genres: ${dbStats.genresCreated}`);
            console.log(`  Genre links: ${dbStats.animeGenreLinksCreated}`);
            console.log(`${"=".repeat(60)}\n`);

            return {
                success: true,
                season,
                year,
                seasonDisplay,
                fetchStats,
                dbStats,
                durationMs,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.error(`[KitsuSync] Sync failed: ${errorMessage}`);

            return {
                success: false,
                season,
                year,
                seasonDisplay,
                fetchStats: {
                    totalPages: 0,
                    cacheHits: 0,
                    cacheMisses: 0,
                    totalAnime: 0,
                },
                dbStats: {
                    animeUpserted: 0,
                    animeFailed: 0,
                    genresCreated: 0,
                    animeGenreLinksCreated: 0,
                    errors: [errorMessage],
                },
                durationMs: Date.now() - startTime,
                error: errorMessage,
            };
        }
    }

    /**
     * Syncs the current season
     *
     * @param forceRefresh - Force refresh from API
     * @returns Sync result
     */
    async syncCurrentSeason(forceRefresh = false): Promise<SyncResult> {
        return this.syncSeason({ forceRefresh });
    }

    /**
     * Syncs multiple seasons
     *
     * @param seasons - Array of season filters to sync
     * @param forceRefresh - Force refresh from API
     * @returns Array of sync results
     */
    async syncMultipleSeasons(
        seasons: SeasonFilter[],
        forceRefresh = false
    ): Promise<SyncResult[]> {
        const results: SyncResult[] = [];

        for (const filter of seasons) {
            const result = await this.syncSeason({
                season: filter.season,
                year: filter.year,
                forceRefresh,
            });
            results.push(result);
        }

        return results;
    }

    /**
     * Cleans up expired cache entries
     *
     * @returns Number of entries cleaned up
     */
    async cleanupCache(): Promise<number> {
        return this.cachedClient.cleanupCache();
    }

    /**
     * Gets cache statistics
     */
    async getCacheStats() {
        return this.cachedClient.getCacheStats();
    }

    /**
     * Gets database statistics
     */
    async getDbStats() {
        const totalAnime = await this.dbService.countAnime();
        return { totalAnime };
    }

    /**
     * Invalidates cache for a specific season
     *
     * @param season - The season
     * @param year - The year
     * @returns Number of entries invalidated
     */
    async invalidateSeasonCache(season: Season, year: number): Promise<number> {
        return this.cachedClient.invalidateSeasonCache(season, year);
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a sync service instance
 *
 * @returns KitsuSyncService instance
 */
export function createSyncService(): KitsuSyncService {
    return new KitsuSyncService();
}

// ============================================================================
// CLI Helper Functions
// ============================================================================

/**
 * Parses command line arguments for sync options
 *
 * @param args - Command line arguments (process.argv.slice(2))
 * @returns Parsed sync options
 */
export function parseCliArgs(args: string[]): SyncOptions & { help: boolean } {
    const options: SyncOptions & { help: boolean } = {
        help: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === "--help" || arg === "-h") {
            options.help = true;
        } else if (arg === "--force" || arg === "-f") {
            options.forceRefresh = true;
        } else if (arg === "--season" || arg === "-s") {
            const value = args[++i];
            if (value) {
                const parsed = parseSeason(value);
                if (parsed) {
                    options.season = parsed;
                } else {
                    console.error(`Invalid season: ${value}`);
                    console.error(
                        "Valid seasons: winter, spring, summer, fall"
                    );
                    process.exit(1);
                }
            }
        } else if (arg === "--year" || arg === "-y") {
            const value = args[++i];
            if (value) {
                const year = parseInt(value, 10);
                if (isValidYear(year)) {
                    options.year = year;
                } else {
                    console.error(`Invalid year: ${value}`);
                    process.exit(1);
                }
            }
        }
    }

    return options;
}

/**
 * Prints CLI help message
 */
export function printCliHelp(): void {
    console.log(`
Kitsu Anime Sync Script

Usage: npx tsx scripts/sync-season.ts --year <year> [options]

Options:
  -y, --year <year>      Year to sync (REQUIRED)
  -s, --season <season>  Season to sync (winter, spring, summer, fall)
                         If omitted, syncs all 4 seasons for the year
  -f, --force            Force refresh from API (bypass cache)
  -h, --help             Show this help message

Examples:
  npx tsx scripts/sync-season.ts --year 2025                    # Sync all seasons for 2025
  npx tsx scripts/sync-season.ts --season winter --year 2025    # Sync Winter 2025 only
  npx tsx scripts/sync-season.ts -s fall -y 2024 --force        # Force refresh Fall 2024
`);
}
