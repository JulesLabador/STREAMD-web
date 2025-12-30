import { algoliasearch } from "algoliasearch";

/**
 * Algolia client for search operations
 *
 * Uses the Search-Only API key for safe client-side usage.
 * Configure via environment variables:
 * - NEXT_PUBLIC_ALGOLIA_APP_ID: Your Algolia Application ID
 * - NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: Search-Only API Key (safe for client)
 */
export const algoliaClient = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);

/**
 * Algolia admin client for indexing operations
 *
 * Uses the Admin API key - ONLY use server-side for indexing.
 * Configure via environment variables:
 * - NEXT_PUBLIC_ALGOLIA_APP_ID: Your Algolia Application ID
 * - ALGOLIA_ADMIN_KEY: Admin API Key (keep secret, server-side only)
 */
export function getAlgoliaAdminClient() {
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;
    if (!adminKey) {
        throw new Error("ALGOLIA_ADMIN_KEY environment variable is not set");
    }
    return algoliasearch(
        process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
        adminKey
    );
}

/**
 * Anime search index name
 * Used for indexing and searching anime documents
 */
export const ANIME_INDEX = "anime";

/**
 * Document structure for Algolia anime index
 *
 * Contains only the fields needed for search and display in results.
 * Full anime data is fetched from the database when viewing details.
 *
 * Note: Algolia requires an `objectID` field for document identification.
 */
export interface AnimeSearchDocument {
    /** Algolia object ID - uses the anime UUID */
    objectID: string;
    /** Short ID for URL construction (8-char alphanumeric) */
    shortId: string | null;
    /** URL-friendly slug for navigation */
    slug: string;
    /** Anime titles in multiple languages */
    titles: {
        english: string | null;
        romaji: string;
        japanese: string | null;
    };
    /** Format type (TV, MOVIE, OVA, etc.) */
    format: "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL" | "MUSIC";
    /** Airing status */
    status:
        | "FINISHED"
        | "RELEASING"
        | "NOT_YET_RELEASED"
        | "CANCELLED"
        | "HIATUS";
    /** Release season (WINTER, SPRING, SUMMER, FALL) */
    season: string | null;
    /** Release year */
    seasonYear: number | null;
    /** Popularity rank (lower = more popular) */
    popularity: number;
    /** Average user rating (0-10) */
    averageRating: number | null;
    /** Cover image URL for search results */
    coverImageUrl: string | null;
    /** Episode count */
    episodeCount: number | null;
}
