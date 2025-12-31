#!/usr/bin/env npx tsx
/**
 * Season Content Generation Script
 *
 * Generates AI-powered SEO content for anime season pages using OpenAI.
 * Content is stored in the season_content database table.
 *
 * Usage:
 *   npx tsx scripts/generate-season-content.ts --season winter --year 2026
 *   npx tsx scripts/generate-season-content.ts --year 2025                  # All seasons for year
 *   npx tsx scripts/generate-season-content.ts --all                        # All seasons in DB
 *   npx tsx scripts/generate-season-content.ts --all --force                # Regenerate all
 *   npx tsx scripts/generate-season-content.ts --compare -s winter -y 2025  # Compare models
 *   npx tsx scripts/generate-season-content.ts --verbose -s winter -y 2025  # Verbose output
 *   npx tsx scripts/generate-season-content.ts --help
 *
 * Environment Variables:
 *   OPENAI_API_KEY          - Required: OpenAI API key
 *   NEXT_PUBLIC_SUPABASE_URL - Required: Supabase project URL
 *   SUPABASE_SECRET_KEY     - Required: Supabase service role key
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { DEFAULT_MODEL, FALLBACK_MODEL } from "../src/lib/openai";
import {
    // Config
    COMPARISON_MODELS,
    MODEL_INFO,
    VALID_SEASONS,
    // Types
    type CliOptions,
    type GenerationResult,
    type ModelComparisonResult,
    type SeasonContentInput,
    // Generator
    generateSeasonContent,
    getTimeContext,
    // Database
    createSupabaseClient,
    getAvailableSeasons,
    getSeasonData,
    contentExists,
    saveContent,
    // Output
    printSeasonData,
    printGeneratedContent,
    printModelComparison,
} from "./season-content";

// ============================================================================
// CLI Argument Parsing
// ============================================================================

/**
 * Parses command line arguments
 */
function parseArgs(args: string[]): CliOptions {
    const options: CliOptions = {
        all: false,
        force: false,
        model: DEFAULT_MODEL,
        compare: false,
        verbose: false,
        dryRun: false,
        help: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case "-s":
            case "--season":
                options.season = args[++i]?.toUpperCase();
                break;
            case "-y":
            case "--year":
                options.year = parseInt(args[++i], 10);
                break;
            case "-a":
            case "--all":
                options.all = true;
                break;
            case "-f":
            case "--force":
                options.force = true;
                break;
            case "-m":
            case "--model":
                options.model = args[++i] || DEFAULT_MODEL;
                break;
            case "-c":
            case "--compare":
                options.compare = true;
                break;
            case "-v":
            case "--verbose":
                options.verbose = true;
                break;
            case "-d":
            case "--dry-run":
                options.dryRun = true;
                break;
            case "-h":
            case "--help":
                options.help = true;
                break;
        }
    }

    return options;
}

/**
 * Prints help message
 */
function printHelp(): void {
    console.log(`
Season Content Generation Script
================================

Generates AI-powered SEO content for anime season pages.

USAGE:
  npx tsx scripts/generate-season-content.ts [options]

OPTIONS:
  -s, --season <season>   Season to generate (winter, spring, summer, fall)
  -y, --year <year>       Year to generate content for
  -a, --all               Generate for all seasons in the database
  -f, --force             Regenerate even if content already exists
  -m, --model <model>     OpenAI model to use (default: ${DEFAULT_MODEL})
  -c, --compare           Compare output across multiple models (doesn't save)
  -v, --verbose           Show detailed season data and generated content
  -d, --dry-run           Show what would be generated without saving
  -h, --help              Show this help message

COMPARISON MODELS (used with --compare):
${COMPARISON_MODELS.map((m) => {
    const info = MODEL_INFO[m] || { name: m, description: "Unknown" };
    return `  - ${m}: ${info.description}`;
}).join("\n")}

EXAMPLES:
  # Generate content for Winter 2026
  npx tsx scripts/generate-season-content.ts -s winter -y 2026

  # Generate with verbose output to see all data
  npx tsx scripts/generate-season-content.ts -s winter -y 2025 --verbose

  # Compare models for a specific season (doesn't save to DB)
  npx tsx scripts/generate-season-content.ts -s winter -y 2025 --compare

  # Dry run to preview without saving
  npx tsx scripts/generate-season-content.ts -s winter -y 2025 --dry-run --verbose

  # Generate content for all seasons in 2025
  npx tsx scripts/generate-season-content.ts -y 2025

  # Generate content for all seasons in the database
  npx tsx scripts/generate-season-content.ts --all

  # Force regenerate all content using gpt-4o-mini
  npx tsx scripts/generate-season-content.ts --all --force --model ${FALLBACK_MODEL}

ENVIRONMENT VARIABLES:
  OPENAI_API_KEY           Required: Your OpenAI API key
  NEXT_PUBLIC_SUPABASE_URL Required: Supabase project URL
  SUPABASE_SECRET_KEY      Required: Supabase service role key
`);
}

