/**
 * Backfill Short IDs Script
 *
 * This script populates the short_id column for existing anime records
 * that don't have one. It generates unique 8-character uppercase
 * alphanumeric IDs for each anime.
 *
 * Usage: npx tsx scripts/backfill-short-ids.ts
 */

import { createClient } from "@supabase/supabase-js";
import { customAlphabet } from "nanoid";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Short ID generator: 8-character uppercase alphanumeric
const generateShortId = customAlphabet(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    8
);

// Concurrent updates per batch (higher = faster but more load on DB)
const CONCURRENCY = 50;

// Page size for fetching records (Supabase default limit is 1000)
const PAGE_SIZE = 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

/**
 * Fetches all anime without short_id with pagination
 */
async function fetchAnimeWithoutShortId(
    supabase: SupabaseClientType
): Promise<Array<{ id: string; slug: string }>> {
    const allRecords: Array<{ id: string; slug: string }> = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from("anime")
            .select("id, slug")
            .is("short_id", null)
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            allRecords.push(...data);
            offset += PAGE_SIZE;
            hasMore = data.length === PAGE_SIZE;
        } else {
            hasMore = false;
        }
    }

    return allRecords;
}

/**
 * Fetches all existing short IDs with pagination
 */
async function fetchExistingShortIds(
    supabase: SupabaseClientType
): Promise<Array<{ short_id: string }>> {
    const allRecords: Array<{ short_id: string }> = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from("anime")
            .select("short_id")
            .not("short_id", "is", null)
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            allRecords.push(...data);
            offset += PAGE_SIZE;
            hasMore = data.length === PAGE_SIZE;
        } else {
            hasMore = false;
        }
    }

    return allRecords;
}

/**
 * Main backfill function
 */
async function backfillShortIds(): Promise<void> {
    console.log("🚀 Starting short ID backfill...\n");
    const start_time = Date.now();
    console.log(`🕒 Start time: ${new Date(start_time).toISOString()}`);

    // Validate environment variables
    // Service role key is required to bypass RLS for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing required environment variables:");
        console.error("   - NEXT_PUBLIC_SUPABASE_URL");
        console.error("   - SUPABASE_SECRET_KEY");
        process.exit(1);
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Get all anime without short_id (paginated)
        console.log("📊 Fetching anime without short_id...");
        const animeWithoutShortId = await fetchAnimeWithoutShortId(supabase);

        if (animeWithoutShortId.length === 0) {
            console.log("✅ All anime already have short IDs!");
            return;
        }

        console.log(
            `📝 Found ${animeWithoutShortId.length} anime without short_id\n`
        );

        // Get existing short IDs to avoid collisions (paginated)
        console.log("🔍 Fetching existing short IDs to avoid collisions...");
        const existingIds = await fetchExistingShortIds(supabase);

        const usedIds = new Set<string>(
            existingIds.map((row) => row.short_id).filter(Boolean)
        );
        console.log(`   Found ${usedIds.size} existing short IDs\n`);

        // Generate unique short IDs for each anime
        const updates: Array<{ id: string; short_id: string }> = [];

        for (const anime of animeWithoutShortId) {
            let shortId: string;
            let attempts = 0;
            const maxAttempts = 100;

            // Generate unique short ID (retry on collision)
            do {
                shortId = generateShortId();
                attempts++;
                if (attempts > maxAttempts) {
                    console.error(
                        `❌ Failed to generate unique short ID after ${maxAttempts} attempts`
                    );
                    process.exit(1);
                }
            } while (usedIds.has(shortId));

            usedIds.add(shortId);
            updates.push({ id: anime.id, short_id: shortId });
        }

        // Process updates concurrently in batches
        console.log(
            `🔄 Updating ${updates.length} anime with concurrency of ${CONCURRENCY}...\n`
        );

        let successCount = 0;
        let errorCount = 0;
        let processed = 0;

        // Process in concurrent batches
        for (let i = 0; i < updates.length; i += CONCURRENCY) {
            const batch = updates.slice(i, i + CONCURRENCY);

            // Execute all updates in this batch concurrently
            const results = await Promise.all(
                batch.map(async (update) => {
                    const { error: updateError } = await supabase
                        .from("anime")
                        .update({ short_id: update.short_id })
                        .eq("id", update.id);

                    return { id: update.id, error: updateError };
                })
            );

            // Count successes and errors
            for (const result of results) {
                if (result.error) {
                    console.error(
                        `   ❌ Error updating anime ${result.id}: ${result.error.message}`
                    );
                    errorCount++;
                } else {
                    successCount++;
                }
            }

            processed += batch.length;

            // Log progress every 500 records
            if (processed % 500 === 0 || processed === updates.length) {
                const percent = ((processed / updates.length) * 100).toFixed(1);
                console.log(
                    `   Progress: ${processed}/${updates.length} (${percent}%)`
                );
            }
        }

        const end_time = Date.now();
        const duration = end_time - start_time;
        console.log(`🕒 Total time: ${duration}ms`);

        console.log("\n" + "=".repeat(50));
        console.log("📊 Backfill Complete!");
        console.log("=".repeat(50));
        console.log(`   ✅ Successfully updated: ${successCount}`);
        if (errorCount > 0) {
            console.log(`   ❌ Errors: ${errorCount}`);
        }
        console.log("");
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        process.exit(1);
    }
}

// Run the backfill
backfillShortIds();
