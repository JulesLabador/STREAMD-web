/**
 * Query Functions Barrel Export
 *
 * Server-side data fetching functions for use in Server Components.
 * These are NOT server actions - they are regular async functions.
 *
 * Usage:
 *   import { getAnimeByShortId, getSeasons } from "@/lib/queries";
 *
 * For client-side mutations, use the server actions in @/app/actions/
 */

// Anime queries
export {
    getAnimeList,
    getAnimeBySlug,
    getAnimeByShortId,
    getAnimeByShortIdForMetadata,
    getAnimeById,
    getRelatedAnime,
    getFilteredAnimeList,
    getAvailableYears,
    type AnimeFilters,
} from "./anime";

// Season queries
export {
    getSeasonContent,
    getSeasonContentBySeasonYear,
    getSeasons,
    getAnimeBySeason,
    getCurrentSeasonAnime,
    getSeasonalStats,
    getUpcomingAnime,
    getUpcomingSeasonStats,
    getNextSeasonStats,
    type SeasonContent,
    type SeasonAnimeSortBy,
    type CurrentSeasonStats,
} from "./seasons";

// Genre queries
export { getGenres, getGenreBySlug } from "./genres";

// Studio queries
export {
    getStudios,
    getStudioBySlug,
    getCurrentSeasonStudios,
} from "./studios";

// Platform queries
export { getPlatforms, getAnimeByPlatform } from "./platforms";

// User queries
export {
    getUserProfile,
    getCurrentUserProfile,
    getUserAnimeByStatus,
    getUserAnimeMap,
    getUserStats,
} from "./user";

// Auth queries
export { getCurrentUser } from "./auth";