// ============================================================================
// Content Generation Functions
// ============================================================================

/**
 * Generates content for a single season
 */
async function generateForSeason(
    supabase: ReturnType<typeof createSupabaseClient>,
    season: string,
    year: number,
    model: string,
    force: boolean,
    options: { verbose: boolean; dryRun: boolean }
): Promise<GenerationResult> {
    const slug = `${season.toLowerCase()}-${year}`;

    try {
        // Check if content already exists (skip in dry-run mode)
        if (
            !force &&
            !options.dryRun &&
            (await contentExists(supabase, slug))
        ) {
            console.log(
                `  ⏭️  ${slug}: Content already exists (use --force to regenerate)`
            );
            return { slug, success: true, model };
        }

        // Fetch season data
        console.log(`  📊 ${slug}: Fetching season data...`);
        const seasonData = await getSeasonData(supabase, season, year);

        if (seasonData.animeCount === 0) {
            console.log(`  ⚠️  ${slug}: No anime found, skipping`);
            return { slug, success: true, model };
        }

        // Determine time context
        const timeContext = getTimeContext(season, year);

        // Print verbose season data
        if (options.verbose) {
            printSeasonData(seasonData, timeContext);
        }

        // Prepare input for OpenAI
        const input: SeasonContentInput = {
            season: seasonData.season,
            year: seasonData.year,
            timeContext,
            animeCount: seasonData.animeCount,
            formatBreakdown: seasonData.formatBreakdown,
            topAnime: seasonData.topAnime,
            genreDistribution: seasonData.genreDistribution,
            sequelCount: seasonData.sequelCount,
            newSeriesCount: seasonData.newSeriesCount,
            notableStudios: seasonData.notableStudios,
        };

        // Generate content
        console.log(`  🤖 ${slug}: Generating content with ${model}...`);
        const startTime = Date.now();
        const content = await generateSeasonContent(input, model);
        const duration = Date.now() - startTime;

        // Print verbose generated content
        if (options.verbose) {
            printGeneratedContent(content, model, duration);
        }

        // Save to database (unless dry-run)
        if (options.dryRun) {
            console.log(`  🔍 ${slug}: Dry run - not saving to database`);
        } else {
            console.log(`  💾 ${slug}: Saving to database...`);
            await saveContent(supabase, seasonData, content, model);
        }

        console.log(
            `  ✅ ${slug}: Content generated successfully (${(
                duration / 1000
            ).toFixed(2)}s)`
        );
        return { slug, success: true, content, duration, model };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.log(`  ❌ ${slug}: Failed - ${errorMessage}`);
        return { slug, success: false, error: errorMessage, model };
    }
}

/**
 * Compares content generation across multiple models for a single season
 */
