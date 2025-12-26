/**
 * Season Utilities
 *
 * Utilities for calculating and working with anime seasons.
 * Anime seasons are quarterly periods:
 * - Winter: January - March
 * - Spring: April - June
 * - Summer: July - September
 * - Fall: October - December
 */

import type { Season, SeasonFilter } from "./types";

// ============================================================================
// Constants
// ============================================================================

/**
 * Ordered list of seasons in chronological order within a year
 */
export const SEASONS_IN_ORDER: Season[] = [
    "winter",
    "spring",
    "summer",
    "fall",
];

/**
 * Month ranges for each season (1-indexed months)
 */
export const SEASON_MONTHS: Record<Season, number[]> = {
    winter: [1, 2, 3],
    spring: [4, 5, 6],
    summer: [7, 8, 9],
    fall: [10, 11, 12],
};

// ============================================================================
// Season Calculation Functions
// ============================================================================

/**
 * Gets the current anime season based on the current date
 *
 * @returns The current season (winter, spring, summer, fall)
 */
export function getCurrentSeason(): Season {
    const month = new Date().getMonth() + 1; // getMonth() is 0-indexed

    if (month >= 1 && month <= 3) return "winter";
    if (month >= 4 && month <= 6) return "spring";
    if (month >= 7 && month <= 9) return "summer";
    return "fall";
}

/**
 * Gets the current year
 *
 * @returns The current year as a number
 */
export function getCurrentYear(): number {
    return new Date().getFullYear();
}

/**
 * Gets the current season and year as a SeasonFilter
 *
 * @returns Object containing current season and year
 */
export function getCurrentSeasonFilter(): SeasonFilter {
    return {
        season: getCurrentSeason(),
        year: getCurrentYear(),
    };
}

/**
 * Gets the season for a specific date
 *
 * @param date - The date to get the season for
 * @returns The season for the given date
 */
export function getSeasonForDate(date: Date): Season {
    const month = date.getMonth() + 1;

    if (month >= 1 && month <= 3) return "winter";
    if (month >= 4 && month <= 6) return "spring";
    if (month >= 7 && month <= 9) return "summer";
    return "fall";
}

/**
 * Gets the start date of a season
 *
 * @param season - The season
 * @param year - The year
 * @returns Date object representing the first day of the season
 */
export function getSeasonStartDate(season: Season, year: number): Date {
    const monthMap: Record<Season, number> = {
        winter: 0, // January (0-indexed)
        spring: 3, // April
        summer: 6, // July
        fall: 9, // October
    };

    return new Date(year, monthMap[season], 1);
}

/**
 * Gets the end date of a season
 *
 * @param season - The season
 * @param year - The year
 * @returns Date object representing the last day of the season
 */
export function getSeasonEndDate(season: Season, year: number): Date {
    const endMonthMap: Record<Season, number> = {
        winter: 2, // March (0-indexed)
        spring: 5, // June
        summer: 8, // September
        fall: 11, // December
    };

    const month = endMonthMap[season];
    // Get the last day of the month by going to next month day 0
    return new Date(year, month + 1, 0);
}

// ============================================================================
// Season Navigation Functions
// ============================================================================

/**
 * Gets the previous season and year
 *
 * @param season - Current season
 * @param year - Current year
 * @returns Object with previous season and year
 */
export function getPreviousSeason(season: Season, year: number): SeasonFilter {
    const currentIndex = SEASONS_IN_ORDER.indexOf(season);

    if (currentIndex === 0) {
        // Winter -> previous Fall (previous year)
        return { season: "fall", year: year - 1 };
    }

    return {
        season: SEASONS_IN_ORDER[currentIndex - 1],
        year,
    };
}

/**
 * Gets the next season and year
 *
 * @param season - Current season
 * @param year - Current year
 * @returns Object with next season and year
 */
export function getNextSeason(season: Season, year: number): SeasonFilter {
    const currentIndex = SEASONS_IN_ORDER.indexOf(season);

    if (currentIndex === 3) {
        // Fall -> next Winter (next year)
        return { season: "winter", year: year + 1 };
    }

    return {
        season: SEASONS_IN_ORDER[currentIndex + 1],
        year,
    };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates if a string is a valid season
 *
 * @param value - String to validate
 * @returns True if the value is a valid season
 */
export function isValidSeason(value: string): value is Season {
    return SEASONS_IN_ORDER.includes(value.toLowerCase() as Season);
}

/**
 * Validates if a year is reasonable for anime data
 * (between 1960 and 10 years in the future)
 *
 * @param year - Year to validate
 * @returns True if the year is valid
 */
export function isValidYear(year: number): boolean {
    const currentYear = getCurrentYear();
    return year >= 1960 && year <= currentYear + 10;
}

/**
 * Parses and validates season input
 *
 * @param value - String value to parse as season
 * @returns Lowercase season or null if invalid
 */
export function parseSeason(value: string): Season | null {
    const normalized = value.toLowerCase().trim();
    if (isValidSeason(normalized)) {
        return normalized;
    }
    return null;
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Formats a season and year as a display string
 *
 * @param season - The season
 * @param year - The year
 * @returns Formatted string like "Winter 2025"
 */
export function formatSeasonYear(season: Season, year: number): string {
    const capitalizedSeason = season.charAt(0).toUpperCase() + season.slice(1);
    return `${capitalizedSeason} ${year}`;
}

/**
 * Creates a slug from season and year
 *
 * @param season - The season
 * @param year - The year
 * @returns Slug like "winter-2025"
 */
export function createSeasonSlug(season: Season, year: number): string {
    return `${season.toLowerCase()}-${year}`;
}

/**
 * Parses a season slug into season and year
 *
 * @param slug - Slug in format "winter-2025"
 * @returns SeasonFilter or null if invalid
 */
export function parseSeasonSlug(slug: string): SeasonFilter | null {
    const match = slug.match(/^(winter|spring|summer|fall)-(\d{4})$/i);
    if (!match) return null;

    const season = match[1].toLowerCase() as Season;
    const year = parseInt(match[2], 10);

    if (!isValidYear(year)) return null;

    return { season, year };
}
