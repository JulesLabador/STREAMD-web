/**
 * Types for season content generation
 *
 * @module scripts/season-content/types
 */

/**
 * Response structure for season content generation
 */
export interface SeasonContentResponse {
    /** SEO meta description (150-160 chars) */
    metaDescription: string;
    /** Short intro paragraph (1-2 sentences) */
    introParagraph: string;
    /** Full season summary (2-3 paragraphs) */
    fullSummary: string;
}

/**
 * Input data for generating season content
 */
export interface SeasonContentInput {
    /** Season name (WINTER, SPRING, SUMMER, FALL) */
    season: string;
    /** Year */
    year: number;
    /** Whether this is a past, current, or future season */
    timeContext: "past" | "current" | "future";
    /** Total anime count for the season */
    animeCount: number;
    /** Format breakdown (TV, MOVIE, OVA, etc.) */
    formatBreakdown: Record<string, number>;
    /** Top anime titles by popularity */
    topAnime: string[];
    /** Genre distribution */
    genreDistribution: Record<string, number>;
    /** Number of sequels */
    sequelCount: number;
    /** Number of new original series */
    newSeriesCount: number;
    /** Notable studios */
    notableStudios: string[];
}

/**
 * Season data fetched from the database
 */
export interface SeasonData {
    season: string;
    year: number;
    slug: string;
    animeCount: number;
    formatBreakdown: Record<string, number>;
    topAnime: string[];
    genreDistribution: Record<string, number>;
    sequelCount: number;
    newSeriesCount: number;
    notableStudios: string[];
}

/**
 * Result of content generation for a single season
 */
export interface GenerationResult {
    slug: string;
    success: boolean;
    error?: string;
    content?: SeasonContentResponse;
    duration?: number;
    model?: string;
}

/**
 * Result of comparing multiple models
 */
export interface ModelComparisonResult {
    model: string;
    modelInfo: { name: string; description: string };
    result: GenerationResult;
    seasonData: SeasonData;
}

/**
 * CLI options for the generation script
 */
export interface CliOptions {
    season?: string;
    year?: number;
    all: boolean;
    force: boolean;
    model: string;
    compare: boolean;
    verbose: boolean;
    dryRun: boolean;
    help: boolean;
}
