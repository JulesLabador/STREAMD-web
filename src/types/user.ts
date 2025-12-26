/**
 * User domain types
 * Based on the database schema for users and user_anime tables
 */

import type { Anime } from "./anime";

// =============================================
// User Anime Status
// =============================================

/**
 * Tracking status for user's anime list
 * Matches the CHECK constraint in user_anime table
 */
export type UserAnimeStatus =
    | "PLANNING"
    | "WATCHING"
    | "COMPLETED"
    | "PAUSED"
    | "DROPPED";

/**
 * Display labels for each status
 */
export const USER_ANIME_STATUS_LABELS: Record<UserAnimeStatus, string> = {
    PLANNING: "Plan to Watch",
    WATCHING: "Watching",
    COMPLETED: "Completed",
    PAUSED: "On Hold",
    DROPPED: "Dropped",
};

/**
 * Icon names for each status (Lucide icon names)
 * Used for consistent icon display across components
 */
export const USER_ANIME_STATUS_ICONS: Record<UserAnimeStatus, string> = {
    WATCHING: "Play",
    COMPLETED: "CheckCircle",
    PLANNING: "Clock",
    PAUSED: "Pause",
    DROPPED: "XCircle",
};

/**
 * Order for displaying status tabs
 */
export const USER_ANIME_STATUS_ORDER: UserAnimeStatus[] = [
    "WATCHING",
    "COMPLETED",
    "PLANNING",
    "PAUSED",
    "DROPPED",
];

// =============================================
// User Profile Types
// =============================================

/**
 * Public user profile data
 * Used for profile pages and public display
 */
export interface UserProfile {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string;
}

/**
 * User profile with stats
 * Includes counts for each status category
 */
export interface UserProfileWithStats extends UserProfile {
    stats: {
        watching: number;
        completed: number;
        planning: number;
        paused: number;
        dropped: number;
        totalAnime: number;
    };
}

/**
 * Database row type for users table
 */
export interface UserRow {
    id: string;
    username: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
    preferences: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

/**
 * Transforms a database row to the UserProfile domain type
 */
export function transformUserRow(row: UserRow): UserProfile {
    return {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
    };
}

// =============================================
// User Anime (Tracking) Types
// =============================================

/**
 * User's tracking entry for an anime
 * Represents a row in the user_anime table
 */
export interface UserAnime {
    id: string;
    userId: string;
    animeId: string;
    status: UserAnimeStatus;
    currentEpisode: number;
    rating: number | null;
    rewatchCount: number;
    lastRewatchAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    notes: string | null;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * User anime with full anime data
 * Used for displaying user's list with anime details
 */
export interface UserAnimeWithAnime extends UserAnime {
    anime: Anime;
}

/**
 * Database row type for user_anime table
 */
export interface UserAnimeRow {
    id: string;
    user_id: string;
    anime_id: string;
    status: UserAnimeStatus;
    current_episode: number;
    rating: number | null;
    rewatch_count: number;
    last_rewatch_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    notes: string | null;
    is_private: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Transforms a database row to the UserAnime domain type
 */
export function transformUserAnimeRow(row: UserAnimeRow): UserAnime {
    return {
        id: row.id,
        userId: row.user_id,
        animeId: row.anime_id,
        status: row.status,
        currentEpisode: row.current_episode,
        rating: row.rating,
        rewatchCount: row.rewatch_count,
        lastRewatchAt: row.last_rewatch_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        notes: row.notes,
        isPrivate: row.is_private,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// =============================================
// Input Types for Mutations
// =============================================

/**
 * Input for adding anime to user's list
 */
export interface AddToListInput {
    animeId: string;
    status: UserAnimeStatus;
    rating?: number;
    currentEpisode?: number;
    notes?: string;
}

/**
 * Input for updating anime tracking
 */
export interface UpdateTrackingInput {
    status?: UserAnimeStatus;
    currentEpisode?: number;
    rating?: number | null;
    notes?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
}

// =============================================
// User Statistics Types
// =============================================

/**
 * Yearly breakdown of anime by status
 * Used for progress bars showing activity per year
 */
export interface YearlyAnimeData {
    year: number;
    completed: number;
    watching: number;
    planned: number;
    paused: number;
    dropped: number;
}

/**
 * Genre count for distribution charts
 */
export interface GenreCount {
    name: string;
    count: number;
}

/**
 * Rating distribution bucket
 */
export interface RatingBucket {
    rating: number; // 1-10
    count: number;
}

/**
 * Format breakdown (TV, Movie, OVA, etc.)
 */
export interface FormatCount {
    format: string;
    count: number;
}

/**
 * Comprehensive user statistics for the dashboard
 * Focused on current year with historical data
 */
export interface UserStats {
    /** The year being focused on (typically current year) */
    currentYear: number;

    /** Total anime tracked this year */
    totalAnime: number;

    /** Total episodes watched (completed + in-progress) */
    totalEpisodes: number;

    /** Total watch time in minutes */
    watchTimeMinutes: number;

    /** Average rating given (null if no ratings) */
    averageRating: number | null;

    /** Breakdown by year for progress bars */
    yearlyData: YearlyAnimeData[];

    /** Top genres by anime count */
    topGenres: GenreCount[];

    /** Distribution of ratings given */
    ratingDistribution: RatingBucket[];

    /** Breakdown by anime format */
    formatBreakdown: FormatCount[];
}
