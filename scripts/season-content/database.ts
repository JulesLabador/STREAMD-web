/**
 * Database operations for season content generation
 *
 * @module scripts/season-content/database
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SEASON_ORDER } from "./config";
import type { SeasonData, SeasonContentResponse } from "./types";

/**
 * Creates a Supabase client with service role access
 */
export function createSupabaseClient(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY"
        );
    }

    return createClient(supabaseUrl, supabaseKey);
}

/**
 * Fetches all unique seasons from the anime table
 */
export async function getAvailableSeasons(
    supabase: SupabaseClient,
    year?: number
): Promise<Array<{ season: string; year: number }>> {
    let query = supabase
        .from("anime")
        .select("season, season_year")
        .not("season", "is", null)
        .not("season_year", "is", null);

    if (year) {
        query = query.eq("season_year", year);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch seasons: ${error.message}`);
    }

    // Get unique season/year combinations
    const uniqueSeasons = new Map<string, { season: string; year: number }>();

    for (const row of data || []) {
        if (row.season && row.season_year) {
            const key = `${row.season}-${row.season_year}`;
            if (!uniqueSeasons.has(key)) {
                uniqueSeasons.set(key, {
                    season: row.season,
                    year: row.season_year,
                });
            }
        }
    }

    // Sort by year (desc) then season order
    return Array.from(uniqueSeasons.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return SEASON_ORDER.indexOf(a.season) - SEASON_ORDER.indexOf(b.season);
    });
}

/**
 * Fetches detailed season data for content generation
 */
export async function getSeasonData(
    supabase: SupabaseClient,
    season: string,
    year: number
): Promise<SeasonData> {
    const slug = `${season.toLowerCase()}-${year}`;

    // Fetch anime for this season with genres and studios
    const { data: animeData, error: animeError } = await supabase
        .from("anime")
        .select(
            `
            id,
            titles,
            format,
            popularity,
            average_rating,
            status
        `
        )
        .eq("season", season)
        .eq("season_year", year)
        .order("popularity", { ascending: true });

    if (animeError) {
        throw new Error(`Failed to fetch anime: ${animeError.message}`);
    }

    const animeList = animeData || [];
    const animeCount = animeList.length;

    // Calculate format breakdown
    const formatBreakdown: Record<string, number> = {};
    for (const anime of animeList) {
        const format = anime.format || "UNKNOWN";
        formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
    }

    // Get top anime titles
    const topAnime = animeList.slice(0, 15).map((a) => {
        const titles = a.titles as { english?: string; romaji?: string };
        return titles?.english || titles?.romaji || "Unknown";
    });

    // Count sequels vs new series
    const sequelPatterns =
        /season\s*\d|part\s*\d|\d+(st|nd|rd|th)\s*season|cour\s*\d|ii|iii|iv|2nd|3rd|4th/i;
    let sequelCount = 0;
    let newSeriesCount = 0;

    for (const anime of animeList) {
        const titles = anime.titles as { english?: string; romaji?: string };
        const titleToCheck = titles?.english || titles?.romaji || "";
        if (sequelPatterns.test(titleToCheck)) {
            sequelCount++;
        } else {
            newSeriesCount++;
        }
    }

    // Fetch genres for these anime
    const animeIds = animeList.map((a) => a.id);
    const genreDistribution: Record<string, number> = {};

    if (animeIds.length > 0) {
        const { data: genreData } = await supabase
            .from("anime_genres")
            .select("genres(name)")
            .in("anime_id", animeIds);

        for (const row of genreData || []) {
            // Supabase returns the joined table data - handle both array and object forms
            const genres = row.genres as
                | { name: string }
                | { name: string }[]
                | null;
            const genreName = Array.isArray(genres)
                ? genres[0]?.name
                : genres?.name;
            if (genreName) {
                genreDistribution[genreName] =
                    (genreDistribution[genreName] || 0) + 1;
            }
        }
    }

    // Fetch studios for these anime
    const notableStudios: string[] = [];

    if (animeIds.length > 0) {
        const { data: studioData } = await supabase
            .from("anime_studios")
            .select("studios(name)")
            .in("anime_id", animeIds);

        const studioCounts = new Map<string, number>();
        for (const row of studioData || []) {
            // Supabase returns the joined table data - handle both array and object forms
            const studios = row.studios as
                | { name: string }
                | { name: string }[]
                | null;
            const studioName = Array.isArray(studios)
                ? studios[0]?.name
                : studios?.name;
            if (studioName) {
                studioCounts.set(
                    studioName,
                    (studioCounts.get(studioName) || 0) + 1
                );
            }
        }

        // Get top studios by anime count
        const sortedStudios = Array.from(studioCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name]) => name);

        notableStudios.push(...sortedStudios);
    }

    return {
        season,
        year,
        slug,
        animeCount,
        formatBreakdown,
        topAnime,
        genreDistribution,
        sequelCount,
        newSeriesCount,
        notableStudios,
    };
}

/**
 * Checks if content already exists for a season
 */
export async function contentExists(
    supabase: SupabaseClient,
    slug: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from("season_content")
        .select("id")
        .eq("slug", slug)
        .single();

    if (error && error.code !== "PGRST116") {
        // PGRST116 = not found
        throw new Error(`Failed to check existing content: ${error.message}`);
    }

    return !!data;
}

/**
 * Saves generated content to the database
 */
export async function saveContent(
    supabase: SupabaseClient,
    seasonData: SeasonData,
    content: SeasonContentResponse,
    model: string
): Promise<void> {
    const { error } = await supabase.from("season_content").upsert(
        {
            season: seasonData.season,
            year: seasonData.year,
            slug: seasonData.slug,
            meta_description: content.metaDescription,
            intro_paragraph: content.introParagraph,
            full_summary: content.fullSummary,
            generated_at: new Date().toISOString(),
            model_used: model,
        },
        {
            onConflict: "slug",
        }
    );

    if (error) {
        throw new Error(`Failed to save content: ${error.message}`);
    }
}