async function compareModels(
    supabase: ReturnType<typeof createSupabaseClient>,
    season: string,
    year: number,
    models: string[],
    _verbose: boolean
): Promise<ModelComparisonResult[]> {
    const slug = `${season.toLowerCase()}-${year}`;
    const results: ModelComparisonResult[] = [];

    console.log(`\n📊 Fetching season data for ${slug}...`);
    const seasonData = await getSeasonData(supabase, season, year);

    if (seasonData.animeCount === 0) {
        console.log(`⚠️  ${slug}: No anime found, skipping comparison`);
        return [];
    }

    const timeContext = getTimeContext(season, year);

    // Always show season data in compare mode
    printSeasonData(seasonData, timeContext);

    // Prepare input for OpenAI
    const input: SeasonContentInput = {
        season: seasonData.season,
        year: seasonData.year,
        timeContext,
        animeCount: seasonData.animeCount,
        formatBreakdown: seasonData.formatBreakdown,
        topAnime: seasonData.topAnime,
        genreDistribution: seasonData.genreDistribution,
        sequelCount: seasonData.sequelCount,
        newSeriesCount: seasonData.newSeriesCount,
        notableStudios: seasonData.notableStudios,
    };

    console.log(`\n🔄 Comparing ${models.length} models...\n`);

    for (const model of models) {
        const modelInfo = MODEL_INFO[model] || {
            name: model,
            description: "Unknown",
        };
        console.log(`  🤖 Generating with ${modelInfo.name}...`);

        try {
            const startTime = Date.now();
            const content = await generateSeasonContent(input, model);
            const duration = Date.now() - startTime;

            console.log(`     ✅ Complete (${(duration / 1000).toFixed(2)}s)`);

            results.push({
                model,
                modelInfo,
                result: { slug, success: true, content, duration, model },
                seasonData,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.log(`     ❌ Failed: ${errorMessage}`);

            results.push({
                model,
                modelInfo,
                result: { slug, success: false, error: errorMessage, model },
                seasonData,
            });
        }

        // Small delay between API calls
        if (models.indexOf(model) < models.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    return results;
}

// ============================================================================
// Main Function
// ============================================================================

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    // Show help if requested
    if (options.help) {
        printHelp();
        process.exit(0);
    }

    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
        console.error("Error: OPENAI_API_KEY environment variable is not set");
        console.error("Add it to your .env.local file");
        process.exit(1);
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error(
            "Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set"
        );
        process.exit(1);
    }

    if (!process.env.SUPABASE_SECRET_KEY) {
        console.error(
            "Error: SUPABASE_SECRET_KEY environment variable is not set"
        );
        process.exit(1);
    }

    // Validate arguments
    if (!options.all && !options.year && !options.season) {
        console.error(
            "Error: Must specify --all, --year, or --season + --year"
        );
        console.error("Run with --help for usage information");
        process.exit(1);
    }

    if (options.season && !options.year) {
        console.error("Error: --season requires --year to be specified");
        process.exit(1);
    }

    // Validate season if provided
    if (options.season && !VALID_SEASONS.includes(options.season)) {
        console.error(
            `Error: Invalid season "${
                options.season
            }". Must be one of: ${VALID_SEASONS.join(", ")}`
        );
        process.exit(1);
    }

    console.log("\n" + "=".repeat(60));
    console.log("  Season Content Generation Script");
    console.log("=".repeat(60));
    if (options.compare) {
        console.log(`  Mode: Model Comparison`);
        console.log(`  Models: ${COMPARISON_MODELS.join(", ")}`);
    } else {
        console.log(`  Model: ${options.model}`);
    }
    console.log(`  Force Regenerate: ${options.force ? "Yes" : "No"}`);
    console.log(`  Verbose: ${options.verbose ? "Yes" : "No"}`);
    console.log(`  Dry Run: ${options.dryRun ? "Yes" : "No"}`);
    if (options.all) {
        console.log(
            `  Target: All seasons${options.year ? ` in ${options.year}` : ""}`
        );
    } else if (options.season) {
        console.log(`  Target: ${options.season} ${options.year}`);
    } else {
        console.log(`  Target: All seasons in ${options.year}`);
    }
    console.log("=".repeat(60) + "\n");

    try {
        const supabase = createSupabaseClient();

        // Handle comparison mode
        if (options.compare) {
            if (!options.season || !options.year) {
                console.error("Error: --compare requires --season and --year");
                console.error("Example: --compare -s winter -y 2025");
                process.exit(1);
            }

            const comparisonResults = await compareModels(
                supabase,
                options.season,
                options.year,
                COMPARISON_MODELS,
                options.verbose
            );

            if (comparisonResults.length > 0) {
                printModelComparison(comparisonResults);
            }

            console.log(
                "\n💡 Note: Comparison mode does not save to database."
            );
            console.log(
                "   Use -m <model> without --compare to generate and save.\n"
            );
            process.exit(0);
        }

        // Determine which seasons to process
        let seasonsToProcess: Array<{ season: string; year: number }>;

        if (options.season && options.year) {
            // Single season
            seasonsToProcess = [{ season: options.season, year: options.year }];
        } else {
            // Multiple seasons
            seasonsToProcess = await getAvailableSeasons(
                supabase,
                options.year
            );
        }

        if (seasonsToProcess.length === 0) {
            console.log("No seasons found to process.");
            process.exit(0);
        }

        console.log(`Found ${seasonsToProcess.length} season(s) to process\n`);

        // Process each season
        const results: GenerationResult[] = [];
        const startTime = Date.now();

        for (const { season, year } of seasonsToProcess) {
            const result = await generateForSeason(
                supabase,
                season,
                year,
                options.model,
                options.force,
                { verbose: options.verbose, dryRun: options.dryRun }
            );
            results.push(result);

            // Add a small delay between API calls to avoid rate limiting
            if (seasonsToProcess.length > 1) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        const duration = Date.now() - startTime;

        // Print summary
        console.log("\n" + "=".repeat(60));
        console.log("  Generation Summary");
        console.log("=".repeat(60));

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success).length;

        console.log(`  Total processed: ${results.length}`);
        console.log(`  Successful: ${successCount}`);
        console.log(`  Failed: ${failCount}`);
        console.log(`  Duration: ${(duration / 1000).toFixed(2)}s`);
        if (options.dryRun) {
            console.log(`  ⚠️  Dry run - no content was saved to database`);
        }

        // List failures if any
        const failures = results.filter((r) => !r.success);
        if (failures.length > 0) {
            console.log("\n  Failed seasons:");
            for (const failure of failures) {
                console.log(`    - ${failure.slug}: ${failure.error}`);
            }
        }

        console.log("=".repeat(60) + "\n");

        process.exit(failCount > 0 ? 1 : 0);
    } catch (error) {
        console.error("\nFatal error:", error);
        process.exit(1);
    }
}

// ============================================================================
// Run
// ============================================================================

main();
