/**
 * Kitsu Data Transformer
 *
 * Transforms Kitsu API responses into the format expected by our Supabase database.
 * Handles field mapping, data normalization, and slug generation.
 */

import { customAlphabet } from "nanoid";
import type {
    KitsuAnime,
    KitsuAnimeListResponse,
    KitsuAnimeStatus,
    KitsuAnimeSubtype,
    KitsuCategory,
    KitsuGenre,
    KitsuIncludedResource,
    Season,
} from "./types";
import type { AnimeFormat, AnimeSeason, AnimeStatus } from "@/types/anime";

// Short ID generator: 8-character uppercase alphanumeric
const generateShortId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

// ============================================================================
// Types
// ============================================================================

/**
 * Transformed anime record ready for database insertion
 */
export interface TransformedAnime {
    short_id: string;
    slug: string;
    titles: {
        english: string | null;
        romaji: string;
        japanese: string | null;
    };
    format: AnimeFormat;
    episode_count: number | null;
    episode_duration: number | null;
    season: AnimeSeason | null;
    season_year: number | null;
    start_date: string | null;
    end_date: string | null;
    synopsis: string | null;
    average_rating: number | null;
    popularity: number;
    status: AnimeStatus;
    mal_id: number | null;
    anilist_id: number | null;
    kitsu_id: string;
    cover_image_url: string | null;
    banner_image_url: string | null;
}

/**
 * Transformed genre record
 */
export interface TransformedGenre {
    name: string;
    slug: string;
}

/**
 * Transformed studio record
 */
export interface TransformedStudio {
    name: string;
    slug: string;
}

/**
 * Result of transforming a Kitsu response
 */
export interface TransformResult {
    anime: TransformedAnime[];
    genres: TransformedGenre[];
    /** Map of Kitsu anime ID to genre slugs */
    animeGenres: Map<string, string[]>;
}

// ============================================================================
// Constants
// ============================================================================

/** Valid anime formats in our database */
const VALID_FORMATS: AnimeFormat[] = [
    "TV",
    "MOVIE",
    "OVA",
    "ONA",
    "SPECIAL",
    "MUSIC",
];

/** Valid anime statuses in our database */
const VALID_STATUSES: AnimeStatus[] = [
    "FINISHED",
    "RELEASING",
    "NOT_YET_RELEASED",
    "CANCELLED",
    "HIATUS",
];

/** Valid seasons in our database */
const VALID_SEASONS: AnimeSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

// ============================================================================
// Mapping Functions
// ============================================================================

/**
 * Maps Kitsu subtype to our AnimeFormat enum
 *
 * @param subtype - Kitsu anime subtype
 * @returns Mapped AnimeFormat
 */
export function mapFormat(subtype: KitsuAnimeSubtype | undefined): AnimeFormat {
    if (!subtype) return "TV";

    const mapping: Record<string, AnimeFormat> = {
        TV: "TV",
        movie: "MOVIE",
        OVA: "OVA",
        ONA: "ONA",
        special: "SPECIAL",
        music: "MUSIC",
    };

    return mapping[subtype] || "TV";
}

/**
 * Maps Kitsu status to our AnimeStatus enum
 *
 * @param status - Kitsu anime status
 * @returns Mapped AnimeStatus
 */
export function mapStatus(status: KitsuAnimeStatus | undefined): AnimeStatus {
    if (!status) return "FINISHED";

    const mapping: Record<KitsuAnimeStatus, AnimeStatus> = {
        current: "RELEASING",
        finished: "FINISHED",
        tba: "NOT_YET_RELEASED",
        unreleased: "NOT_YET_RELEASED",
        upcoming: "NOT_YET_RELEASED",
    };

    return mapping[status] || "FINISHED";
}

/**
 * Maps Kitsu season string to our AnimeSeason enum
 *
 * @param season - Season string from filter or date
 * @returns Mapped AnimeSeason or null
 */
export function mapSeason(
    season: Season | string | undefined
): AnimeSeason | null {
    if (!season) return null;

    const normalized = season.toUpperCase();
    if (VALID_SEASONS.includes(normalized as AnimeSeason)) {
        return normalized as AnimeSeason;
    }

    return null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a URL-safe slug from a string
 *
 * @param str - String to convert to slug
 * @returns Lowercase slug with only alphanumeric characters and hyphens
 */
export function generateSlug(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100);
}

/**
 * Scales rating from Kitsu's 0-100 scale to our 0-10 scale
 *
 * @param rating - Rating string from Kitsu (e.g., "84.52")
 * @returns Rating on 0-10 scale, rounded to 2 decimal places
 */
