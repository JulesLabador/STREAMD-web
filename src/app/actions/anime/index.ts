/**
 * Anime Server Actions
 *
 * This module re-exports all anime-related server actions organized by domain entity.
 * Import from this file for convenient access to all anime actions.
 *
 * @example
 * import { getAnimeBySlug, getStudios, getSeasons } from "@/app/actions/anime";
 */

// Core anime CRUD and filtered queries
export {
    getAnimeList,
    getAnimeBySlug,
    getAnimeByShortId,
    getAnimeById,
    getFilteredAnimeList,
    getAvailableYears,
} from "./core";
export type { AnimeFilters } from "./core";

// Studio entity actions
export { getStudios, getStudioBySlug, getCurrentSeasonStudios } from "./studios";

// Season entity actions (includes upcoming and SEO content)
export {
    getSeasons,
    getAnimeBySeason,
    getCurrentSeasonAnime,
    getSeasonalStats,
    getUpcomingAnime,
    getUpcomingSeasonStats,
    getNextSeasonStats,
    getSeasonContent,
    getSeasonContentBySeasonYear,
} from "./seasons";
export type { SeasonAnimeSortBy, CurrentSeasonStats, SeasonContent } from "./seasons";

// Genre entity actions
export { getGenres, getGenreBySlug } from "./genres";

// Platform entity actions
export { getPlatforms, getAnimeByPlatform } from "./platforms";

