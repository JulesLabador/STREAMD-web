/**
 * Kitsu Database Service
 *
 * Handles upserting anime, genres, and studios from Kitsu data into Supabase.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
    TransformedAnime,
    TransformedGenre,
    TransformResult,
} from "./transformer";

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a database sync operation
 */
export interface DbSyncResult {
    /** Number of anime records upserted */
    animeUpserted: number;
    /** Number of anime records that failed */
    animeFailed: number;
    /** Number of genres created */
    genresCreated: number;
    /** Number of anime-genre links created */
    animeGenreLinksCreated: number;
    /** Error messages if any */
    errors: string[];
}

/**
 * Database record for anime
 */
interface AnimeRecord {
    id: string;
    kitsu_id: string;
}

/**
 * Database record for genre
 */
interface GenreRecord {
    id: string;
    slug: string;
}

// ============================================================================
// Database Service Class
// ============================================================================

/**
 * Service for persisting Kitsu data to Supabase
 */
export class KitsuDbService {
    private supabase: SupabaseClient;

    /**
     * Creates a new database service instance
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
     * Upserts a single anime record
     *
     * @param anime - Transformed anime data
     * @returns The upserted anime ID or null if failed
     */
    async upsertAnime(anime: TransformedAnime): Promise<string | null> {
        try {
            // First, try to find existing anime by kitsu_id
            const { data: existing } = await this.supabase
                .from("anime")
                .select("id")
                .eq("kitsu_id", anime.kitsu_id)
                .single();

            if (existing) {
                // Update existing record
                const { error } = await this.supabase
                    .from("anime")
                    .update({
                        ...anime,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existing.id);

                if (error) {
                    console.error(
                        `[KitsuDb] Failed to update anime ${anime.slug}: ${error.message}`
                    );
                    return null;
                }

                return existing.id;
            }

            // Insert new record
            const { data: inserted, error } = await this.supabase
                .from("anime")
                .insert(anime)
                .select("id")
                .single();

            if (error) {
                // Handle duplicate slug by appending kitsu_id
                if (
                    error.message.includes("duplicate key") &&
                    error.message.includes("slug")
                ) {
                    const uniqueSlug = `${anime.slug}-${anime.kitsu_id}`;
                    const { data: retryInsert, error: retryError } =
                        await this.supabase
                            .from("anime")
                            .insert({ ...anime, slug: uniqueSlug })
                            .select("id")
                            .single();

                    if (retryError) {
                        console.error(
                            `[KitsuDb] Failed to insert anime ${anime.slug}: ${retryError.message}`
                        );
                        return null;
                    }

                    return retryInsert.id;
                }

                console.error(
                    `[KitsuDb] Failed to insert anime ${anime.slug}: ${error.message}`
                );
                return null;
            }

            return inserted.id;
        } catch (error) {
            console.error(
                `[KitsuDb] Error upserting anime ${anime.slug}: ${error}`
            );
            return null;
        }
    }

    /**
     * Upserts multiple anime records
     *
     * @param animeList - Array of transformed anime data
     * @returns Object with success count and failed count
     */
    async upsertAnimeList(animeList: TransformedAnime[]): Promise<{
        upserted: number;
        failed: number;
        animeIdMap: Map<string, string>;
    }> {
        let upserted = 0;
        let failed = 0;
        const animeIdMap = new Map<string, string>(); // kitsu_id -> db_id

        for (const anime of animeList) {
            const id = await this.upsertAnime(anime);
            if (id) {
                upserted++;
                animeIdMap.set(anime.kitsu_id, id);
            } else {
                failed++;
            }
        }

        console.log(`[KitsuDb] Upserted ${upserted} anime, ${failed} failed`);

        return { upserted, failed, animeIdMap };
    }

    /**
     * Gets or creates a genre by slug
     *
     * @param genre - Genre data
     * @returns Genre database ID or null
     */
    async getOrCreateGenre(genre: TransformedGenre): Promise<string | null> {
        try {
            // Check if genre exists
            const { data: existing } = await this.supabase
                .from("genres")
                .select("id")
                .eq("slug", genre.slug)
                .single();

            if (existing) {
                return existing.id;
            }

            // Create new genre
            const { data: created, error } = await this.supabase
                .from("genres")
                .insert(genre)
                .select("id")
                .single();

            if (error) {
                // Handle race condition where genre was created between check and insert
                if (error.message.includes("duplicate key")) {
                    const { data: refetch } = await this.supabase
                        .from("genres")
                        .select("id")
                        .eq("slug", genre.slug)
                        .single();

                    return refetch?.id || null;
                }

                console.error(
                    `[KitsuDb] Failed to create genre ${genre.slug}: ${error.message}`
                );
                return null;
            }

            return created.id;
        } catch (error) {
            console.error(`[KitsuDb] Error with genre ${genre.slug}: ${error}`);
            return null;
        }
    }

    /**
     * Ensures all genres exist in the database
     *
     * @param genres - Array of genre data
     * @returns Map of genre slug to database ID
     */
    async ensureGenres(
        genres: TransformedGenre[]
    ): Promise<Map<string, string>> {
        const genreIdMap = new Map<string, string>();
        let created = 0;

        for (const genre of genres) {
            const id = await this.getOrCreateGenre(genre);
            if (id) {
                genreIdMap.set(genre.slug, id);
                created++;
            }
        }

        console.log(
            `[KitsuDb] Ensured ${genreIdMap.size} genres (${created} processed)`
        );

        return genreIdMap;
    }

    /**
     * Links an anime to its genres
     *
     * @param animeDbId - Database ID of the anime
     * @param genreDbIds - Array of genre database IDs
     * @returns Number of links created
     */
    async linkAnimeGenres(
        animeDbId: string,
        genreDbIds: string[]
    ): Promise<number> {
        if (genreDbIds.length === 0) return 0;

        const links = genreDbIds.map((genreId) => ({
            anime_id: animeDbId,
            genre_id: genreId,
        }));

        try {
            const { error } = await this.supabase
                .from("anime_genres")
                .upsert(links, { onConflict: "anime_id,genre_id" });

            if (error) {
                console.error(
                    `[KitsuDb] Failed to link genres for anime ${animeDbId}: ${error.message}`
                );
                return 0;
            }

            return links.length;
        } catch (error) {
            console.error(`[KitsuDb] Error linking genres: ${error}`);
            return 0;
        }
    }

    /**
     * Syncs a complete transform result to the database
     *
     * @param result - Transformed data from Kitsu
     * @returns Sync statistics
     */
    async syncTransformResult(result: TransformResult): Promise<DbSyncResult> {
        const errors: string[] = [];

        console.log(
            `[KitsuDb] Starting sync: ${result.anime.length} anime, ${result.genres.length} genres`
        );

        // Step 1: Ensure all genres exist
        const genreIdMap = await this.ensureGenres(result.genres);

        // Step 2: Upsert all anime
        const { upserted, failed, animeIdMap } = await this.upsertAnimeList(
            result.anime
        );

        // Step 3: Link anime to genres
        let linksCreated = 0;
        for (const [kitsuId, genreSlugs] of result.animeGenres) {
            const animeDbId = animeIdMap.get(kitsuId);
            if (!animeDbId) continue;

            const genreDbIds = genreSlugs
                .map((slug) => genreIdMap.get(slug))
                .filter((id): id is string => id !== undefined);

            if (genreDbIds.length > 0) {
                linksCreated += await this.linkAnimeGenres(
                    animeDbId,
                    genreDbIds
                );
            }
        }

        console.log(
            `[KitsuDb] Sync complete: ${upserted} anime, ${genreIdMap.size} genres, ${linksCreated} links`
        );

        return {
            animeUpserted: upserted,
            animeFailed: failed,
            genresCreated: genreIdMap.size,
            animeGenreLinksCreated: linksCreated,
            errors,
        };
    }

    /**
     * Gets anime by Kitsu ID
     *
     * @param kitsuId - Kitsu anime ID
     * @returns Anime database record or null
     */
    async getAnimeByKitsuId(kitsuId: string): Promise<AnimeRecord | null> {
        try {
            const { data, error } = await this.supabase
                .from("anime")
                .select("id, kitsu_id")
                .eq("kitsu_id", kitsuId)
                .single();

            if (error || !data) return null;
            return data as AnimeRecord;
        } catch {
            return null;
        }
    }

    /**
     * Gets all genres
     *
     * @returns Map of genre slug to database ID
     */
    async getAllGenres(): Promise<Map<string, string>> {
        const genreMap = new Map<string, string>();

        try {
            const { data, error } = await this.supabase
                .from("genres")
                .select("id, slug");

            if (error || !data) return genreMap;

            for (const genre of data as GenreRecord[]) {
                genreMap.set(genre.slug, genre.id);
            }
        } catch {
            // Return empty map on error
        }

        return genreMap;
    }

    /**
     * Counts anime in the database
     *
     * @returns Total anime count
     */
    async countAnime(): Promise<number> {
        try {
            const { count, error } = await this.supabase
                .from("anime")
                .select("*", { count: "exact", head: true });

            if (error) return 0;
            return count || 0;
        } catch {
            return 0;
        }
    }

    /**
     * Counts anime by season and year
     *
     * @param season - The season
     * @param year - The year
     * @returns Anime count for the season
     */
    async countAnimeBySeason(season: string, year: number): Promise<number> {
        try {
            const { count, error } = await this.supabase
                .from("anime")
                .select("*", { count: "exact", head: true })
                .eq("season", season.toUpperCase())
                .eq("season_year", year);

            if (error) return 0;
            return count || 0;
        } catch {
            return 0;
        }
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a database service instance using environment variables
 *
 * @returns KitsuDbService instance
 * @throws Error if environment variables are not set
 */
export function createDbService(): KitsuDbService {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required"
        );
    }

    return new KitsuDbService(supabaseUrl, supabaseKey);
}
