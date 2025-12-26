#!/usr/bin/env npx tsx
/**
 * Kitsu Anime Sync CLI Script
 *
 * Manual script for syncing anime data from Kitsu to the database.
 * Can sync a specific season or all seasons for a given year.
 *
 * Usage:
 *   npx tsx scripts/sync-season.ts --year 2025                    # Sync all seasons for 2025
 *   npx tsx scripts/sync-season.ts --season winter --year 2025    # Sync Winter 2025 only
 *   npx tsx scripts/sync-season.ts -s fall -y 2024 --force        # Force refresh Fall 2024
 *   npx tsx scripts/sync-season.ts --help
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import {
    createSyncService,
    parseCliArgs,
    printCliHelp,
    formatSeasonYear,
    SEASONS_IN_ORDER,
    type SyncResult,
} from "../src/lib/kitsu";
import type { Season } from "../src/lib/kitsu";

// ============================================================================
// Main Function
// ============================================================================

async function main(): Promise<void> {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = parseCliArgs(args);

    // Show help if requested
    if (options.help) {
        printCliHelp();
        process.exit(0);
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error(
            "Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set"
        );
        console.error(
            "Make sure you have a .env.local file with the required variables"
        );
        process.exit(1);
    }

    if (!process.env.SUPABASE_SECRET_KEY) {
        console.error(
            "Error: SUPABASE_SECRET_KEY environment variable is not set"
        );
        console.error(
            "Make sure you have a .env.local file with the required variables"
        );
        process.exit(1);
    }

    // Year is required
    if (!options.year) {
        console.error("Error: --year (-y) argument is required");
        console.error("");
        console.error("Usage:");
        console.error(
            "  npx tsx scripts/sync-season.ts --year 2025                 # Sync all seasons"
        );
        console.error(
            "  npx tsx scripts/sync-season.ts --season winter --year 2025 # Sync specific season"
        );
        console.error("");
        console.error("Run with --help for more information.");
        process.exit(1);
    }

    const year = options.year;

    // Determine which seasons to sync
    const seasonsToSync: Season[] = options.season
        ? [options.season]
        : [...SEASONS_IN_ORDER]; // All seasons if none specified

    const isSingleSeason = seasonsToSync.length === 1;

    console.log("\n" + "=".repeat(60));
    console.log("  Kitsu Anime Sync Script");
    console.log("=".repeat(60));
    console.log(`  Year: ${year}`);
    console.log(
        `  Season(s): ${
            isSingleSeason
                ? formatSeasonYear(seasonsToSync[0], year)
                : `All (${seasonsToSync.join(", ")})`
        }`
    );
    console.log(`  Force Refresh: ${options.forceRefresh ? "Yes" : "No"}`);
    console.log("=".repeat(60) + "\n");

    try {
        // Create sync service
        const syncService = createSyncService();

        // Track overall results
        const results: SyncResult[] = [];
        let totalAnimeUpserted = 0;
        let totalAnimeFailed = 0;
        let totalCacheHits = 0;
        let totalApiCalls = 0;
        const startTime = Date.now();

        // Sync each season
        for (const season of seasonsToSync) {
            const seasonDisplay = formatSeasonYear(season, year);
            console.log(`\nSyncing ${seasonDisplay}...`);
            console.log("-".repeat(40));

            const result = await syncService.syncSeason({
                season,
                year,
                forceRefresh: options.forceRefresh,
            });

            results.push(result);

            if (result.success) {
                totalAnimeUpserted += result.dbStats.animeUpserted;
                totalAnimeFailed += result.dbStats.animeFailed;
                totalCacheHits += result.fetchStats.cacheHits;
                totalApiCalls += result.fetchStats.cacheMisses;

                console.log(
                    `  ✓ ${seasonDisplay}: ${result.dbStats.animeUpserted} anime synced`
                );
            } else {
                console.log(`  ✗ ${seasonDisplay}: FAILED - ${result.error}`);
            }
        }

        const totalDuration = Date.now() - startTime;

        // Print summary
        console.log("\n" + "=".repeat(60));
        console.log("  Sync Summary");
        console.log("=".repeat(60));

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.length - successCount;

        console.log(`  Seasons processed: ${results.length}`);
        console.log(`  Successful: ${successCount}`);
        console.log(`  Failed: ${failCount}`);
        console.log(`  Total duration: ${(totalDuration / 1000).toFixed(2)}s`);
        console.log("");
        console.log("  Totals:");
        console.log(`    - Anime upserted: ${totalAnimeUpserted}`);
        console.log(`    - Anime failed: ${totalAnimeFailed}`);
        console.log(`    - Cache hits: ${totalCacheHits}`);
        console.log(`    - API calls: ${totalApiCalls}`);

        // Print individual season results
        if (!isSingleSeason) {
            console.log("");
            console.log("  By Season:");
            for (const result of results) {
                const status = result.success ? "✓" : "✗";
                const anime = result.success
                    ? `${result.dbStats.animeUpserted} anime`
                    : result.error;
                console.log(`    ${status} ${result.seasonDisplay}: ${anime}`);
            }
        }

        // Print errors if any
        const allErrors = results.flatMap((r) => r.dbStats.errors);
        if (allErrors.length > 0) {
            console.log("");
            console.log("  Errors:");
            for (const error of allErrors.slice(0, 10)) {
                console.log(`    - ${error}`);
            }
            if (allErrors.length > 10) {
                console.log(`    ... and ${allErrors.length - 10} more errors`);
            }
        }

        console.log("=".repeat(60) + "\n");

        // Clean up expired cache entries
        console.log("Cleaning up expired cache entries...");
        const cleanedUp = await syncService.cleanupCache();
        if (cleanedUp > 0) {
            console.log(`Cleaned up ${cleanedUp} expired cache entries`);
        } else {
            console.log("No expired cache entries to clean up");
        }

        // Exit with appropriate code
        const hasFailures = failCount > 0;
        process.exit(hasFailures ? 1 : 0);
    } catch (error) {
        console.error("\nFatal error:", error);
        process.exit(1);
    }
}

// ============================================================================
// Run
// ============================================================================

main();
