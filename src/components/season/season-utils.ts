import { AnimeSeason } from "@/types/anime";

/**
 * Season time context type
 * Represents whether a season is in the past, present, or future
 */
export type SeasonTimeContext = "past" | "current" | "future";

/**
 * Season configuration for month ranges
 */
export const SEASON_MONTHS: Record<string, string> = {
    WINTER: "January - March",
    SPRING: "April - June",
    SUMMER: "July - September",
    FALL: "October - December",
};

/**
 * Season order for navigation calculations
 */
export const SEASON_ORDER: AnimeSeason[] = [
    "WINTER",
    "SPRING",
    "SUMMER",
    "FALL",
];

/**
 * Minimum and maximum years for season navigation
 * Prevents navigation to unreasonably old or far future seasons
 */
export const MIN_SEASON_YEAR = 1980;
export const MAX_SEASON_YEAR = new Date().getFullYear() + 2;

/**
 * Formats season name for display
 * @param season - Season enum value
 * @returns Formatted season name (e.g., "Winter", "Spring")
 */
export function formatSeasonName(season: string): string {
    return season.charAt(0) + season.slice(1).toLowerCase();
}

/**
 * Calculates the previous season and year
 * @param season - Current season
 * @param year - Current year
 * @returns Previous season/year or null if at minimum boundary
 */
export function getPreviousSeason(
    season: AnimeSeason,
    year: number
): { season: AnimeSeason; year: number } | null {
    const currentIndex = SEASON_ORDER.indexOf(season);

    if (currentIndex === 0) {
        // Winter -> previous Fall (year - 1)
        const newYear = year - 1;
        if (newYear < MIN_SEASON_YEAR) return null;
        return { season: "FALL", year: newYear };
    }

    // Move to previous season in same year
    return { season: SEASON_ORDER[currentIndex - 1], year };
}

/**
 * Calculates the next season and year
 * @param season - Current season
 * @param year - Current year
 * @returns Next season/year or null if at maximum boundary
 */
export function getNextSeason(
    season: AnimeSeason,
    year: number
): { season: AnimeSeason; year: number } | null {
    const currentIndex = SEASON_ORDER.indexOf(season);

    if (currentIndex === 3) {
        // Fall -> next Winter (year + 1)
        const newYear = year + 1;
        if (newYear > MAX_SEASON_YEAR) return null;
        return { season: "WINTER", year: newYear };
    }

    // Move to next season in same year
    return { season: SEASON_ORDER[currentIndex + 1], year };
}

/**
 * Determines if a season is in the past, present, or future
 * @param season - Season to check
 * @param year - Year to check
 * @returns Time context of the season
 */
export function getSeasonTimeContext(
    season: string,
    year: number
): SeasonTimeContext {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Determine current season based on month
    let currentSeason: string;
    if (currentMonth >= 1 && currentMonth <= 3) {
        currentSeason = "WINTER";
    } else if (currentMonth >= 4 && currentMonth <= 6) {
        currentSeason = "SPRING";
    } else if (currentMonth >= 7 && currentMonth <= 9) {
        currentSeason = "SUMMER";
    } else {
        currentSeason = "FALL";
    }

    const seasonOrder = ["WINTER", "SPRING", "SUMMER", "FALL"];
    const targetSeasonIndex = seasonOrder.indexOf(season);
    const currentSeasonIndex = seasonOrder.indexOf(currentSeason);

    // Compare years first
    if (year > currentYear) {
        return "future";
    } else if (year < currentYear) {
        return "past";
    }

    // Same year - compare seasons
    if (targetSeasonIndex > currentSeasonIndex) {
        return "future";
    } else if (targetSeasonIndex < currentSeasonIndex) {
        return "past";
    }

    return "current";
}

