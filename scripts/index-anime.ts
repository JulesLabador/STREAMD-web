/**
 * Anime Search Index Script
 *
 * This script indexes anime data from Supabase into Algolia for fast,
 * typo-tolerant search. Run this script after importing anime data or
 * when you need to reindex the search database.
 *
 * Usage: npx tsx scripts/index-anime.ts
 */

import { createClient } from "@supabase/supabase-js";
import { algoliasearch } from "algoliasearch";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
// Use __dirname to ensure we find the file regardless of where the script is run from
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ============================================================================
// Types
// ============================================================================

/**
 * Document structure for Algolia anime index
 */
interface AnimeSearchDocument {
    objectID: string;
    shortId: string | null;
    slug: string;
    titles: {
        english: string | null;
        romaji: string;
        japanese: string | null;
    };
    format: string;
    status: string;
    season: string | null;
    seasonYear: number | null;
    popularity: number;
    averageRating: number | null;
    coverImageUrl: string | null;
    episodeCount: number | null;
}

/**
 * Database row structure from Supabase
 */
interface AnimeRow {
    id: string;
    short_id: string | null;
    slug: string;
    titles: {
        english: string | null;
        romaji: string;
        japanese: string | null;
    };
    format: string;
    status: string;
    season: string | null;
    season_year: number | null;
    popularity: number;
    average_rating: number | null;
    cover_image_url: string | null;
    episode_count: number | null;
}

// ============================================================================
// Constants
// ============================================================================

const ANIME_INDEX = "anime";
const BATCH_SIZE = 500;

// ============================================================================
// Main Function
// ============================================================================

async function main(): Promise<void> {
    console.log("=".repeat(60));
    console.log("STREAMD Algolia Search Index Script");
    console.log("=".repeat(60));

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;
    const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const algoliaAdminKey = process.env.ALGOLIA_ADMIN_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error(
            "Error: Missing Supabase environment variables.",
            "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local"
        );
        process.exit(1);
    }

    if (!algoliaAppId || !algoliaAdminKey) {
        console.error(
            "Error: Missing Algolia environment variables.",
            "Please set NEXT_PUBLIC_ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY in .env.local"
        );
        process.exit(1);
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const algolia = algoliasearch(algoliaAppId, algoliaAdminKey);

    console.log(`Algolia App ID: ${algoliaAppId}`);
    console.log("-".repeat(60));

    // Configure index settings
    console.log(`Configuring index "${ANIME_INDEX}" settings...`);

    await algolia.setSettings({
        indexName: ANIME_INDEX,
        indexSettings: {
            // Searchable attributes in priority order
            // Titles are most important for search
            searchableAttributes: [
                "titles.english",
                "titles.romaji",
                "titles.japanese",
            ],

            // Attributes for filtering/faceting
            attributesForFaceting: [
                "filterOnly(format)",
                "filterOnly(status)",
                "filterOnly(season)",
                "filterOnly(seasonYear)",
            ],

            // Custom ranking - prioritize by popularity (lower = more popular)
            customRanking: ["asc(popularity)"],

            // Typo tolerance configuration
            typoTolerance: true,
            minWordSizefor1Typo: 4,
            minWordSizefor2Typos: 8,

            // Highlighting configuration
            attributesToHighlight: [
                "titles.english",
                "titles.romaji",
                "titles.japanese",
            ],

            // Attributes to retrieve in search results
            attributesToRetrieve: [
                "objectID",
                "slug",
                "titles",
                "format",
                "status",
                "season",
                "seasonYear",
                "popularity",
                "averageRating",
                "coverImageUrl",
                "episodeCount",
            ],
        },
    });

    console.log("Index settings configured.");
    console.log("-".repeat(60));

    // Fetch all anime from Supabase
    // Note: Supabase has a default limit of 1000 rows, so we need to paginate
    console.log("Fetching anime from database...");

    const PAGE_SIZE = 1000;
    let allAnimeData: AnimeRow[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: pageData, error: fetchError } = await supabase
            .from("anime")
            .select(
                `
                id,
                slug,
                titles,
                format,
                status,
                season,
                season_year,
                popularity,
                average_rating,
                cover_image_url,
                episode_count
            `
            )
            .order("popularity", { ascending: true })
            .range(from, to);

        if (fetchError) {
            console.error("Error fetching anime from database:", fetchError);
            process.exit(1);
        }

        if (!pageData || pageData.length === 0) {
            hasMore = false;
        } else {
            allAnimeData = allAnimeData.concat(pageData as AnimeRow[]);
            console.log(
                `  Fetched page ${page + 1}: ${
                    pageData.length
                } records (total: ${allAnimeData.length})`
            );

            // If we got less than PAGE_SIZE, we've reached the end
            if (pageData.length < PAGE_SIZE) {
                hasMore = false;
            } else {
                page++;
            }
        }
    }

    const animeData = allAnimeData;

    if (!animeData || animeData.length === 0) {
        console.log("No anime found in database. Nothing to index.");
        process.exit(0);
    }

    console.log(`Found ${animeData.length} anime to index.`);

    // Transform data for Algolia
    // Note: Algolia requires `objectID` as the unique identifier
    const documents: AnimeSearchDocument[] = (animeData as AnimeRow[]).map(
        (anime) => ({
            objectID: anime.id,
            shortId: anime.short_id,
            slug: anime.slug,
            titles: anime.titles,
            format: anime.format,
            status: anime.status,
            season: anime.season,
            seasonYear: anime.season_year,
            popularity: anime.popularity,
            averageRating: anime.average_rating,
            coverImageUrl: anime.cover_image_url,
            episodeCount: anime.episode_count,
        })
    );

    // Index documents in batches
    console.log("Indexing documents...");

    let totalIndexed = 0;
    const totalBatches = Math.ceil(documents.length / BATCH_SIZE);

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const batch = documents.slice(i, i + BATCH_SIZE);

        console.log(
            `  Processing batch ${batchNumber}/${totalBatches} (${batch.length} documents)...`
        );

        // Save objects to Algolia (replaces existing objects with same objectID)
        await algolia.saveObjects({
            indexName: ANIME_INDEX,
            objects: batch as unknown as Record<string, unknown>[],
        });

        totalIndexed += batch.length;
    }

    console.log("-".repeat(60));
    console.log("Indexing complete!");
    console.log(`  Total documents indexed: ${totalIndexed}`);

    console.log("=".repeat(60));
}

// Run the script
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