export function scaleRating(rating: string | null): number | null {
    if (!rating) return null;

    const parsed = parseFloat(rating);
    if (isNaN(parsed)) return null;

    // Kitsu ratings are on 0-100 scale, convert to 0-10
    return Math.round((parsed / 10) * 100) / 100;
}

/**
 * Extracts the best cover image URL from Kitsu poster images
 *
 * @param posterImage - Kitsu poster image object
 * @returns Best available image URL or null
 */
export function extractCoverImage(
    posterImage: KitsuAnime["attributes"]["posterImage"]
): string | null {
    if (!posterImage) return null;

    // Prefer large, then medium, then original, then any available
    return (
        posterImage.large ||
        posterImage.medium ||
        posterImage.original ||
        posterImage.small ||
        posterImage.tiny ||
        null
    );
}

/**
 * Extracts the banner image URL from Kitsu cover images
 *
 * @param coverImage - Kitsu cover image object
 * @returns Best available banner URL or null
 */
export function extractBannerImage(
    coverImage: KitsuAnime["attributes"]["coverImage"]
): string | null {
    if (!coverImage) return null;

    return (
        coverImage.large ||
        coverImage.original ||
        coverImage.small ||
        coverImage.tiny ||
        null
    );
}

/**
 * Extracts year from a date string
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Year as number or null
 */
export function extractYear(dateStr: string | null): number | null {
    if (!dateStr) return null;

    const match = dateStr.match(/^(\d{4})/);
    if (match) {
        return parseInt(match[1], 10);
    }

    return null;
}

/**
 * Determines the season from a start date
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns AnimeSeason or null
 */
export function extractSeasonFromDate(
    dateStr: string | null
): AnimeSeason | null {
    if (!dateStr) return null;

    const match = dateStr.match(/^\d{4}-(\d{2})/);
    if (!match) return null;

    const month = parseInt(match[1], 10);

    if (month >= 1 && month <= 3) return "WINTER";
    if (month >= 4 && month <= 6) return "SPRING";
    if (month >= 7 && month <= 9) return "SUMMER";
    if (month >= 10 && month <= 12) return "FALL";

    return null;
}

// ============================================================================
// Main Transformer Functions
// ============================================================================

/**
 * Transforms a single Kitsu anime record to our database format
 *
 * @param anime - Kitsu anime object
 * @param seasonOverride - Optional season to use instead of extracting from date
 * @param yearOverride - Optional year to use instead of extracting from date
 * @returns Transformed anime record
 */
export function transformAnime(
    anime: KitsuAnime,
    seasonOverride?: Season,
    yearOverride?: number
): TransformedAnime {
    const attrs = anime.attributes;

    // Generate short ID for URL-stable identification
    const short_id = generateShortId();

    // Build titles object
    const titles = {
        english: attrs.titles.en || attrs.titles.en_us || null,
        romaji:
            attrs.titles.en_jp ||
            attrs.canonicalTitle ||
            attrs.titles.en ||
            "Unknown",
        japanese: attrs.titles.ja_jp || null,
    };

    // Generate slug from the best available title
    const titleForSlug = titles.romaji || titles.english || "unknown";
    const slug = generateSlug(titleForSlug);

    // Determine season and year
    const season = seasonOverride
        ? mapSeason(seasonOverride)
        : extractSeasonFromDate(attrs.startDate);

    const seasonYear = yearOverride || extractYear(attrs.startDate);

    return {
        short_id,
        slug,
        titles,
        format: mapFormat(attrs.subtype),
        episode_count: attrs.episodeCount,
        episode_duration: attrs.episodeLength,
        season,
        season_year: seasonYear,
        start_date: attrs.startDate,
        end_date: attrs.endDate,
        synopsis: attrs.synopsis || attrs.description,
        average_rating: scaleRating(attrs.averageRating),
        popularity: attrs.popularityRank || 99999,
        status: mapStatus(attrs.status),
        mal_id: null, // Would need separate mapping lookup
        anilist_id: null, // Would need separate mapping lookup
        kitsu_id: anime.id,
        cover_image_url: extractCoverImage(attrs.posterImage),
        banner_image_url: extractBannerImage(attrs.coverImage),
    };
}

/**
 * Extracts genres from Kitsu included resources
 *
 * @param included - Array of included resources from Kitsu response
 * @returns Array of transformed genres
 */
