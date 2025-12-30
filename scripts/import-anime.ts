/**
 * Anime Import Script
 *
 * This script imports anime data from anime.json into the Supabase PostgreSQL database.
 * It handles field mapping, studio normalization, and batch processing.
 *
 * Usage: npx tsx scripts/import-anime.ts
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// ============================================================================
// Types
// ============================================================================

/**
 * Raw related anime object from anime.json
 */
interface RawRelatedAnime {
    id: string; // MAL ID of the related anime
    relation: string; // Relation type (e.g., "SEQUEL", "Prequel", "Side Story")
}

/**
 * Raw anime object structure from anime.json
 */
interface RawAnime {
    _id: { $oid: string };
    id: string;
    titleEnglish?: string | null;
    titleRomaji?: string | null;
    titleJapanese?: string | null;
    titleNative?: string | null;
    format?: string | null;
    episodeCount?: number | null;
    episodeDuration?: string | null;
    season?: string | null;
    dateStart?: string | null;
    dateEnd?: string | null;
    synopsis?: string | null;
    description?: string | null;
    averageRating?: number | null;
    popularityRank?: number | null;
    status?: string | null;
    idMAL?: string | null;
    idAnilist?: string | null;
    idKitsu?: string | null;
    keyVisuals?: Array<{
        height: number;
        width: number;
        name: string;
        url: string;
    }>;
    studios?: string[];
    streamingPlatforms?: string[];
    genres?: string[];
    source?: string | null;
    ageRating?: string | null;
    trailerUrl?: string | null;
    seriesID?: string | null;
    relatedAnime?: RawRelatedAnime[];
}

/**
 * Transformed anime object for database insertion
 */
interface TransformedAnime {
    slug: string;
    titles: {
        english: string | null;
        romaji: string;
        japanese: string | null;
    };
    format: string;
    episode_count: number | null;
    episode_duration: number | null;
    season: string | null;
    season_year: number | null;
    start_date: string | null;
    end_date: string | null;
    synopsis: string | null;
    average_rating: number | null;
    popularity: number;
    status: string;
    mal_id: number | null;
    anilist_id: number | null;
    kitsu_id: string | null;
    cover_image_url: string | null;
    banner_image_url: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const BATCH_SIZE = 100;
const VALID_FORMATS = ["TV", "MOVIE", "OVA", "ONA", "SPECIAL", "MUSIC"];
const VALID_STATUSES = [
    "FINISHED",
    "RELEASING",
    "NOT_YET_RELEASED",
    "CANCELLED",
    "HIATUS",
];
const VALID_SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];
const VALID_PLATFORMS = [
    "CRUNCHYROLL",
    "FUNIMATION",
    "NETFLIX",
    "HULU",
    "AMAZON",
    "HIDIVE",
    "OTHER",
];

const VALID_RELATION_TYPES = [
    "SEQUEL",
    "PREQUEL",
    "SIDE_STORY",
    "ALTERNATIVE",
    "SPIN_OFF",
    "CHARACTER",
    "PARENT",
    "OTHER",
    "SUMMARY",
    "ADAPTATION",
    "SOURCE",
    "CONTAINS",
];

// Platform name mapping from JSON to database enum
const PLATFORM_MAP: Record<string, string> = {
    crunchyroll: "CRUNCHYROLL",
    funimation: "FUNIMATION",
    netflix: "NETFLIX",
    hulu: "HULU",
    amazon: "AMAZON",
    "amazon prime": "AMAZON",
    "amazon prime video": "AMAZON",
    "prime video": "AMAZON",
    hidive: "HIDIVE",
};

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Generates a URL-safe slug from a string
 * @param str - The string to convert to a slug
 * @returns A lowercase slug with only alphanumeric characters and hyphens
 */
function generateSlug(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100);
}

/**
 * Parses episode duration string to minutes
 * Handles formats like "24 min per ep", "1 hr 52 min", "23 min"
 * @param duration - The duration string to parse
 * @returns Duration in minutes or null if unparseable
 */
function parseDuration(duration: string | null | undefined): number | null {
    if (!duration) return null;

    const lowerDuration = duration.toLowerCase();

    // Handle "X hr Y min" format
    const hrMinMatch = lowerDuration.match(/(\d+)\s*hr[s]?\s*(\d+)?\s*min/);
    if (hrMinMatch) {
        const hours = parseInt(hrMinMatch[1], 10);
        const minutes = hrMinMatch[2] ? parseInt(hrMinMatch[2], 10) : 0;
        return hours * 60 + minutes;
    }

    // Handle "X min" or "X min per ep" format
    const minMatch = lowerDuration.match(/(\d+)\s*min/);
    if (minMatch) {
        return parseInt(minMatch[1], 10);
    }

    return null;
}

