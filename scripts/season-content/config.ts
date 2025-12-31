/**
 * Configuration for season content generation
 *
 * @module scripts/season-content/config
 */

/**
 * Models to compare when using --compare flag
 * Edit this array to change which models are compared
 */
export const COMPARISON_MODELS = ["gpt-5-mini", "gpt-5-nano"];

/**
 * Model display names and descriptions for comparison output
 */
export const MODEL_INFO: Record<string, { name: string; description: string }> =
    {
        "gpt-4o": {
            name: "GPT-4o",
            description: "Latest flagship model, best quality",
        },
        "gpt-4o-mini": {
            name: "GPT-4o Mini",
            description: "Fast and cost-effective",
        },
        "gpt-5-mini": {
            name: "GPT-5 Mini",
            description:
                "A faster, cost-efficient version of GPT-5 for well-defined tasks",
        },
        "gpt-5-nano": {
            name: "GPT-5 Nano",
            description:
                "The smallest and fastest version of GPT-5 for the most resource-constrained use cases",
        },
        "gpt-4-turbo": {
            name: "GPT-4 Turbo",
            description: "Previous generation, good balance",
        },
        "gpt-3.5-turbo": {
            name: "GPT-3.5 Turbo",
            description: "Legacy model, fastest and cheapest",
        },
    };

/**
 * Season month ranges for natural language descriptions
 */
export const SEASON_MONTHS: Record<string, string> = {
    WINTER: "January through March",
    SPRING: "April through June",
    SUMMER: "July through September",
    FALL: "October through December",
};

/**
 * Valid season names
 */
export const VALID_SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];

/**
 * Season order for sorting
 */
export const SEASON_ORDER = ["WINTER", "SPRING", "SUMMER", "FALL"];