export function extractGenres(
    included: KitsuIncludedResource[] | undefined
): TransformedGenre[] {
    if (!included) return [];

    const genres: TransformedGenre[] = [];
    const seen = new Set<string>();

    for (const resource of included) {
        if (resource.type === "genres") {
            const genre = resource as KitsuGenre;
            const slug =
                genre.attributes.slug || generateSlug(genre.attributes.name);

            if (!seen.has(slug)) {
                seen.add(slug);
                genres.push({
                    name: genre.attributes.name,
                    slug,
                });
            }
        } else if (resource.type === "categories") {
            // Categories can also be used as genres
            const category = resource as KitsuCategory;
            const slug =
                category.attributes.slug ||
                generateSlug(category.attributes.title);

            if (!seen.has(slug)) {
                seen.add(slug);
                genres.push({
                    name: category.attributes.title,
                    slug,
                });
            }
        }
    }

    return genres;
}

/**
 * Builds a map of anime ID to genre slugs from Kitsu response
 *
 * @param animeList - List of Kitsu anime
 * @param included - Included resources
 * @returns Map of Kitsu anime ID to array of genre slugs
 */
export function buildAnimeGenreMap(
    animeList: KitsuAnime[],
    included: KitsuIncludedResource[] | undefined
): Map<string, string[]> {
    const map = new Map<string, string[]>();

    if (!included) return map;

    // Build a lookup of resource ID to slug
    const genreLookup = new Map<string, string>();
    for (const resource of included) {
        if (resource.type === "genres") {
            const genre = resource as KitsuGenre;
            genreLookup.set(
                genre.id,
                genre.attributes.slug || generateSlug(genre.attributes.name)
            );
        } else if (resource.type === "categories") {
            const category = resource as KitsuCategory;
            genreLookup.set(
                category.id,
                category.attributes.slug ||
                    generateSlug(category.attributes.title)
            );
        }
    }

    // Map each anime to its genres
    for (const anime of animeList) {
        const genreSlugs: string[] = [];

        // Check genres relationship
        const genresData = anime.relationships.genres?.data;
        if (Array.isArray(genresData)) {
            for (const ref of genresData) {
                const slug = genreLookup.get(ref.id);
                if (slug) genreSlugs.push(slug);
            }
        }

        // Check categories relationship
        const categoriesData = anime.relationships.categories?.data;
        if (Array.isArray(categoriesData)) {
            for (const ref of categoriesData) {
                const slug = genreLookup.get(ref.id);
                if (slug && !genreSlugs.includes(slug)) {
                    genreSlugs.push(slug);
                }
            }
        }

        if (genreSlugs.length > 0) {
            map.set(anime.id, genreSlugs);
        }
    }

    return map;
}

/**
 * Transforms a complete Kitsu API response
 *
 * @param response - Kitsu anime list response
 * @param seasonOverride - Optional season for all anime
 * @param yearOverride - Optional year for all anime
 * @returns Transformed anime, genres, and anime-genre mappings
 */
export function transformResponse(
    response: KitsuAnimeListResponse,
    seasonOverride?: Season,
    yearOverride?: number
): TransformResult {
    // Transform all anime
    const anime = response.data.map((a) =>
        transformAnime(a, seasonOverride, yearOverride)
    );

    // Extract genres from included resources
    const genres = extractGenres(response.included);

    // Build anime-genre mappings
    const animeGenres = buildAnimeGenreMap(response.data, response.included);

    return {
        anime,
        genres,
        animeGenres,
    };
}

/**
 * Transforms multiple Kitsu API responses (e.g., from pagination)
 *
 * @param responses - Array of Kitsu anime list responses
 * @param seasonOverride - Optional season for all anime
 * @param yearOverride - Optional year for all anime
 * @returns Combined transformed results
 */
export function transformResponses(
    responses: KitsuAnimeListResponse[],
    seasonOverride?: Season,
    yearOverride?: number
): TransformResult {
    const allAnime: TransformedAnime[] = [];
    const allGenres: TransformedGenre[] = [];
    const allAnimeGenres = new Map<string, string[]>();
    const seenGenreSlugs = new Set<string>();

    for (const response of responses) {
        const result = transformResponse(
            response,
            seasonOverride,
            yearOverride
        );

        // Add anime
        allAnime.push(...result.anime);

        // Add unique genres
        for (const genre of result.genres) {
            if (!seenGenreSlugs.has(genre.slug)) {
                seenGenreSlugs.add(genre.slug);
                allGenres.push(genre);
            }
        }

        // Merge anime-genre mappings
        for (const [animeId, genreSlugs] of result.animeGenres) {
            allAnimeGenres.set(animeId, genreSlugs);
        }
    }

    return {
        anime: allAnime,
        genres: allGenres,
        animeGenres: allAnimeGenres,
    };
}
