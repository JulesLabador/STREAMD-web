/**
 * Season content generation module
 *
 * Re-exports all components for the season content generation script.
 *
 * @module scripts/season-content
 */

// Types
export type {
    SeasonContentResponse,
    SeasonContentInput,
    SeasonData,
    GenerationResult,
    ModelComparisonResult,
    CliOptions,
} from "./types";

// Config
export {
    COMPARISON_MODELS,
    MODEL_INFO,
    SEASON_MONTHS,
    VALID_SEASONS,
    SEASON_ORDER,
} from "./config";

// Generator
export { generateSeasonContent, getTimeContext } from "./generator";

// Database
export {
    createSupabaseClient,
    getAvailableSeasons,
    getSeasonData,
    contentExists,
    saveContent,
} from "./database";

// Output
export {
    printSeasonData,
    printGeneratedContent,
    printModelComparison,
    wrapText,
} from "./output";
