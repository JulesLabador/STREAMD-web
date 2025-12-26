/**
 * Kitsu Anime Sync Cron Route
 *
 * Vercel cron endpoint for weekly anime database updates.
 * Triggered automatically by Vercel cron or manually via POST request.
 *
 * Security: Protected by CRON_SECRET environment variable.
 */

import { NextRequest, NextResponse } from "next/server";
import {
    createSyncService,
    getCurrentSeasonFilter,
    formatSeasonYear,
} from "@/lib/kitsu";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Maximum execution time for the cron job (in seconds)
 * Vercel hobby plan allows up to 10s, Pro allows up to 60s
 */
export const maxDuration = 60;

/**
 * Disable static generation for this route
 */
export const dynamic = "force-dynamic";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates the cron secret from the request
 *
 * @param request - Incoming request
 * @returns True if the request is authorized
 */
function isAuthorized(request: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;

    // If no secret is configured, allow in development
    if (!cronSecret) {
        if (process.env.NODE_ENV === "development") {
            console.warn(
                "[CronSync] No CRON_SECRET configured, allowing in development"
            );
            return true;
        }
        console.error("[CronSync] CRON_SECRET not configured");
        return false;
    }

    // Check Authorization header (Vercel cron format)
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) {
        return true;
    }

    // Check x-cron-secret header (alternative format)
    const cronHeader = request.headers.get("x-cron-secret");
    if (cronHeader === cronSecret) {
        return true;
    }

    return false;
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * GET handler for cron job execution
 *
 * This is the main entry point for Vercel cron jobs.
 */
export async function GET(request: NextRequest) {
    console.log("[CronSync] Received cron request");

    // Verify authorization
    if (!isAuthorized(request)) {
        console.error("[CronSync] Unauthorized request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get current season info
        const currentSeason = getCurrentSeasonFilter();
        const seasonDisplay = formatSeasonYear(
            currentSeason.season,
            currentSeason.year
        );

        console.log(`[CronSync] Starting sync for ${seasonDisplay}`);

        // Create sync service and run sync
        const syncService = createSyncService();
        const result = await syncService.syncCurrentSeason();

        // Clean up expired cache entries
        const cleanedUp = await syncService.cleanupCache();
        if (cleanedUp > 0) {
            console.log(
                `[CronSync] Cleaned up ${cleanedUp} expired cache entries`
            );
        }

        // Return result
        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Successfully synced ${seasonDisplay}`,
                season: result.season,
                year: result.year,
                stats: {
                    pagesProcessed: result.fetchStats.totalPages,
                    cacheHits: result.fetchStats.cacheHits,
                    apiCalls: result.fetchStats.cacheMisses,
                    animeUpserted: result.dbStats.animeUpserted,
                    animeFailed: result.dbStats.animeFailed,
                    genresCreated: result.dbStats.genresCreated,
                    genreLinksCreated: result.dbStats.animeGenreLinksCreated,
                    cacheEntriesCleaned: cleanedUp,
                },
                durationMs: result.durationMs,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: `Sync failed for ${seasonDisplay}`,
                    error: result.error,
                },
                { status: 500 }
            );
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error(`[CronSync] Unexpected error: ${errorMessage}`);

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
                message: errorMessage,
            },
            { status: 500 }
        );
    }
}

/**
 * POST handler for manual sync triggers
 *
 * Allows triggering sync with custom options via POST request.
 *
 * Body parameters:
 * - season: Optional season to sync (winter, spring, summer, fall)
 * - year: Optional year to sync
 * - force: Optional boolean to force refresh (bypass cache)
 */
export async function POST(request: NextRequest) {
    console.log("[CronSync] Received manual sync request");

    // Verify authorization
    if (!isAuthorized(request)) {
        console.error("[CronSync] Unauthorized request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Parse request body
        let body: { season?: string; year?: number; force?: boolean } = {};
        try {
            body = await request.json();
        } catch {
            // Empty body is fine, will use defaults
        }

        // Validate season if provided
        const validSeasons = ["winter", "spring", "summer", "fall"];
        if (body.season && !validSeasons.includes(body.season.toLowerCase())) {
            return NextResponse.json(
                {
                    error: "Invalid season",
                    message:
                        "Season must be one of: winter, spring, summer, fall",
                },
                { status: 400 }
            );
        }

        // Validate year if provided
        if (body.year) {
            const currentYear = new Date().getFullYear();
            if (body.year < 1960 || body.year > currentYear + 10) {
                return NextResponse.json(
                    {
                        error: "Invalid year",
                        message: `Year must be between 1960 and ${
                            currentYear + 10
                        }`,
                    },
                    { status: 400 }
                );
            }
        }

        // Create sync service and run sync
        const syncService = createSyncService();
        const result = await syncService.syncSeason({
            season: body.season?.toLowerCase() as
                | "winter"
                | "spring"
                | "summer"
                | "fall"
                | undefined,
            year: body.year,
            forceRefresh: body.force,
        });

        // Return result
        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Successfully synced ${result.seasonDisplay}`,
                season: result.season,
                year: result.year,
                forceRefresh: body.force || false,
                stats: {
                    pagesProcessed: result.fetchStats.totalPages,
                    cacheHits: result.fetchStats.cacheHits,
                    apiCalls: result.fetchStats.cacheMisses,
                    animeUpserted: result.dbStats.animeUpserted,
                    animeFailed: result.dbStats.animeFailed,
                    genresCreated: result.dbStats.genresCreated,
                    genreLinksCreated: result.dbStats.animeGenreLinksCreated,
                },
                durationMs: result.durationMs,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: `Sync failed for ${result.seasonDisplay}`,
                    error: result.error,
                },
                { status: 500 }
            );
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error(`[CronSync] Unexpected error: ${errorMessage}`);

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
                message: errorMessage,
            },
            { status: 500 }
        );
    }
}