/**
 * Maps raw format string to database enum value
 * @param format - The raw format string
 * @returns Uppercase format or "TV" as default
 */
function mapFormat(format: string | null | undefined): string {
    if (!format) return "TV";

    const upperFormat = format.toUpperCase();

    // Direct match
    if (VALID_FORMATS.includes(upperFormat)) {
        return upperFormat;
    }

    // Handle variations
    if (upperFormat === "MOVIE" || upperFormat === "FILM") return "MOVIE";
    if (upperFormat === "TV_SHORT") return "TV";
    if (upperFormat === "TV_SPECIAL") return "SPECIAL";

    return "TV";
}

/**
 * Maps raw status string to database enum value
 * @param status - The raw status string
 * @returns Uppercase status or "FINISHED" as default
 */
function mapStatus(status: string | null | undefined): string {
    if (!status) return "FINISHED";

    const lowerStatus = status.toLowerCase();

    if (lowerStatus === "finished" || lowerStatus === "completed") {
        return "FINISHED";
    }
    if (
        lowerStatus === "current" ||
        lowerStatus === "releasing" ||
        lowerStatus === "airing"
    ) {
        return "RELEASING";
    }
    if (
        lowerStatus === "not_yet_released" ||
        lowerStatus === "upcoming" ||
        lowerStatus === "tba"
    ) {
        return "NOT_YET_RELEASED";
    }
    if (lowerStatus === "cancelled") {
        return "CANCELLED";
    }
    if (lowerStatus === "hiatus" || lowerStatus === "paused") {
        return "HIATUS";
    }

    return "FINISHED";
}

/**
 * Maps raw season string to database enum value
 * @param season - The raw season string
 * @returns Uppercase season or null if invalid
 */
function mapSeason(season: string | null | undefined): string | null {
    if (!season) return null;

    const upperSeason = season.toUpperCase();
    if (VALID_SEASONS.includes(upperSeason)) {
        return upperSeason;
    }

    return null;
}

/**
 * Extracts year from a date string
 * @param dateStr - Date string in ISO format (YYYY-MM-DD)
 * @returns Year as number or null
 */
function extractYear(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null;

    // Ensure dateStr is a string before calling match
    if (typeof dateStr !== "string") {
        return null;
    }

    const match = dateStr.match(/^(\d{4})/);
    if (match) {
        return parseInt(match[1], 10);
    }

    return null;
}

/**
 * Extracts the cover image URL from keyVisuals array
 * Prefers "large" size, falls back to others
 * @param keyVisuals - Array of key visual objects
 * @returns URL string or null
 */
function extractCoverImage(keyVisuals: RawAnime["keyVisuals"]): string | null {
    if (!keyVisuals || keyVisuals.length === 0) return null;

    // Try to find "large" image first
    const large = keyVisuals.find((kv) => kv.name === "large");
    if (large?.url) return large.url;

    // Fall back to "medium"
    const medium = keyVisuals.find((kv) => kv.name === "medium");
    if (medium?.url) return medium.url;

    // Fall back to "original"
    const original = keyVisuals.find((kv) => kv.name === "original");
    if (original?.url) return original.url;

    // Fall back to first available
    return keyVisuals[0]?.url || null;
}

/**
 * Scales rating from 0-100 to 0-10 scale
 * @param rating - Rating on 0-100 scale
 * @returns Rating on 0-10 scale or null
 */
function scaleRating(rating: number | null | undefined): number | null {
    if (rating === null || rating === undefined) return null;

    // Scale from 0-100 to 0-10 and round to 2 decimal places
    return Math.round((rating / 10) * 100) / 100;
}

/**
 * Parses external ID to integer
 * @param id - ID string or null
 * @returns Integer ID or null
 */
function parseIntId(id: string | null | undefined): number | null {
    if (!id) return null;

    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Normalizes date field - handles MongoDB date objects and strings
 * @param dateValue - Date string, MongoDB date object, or null
 * @returns ISO date string (YYYY-MM-DD) or null
 */
function normalizeDateField(
    dateValue: string | { $date: string } | null | undefined,
): string | null {
    if (!dateValue) return null;

    // Handle MongoDB date objects like {"$date": "2011-01-07T00:00:00Z"}
    if (typeof dateValue === "object" && "$date" in dateValue) {
        const isoString = dateValue.$date;
        // Extract just the date part (YYYY-MM-DD)
        const match = isoString.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : null;
    }

    // Handle regular string dates
    if (typeof dateValue === "string") {
        // If already in YYYY-MM-DD format, return as-is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        // Try to extract YYYY-MM-DD from ISO string
        const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : null;
    }

    return null;
}

/**
 * Maps streaming platform name to database enum value
 * @param platform - Raw platform name
 * @returns Mapped platform enum value or null if not mappable
 */
function mapPlatform(platform: string): string | null {
    const lowerPlatform = platform.toLowerCase();

    // Check direct mapping
    if (PLATFORM_MAP[lowerPlatform]) {
        return PLATFORM_MAP[lowerPlatform];
    }

    // Check if platform contains known keywords
    for (const [key, value] of Object.entries(PLATFORM_MAP)) {
        if (lowerPlatform.includes(key)) {
            return value;
        }
    }

    // Return OTHER for unknown platforms
    return "OTHER";
}

/**
 * Transforms a raw anime object to database format
 * @param raw - Raw anime object from JSON
 * @returns Transformed anime object for database
 */
function transformAnime(raw: RawAnime): TransformedAnime {
    // Generate slug from the anime title (normalized: lowercase, hyphens, URL-safe)
    // Prefer romaji title, fallback to english, then native
    const titleForSlug =
        raw.titleRomaji || raw.titleEnglish || raw.titleNative || "unknown";
    const slug = generateSlug(titleForSlug);

    // Build titles object
    const titles = {
        english: raw.titleEnglish || null,
        romaji:
            raw.titleRomaji || raw.titleEnglish || raw.titleNative || "Unknown",
        japanese: raw.titleJapanese || raw.titleNative || null,
    };

    // Normalize date fields to handle MongoDB date objects
    const normalizedStartDate = normalizeDateField(raw.dateStart);
    const normalizedEndDate = normalizeDateField(raw.dateEnd);

    return {
        slug,
        titles,
        format: mapFormat(raw.format),
        episode_count: raw.episodeCount || null,
        episode_duration: parseDuration(raw.episodeDuration),
        season: mapSeason(raw.season),
        season_year: extractYear(normalizedStartDate),
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
        synopsis: raw.synopsis || raw.description || null,
        average_rating: scaleRating(raw.averageRating),
        popularity: raw.popularityRank || 99999,
        status: mapStatus(raw.status),
        mal_id: parseIntId(raw.idMAL),
        anilist_id: parseIntId(raw.idAnilist),
        kitsu_id: raw.idKitsu || null,
        cover_image_url: extractCoverImage(raw.keyVisuals),
        banner_image_url: null, // Not available in source data
    };
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Creates or retrieves a studio by name
 * @param supabase - Supabase client
 * @param studioName - Name of the studio
 * @param studioCache - Cache of existing studios
 * @returns Studio ID
 */
async function getOrCreateStudio(
    supabase: SupabaseClient,
    studioName: string,
    studioCache: Map<string, string>,
): Promise<string | null> {
    // Check cache first
    if (studioCache.has(studioName)) {
        return studioCache.get(studioName)!;
    }

    const slug = generateSlug(studioName);

    // Try to find existing studio
    const { data: existing } = await supabase
        .from("studios")
        .select("id")
        .eq("slug", slug)
        .single();

    if (existing) {
        studioCache.set(studioName, existing.id);
        return existing.id;
    }

    // Create new studio
    const { data: created, error } = await supabase
        .from("studios")
        .upsert({ name: studioName, slug }, { onConflict: "slug" })
        .select("id")
        .single();

    if (error) {
        // Silently handle duplicate key errors - studio already exists
        if (error.message.includes("duplicate key value")) {
            // Re-fetch the existing studio
            const { data: refetched } = await supabase
                .from("studios")
                .select("id")
                .eq("name", studioName)
                .single();

            if (refetched) {
                studioCache.set(studioName, refetched.id);
                return refetched.id;
            }
        }
        console.error(
            `Failed to create studio "${studioName}":`,
            error.message,
        );
        return null;
    }

    studioCache.set(studioName, created.id);
    return created.id;
}

/**
 * Links anime to studios via junction table
 * @param supabase - Supabase client
 * @param animeId - Anime UUID
 * @param studioIds - Array of studio UUIDs
 */
async function linkAnimeStudios(
    supabase: SupabaseClient,
    animeId: string,
    studioIds: string[],
): Promise<void> {
    if (studioIds.length === 0) return;

    const links = studioIds.map((studioId) => ({
        anime_id: animeId,
        studio_id: studioId,
    }));

    const { error } = await supabase
        .from("anime_studios")
        .upsert(links, { onConflict: "anime_id,studio_id" });

    if (error && !error.message.includes("duplicate key value")) {
        console.error(
            `Failed to link studios for anime ${animeId}:`,
            error.message,
        );
    }
}

/**
 * Creates streaming links for an anime
 * @param supabase - Supabase client
 * @param animeId - Anime UUID
 * @param platforms - Array of platform names
 */
async function createStreamingLinks(
    supabase: SupabaseClient,
    animeId: string,
    platforms: string[],
): Promise<void> {
    if (!platforms || platforms.length === 0) return;

    const links = platforms
        .map((platform) => {
            const mappedPlatform = mapPlatform(platform);
            if (!mappedPlatform) return null;

            return {
                anime_id: animeId,
                platform: mappedPlatform,
                url: "", // URL not available in source data
                region: "US",
            };
        })
        .filter((link): link is NonNullable<typeof link> => link !== null);

    if (links.length === 0) return;

    // Delete existing links for this anime first to avoid duplicates
    await supabase.from("streaming_links").delete().eq("anime_id", animeId);

    const { error } = await supabase.from("streaming_links").insert(links);

    if (error && !error.message.includes("duplicate key value")) {
        console.error(
            `Failed to create streaming links for anime ${animeId}:`,
            error.message,
        );
    }
}

/**
 * Normalizes a relation type string to the standard enum value
 * Handles inconsistent casing from source data (e.g., "Sequel" -> "SEQUEL")
 * @param relation - Raw relation type string
 * @returns Normalized relation type or "OTHER" if unknown
 */
function normalizeRelationType(relation: string): string {
    // Normalize: uppercase, replace spaces with underscores
    const normalized = relation
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace("PARENT_STORY", "PARENT")
        .replace("ALTERNATIVE_VERSION", "ALTERNATIVE")
        .replace("ALTERNATIVE_SETTING", "ALTERNATIVE")
        .replace("FULL_STORY", "PARENT")
        .replace("SPIN-OFF", "SPIN_OFF");

    // Return normalized value if valid, otherwise default to OTHER
    return VALID_RELATION_TYPES.includes(normalized) ? normalized : "OTHER";
}

/**
 * Imports anime relations from the raw data
 * This should be called after all anime have been imported
 * @param supabase - Supabase client
 * @param animeData - Array of raw anime objects
 * @returns Number of successfully imported relations
 */
async function importAnimeRelations(
    supabase: SupabaseClient,
    animeData: RawAnime[],
): Promise<number> {
    console.log("\nImporting anime relations...");

    // Build a map of MAL ID to anime UUID for quick lookups
    const { data: animeList, error: fetchError } = await supabase
        .from("anime")
        .select("id, mal_id")
        .not("mal_id", "is", null);

    if (fetchError) {
        console.error("Failed to fetch anime list for relations:", fetchError.message);
        return 0;
    }

    // Create MAL ID -> UUID map
    const malIdToUuid = new Map<number, string>();
    for (const anime of animeList || []) {
        if (anime.mal_id) {
            malIdToUuid.set(anime.mal_id, anime.id);
        }
    }

    console.log(`  Built lookup map with ${malIdToUuid.size} anime entries`);

    // Collect all relations to import
    const relations: Array<{
        source_anime_id: string;
        target_anime_id: string;
        relation_type: string;
    }> = [];

    for (const raw of animeData) {
        if (!raw.relatedAnime || raw.relatedAnime.length === 0) continue;
        if (!raw.idMAL) continue;

        const sourceId = malIdToUuid.get(parseInt(raw.idMAL, 10));
        if (!sourceId) continue;

        for (const related of raw.relatedAnime) {
            const targetMalId = parseInt(related.id, 10);
            if (isNaN(targetMalId)) continue;

            const targetId = malIdToUuid.get(targetMalId);
            if (!targetId) continue;

            // Skip self-references
            if (sourceId === targetId) continue;

            const relationType = normalizeRelationType(related.relation);

            relations.push({
                source_anime_id: sourceId,
                target_anime_id: targetId,
                relation_type: relationType,
            });
        }
    }

    console.log(`  Found ${relations.length} valid relations to import`);

    if (relations.length === 0) {
        return 0;
    }

    // Clear existing relations before importing
    const { error: deleteError } = await supabase
        .from("anime_relations")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (deleteError) {
        console.error("Failed to clear existing relations:", deleteError.message);
    }

    // Import relations in batches
    let successCount = 0;
    const relationBatchSize = 500;

    for (let i = 0; i < relations.length; i += relationBatchSize) {
        const batch = relations.slice(i, i + relationBatchSize);

        const { error: insertError } = await supabase
            .from("anime_relations")
            .upsert(batch, {
                onConflict: "source_anime_id,target_anime_id,relation_type",
            });

        if (insertError) {
            console.error(
                `  Failed to import relations batch ${Math.floor(i / relationBatchSize) + 1}:`,
                insertError.message,
            );
        } else {
            successCount += batch.length;
        }
    }

    console.log(`  Successfully imported ${successCount} relations`);
    return successCount;
}

/**
 * Imports a batch of anime records
 * @param supabase - Supabase client
 * @param batch - Array of raw anime objects
 * @param studioCache - Cache of existing studios
 * @returns Number of successfully imported records
 */
async function importBatch(
    supabase: SupabaseClient,
    batch: RawAnime[],
    studioCache: Map<string, string>,
): Promise<number> {
    let successCount = 0;

    for (const raw of batch) {
        try {
            const transformed = transformAnime(raw);

            // Upsert anime record (uses slug for conflict resolution since slug is based on title)
            const { data: anime, error: animeError } = await supabase
                .from("anime")
                .upsert(transformed, { onConflict: "slug" })
                .select("id")
                .single();

            if (animeError) {
                console.error(
                    `Failed to import "${transformed.titles.romaji}":`,
                    animeError.message,
                );
                continue;
            }

            if (!anime) {
                console.error(
                    `No data returned for "${transformed.titles.romaji}"`,
                );
                continue;
            }

            // Process studios
            if (raw.studios && raw.studios.length > 0) {
                const studioIds: string[] = [];
                for (const studioName of raw.studios) {
                    const studioId = await getOrCreateStudio(
                        supabase,
                        studioName,
                        studioCache,
                    );
                    if (studioId) {
                        studioIds.push(studioId);
                    }
                }
                await linkAnimeStudios(supabase, anime.id, studioIds);
            }

            // Process streaming platforms
            if (raw.streamingPlatforms && raw.streamingPlatforms.length > 0) {
                await createStreamingLinks(
                    supabase,
                    anime.id,
                    raw.streamingPlatforms,
                );
            }

            successCount++;
        } catch (error) {
            console.error(`Error processing anime:`, error);
        }
    }

    return successCount;
}

// ============================================================================
// Main Import Function
// ============================================================================

/**
 * Main import function
 * Reads anime.json and imports all records to the database
 */
async function main(): Promise<void> {
    console.log("=".repeat(60));
    console.log("STREAMD Anime Import Script");
    console.log("=".repeat(60));

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error(
            "Error: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local",
        );
        process.exit(1);
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    // Read and parse anime.json
    const jsonPath = path.join(process.cwd(), "anime.json");

    if (!fs.existsSync(jsonPath)) {
        console.error(`Error: anime.json not found at ${jsonPath}`);
        process.exit(1);
    }

    console.log(`Reading anime.json from ${jsonPath}...`);

    let animeData: RawAnime[];

    try {
        const fileContent = fs.readFileSync(jsonPath, "utf-8");

        // Handle both array format and newline-delimited JSON
        if (fileContent.trim().startsWith("[")) {
            animeData = JSON.parse(fileContent);
        } else {
            // Newline-delimited JSON
            animeData = fileContent
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => JSON.parse(line));
        }
    } catch (error) {
        console.error("Error parsing anime.json:", error);
        process.exit(1);
    }

    console.log(`Found ${animeData.length} anime records to import`);
    console.log("-".repeat(60));

    // Initialize studio cache
    const studioCache = new Map<string, string>();

    // Process in batches
    let totalImported = 0;
    const totalBatches = Math.ceil(animeData.length / BATCH_SIZE);

    for (let i = 0; i < animeData.length; i += BATCH_SIZE) {
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const batch = animeData.slice(i, i + BATCH_SIZE);

        console.log(
            `Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`,
        );

        const imported = await importBatch(supabase, batch, studioCache);
        totalImported += imported;

        console.log(
            `  Batch ${batchNumber} complete: ${imported}/${batch.length} imported successfully`,
        );
    }

    console.log("-".repeat(60));
    console.log(`Anime import complete!`);
    console.log(`  Total records processed: ${animeData.length}`);
    console.log(`  Successfully imported: ${totalImported}`);
    console.log(`  Failed: ${animeData.length - totalImported}`);
    console.log(`  Studios created: ${studioCache.size}`);

    // Import anime relations after all anime are imported
    const relationsImported = await importAnimeRelations(supabase, animeData);

    console.log("-".repeat(60));
    console.log(`Full import complete!`);
    console.log(`  Anime imported: ${totalImported}`);
    console.log(`  Relations imported: ${relationsImported}`);
    console.log("=".repeat(60));
}

// Run the import
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
