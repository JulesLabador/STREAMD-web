/**
 * Kitsu API Type Definitions
 *
 * Types for the Kitsu.io JSON:API responses.
 * Based on the Kitsu API documentation: https://kitsu.docs.apiary.io/
 */

// ============================================================================
// JSON:API Base Types
// ============================================================================

/**
 * JSON:API resource identifier
 */
export interface ResourceIdentifier {
    id: string;
    type: string;
}

/**
 * JSON:API relationship data
 */
export interface RelationshipData {
    data: ResourceIdentifier | ResourceIdentifier[] | null;
    links?: {
        self?: string;
        related?: string;
    };
}

/**
 * JSON:API links object
 */
export interface PaginationLinks {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
}

// ============================================================================
// Kitsu Anime Types
// ============================================================================

/**
 * Image dimensions metadata from Kitsu
 */
export interface KitsuImageDimensions {
    tiny?: { width: number; height: number };
    small?: { width: number; height: number };
    medium?: { width: number; height: number };
    large?: { width: number; height: number };
    original?: { width: number; height: number };
}

/**
 * Kitsu image object (poster or cover)
 */
export interface KitsuImage {
    tiny?: string;
    small?: string;
    medium?: string;
    large?: string;
    original?: string;
    meta?: {
        dimensions?: KitsuImageDimensions;
    };
}

/**
 * Kitsu titles object
 */
export interface KitsuTitles {
    en?: string;
    en_jp?: string;
    ja_jp?: string;
    en_us?: string;
    [key: string]: string | undefined;
}

/**
 * Kitsu anime status values
 */
export type KitsuAnimeStatus =
    | "current"
    | "finished"
    | "tba"
    | "unreleased"
    | "upcoming";

/**
 * Kitsu anime subtype (format)
 */
export type KitsuAnimeSubtype =
    | "ONA"
    | "OVA"
    | "TV"
    | "movie"
    | "music"
    | "special";

/**
 * Kitsu anime attributes
 */
export interface KitsuAnimeAttributes {
    createdAt: string;
    updatedAt: string;
    slug: string;
    synopsis: string | null;
    description: string | null;
    coverImageTopOffset: number;
    titles: KitsuTitles;
    canonicalTitle: string;
    abbreviatedTitles: string[];
    averageRating: string | null; // Kitsu returns rating as string (e.g., "84.52")
    ratingFrequencies: Record<string, string>;
    userCount: number;
    favoritesCount: number;
    startDate: string | null; // ISO date string (YYYY-MM-DD)
    endDate: string | null;
    nextRelease: string | null;
    popularityRank: number | null;
    ratingRank: number | null;
    ageRating: string | null;
    ageRatingGuide: string | null;
    subtype: KitsuAnimeSubtype;
    status: KitsuAnimeStatus;
    tba: string | null;
    posterImage: KitsuImage | null;
    coverImage: KitsuImage | null;
    episodeCount: number | null;
    episodeLength: number | null; // in minutes
    totalLength: number | null;
    youtubeVideoId: string | null;
    showType: string;
    nsfw: boolean;
}

/**
 * Kitsu anime relationships
 */
export interface KitsuAnimeRelationships {
    genres: RelationshipData;
    categories: RelationshipData;
    castings: RelationshipData;
    installments: RelationshipData;
    mappings: RelationshipData;
    reviews: RelationshipData;
    mediaRelationships: RelationshipData;
    characters: RelationshipData;
    staff: RelationshipData;
    productions: RelationshipData;
    quotes: RelationshipData;
    episodes: RelationshipData;
    streamingLinks: RelationshipData;
    animeProductions: RelationshipData;
    animeCharacters: RelationshipData;
    animeStaff: RelationshipData;
}

/**
 * Kitsu anime resource
 */
export interface KitsuAnime {
    id: string;
    type: "anime";
    links: {
        self: string;
    };
    attributes: KitsuAnimeAttributes;
    relationships: KitsuAnimeRelationships;
}

// ============================================================================
// Kitsu Genre Types
// ============================================================================

/**
 * Kitsu genre attributes
 */
export interface KitsuGenreAttributes {
    createdAt: string;
    updatedAt: string;
    name: string;
    slug: string;
    description: string | null;
}

/**
 * Kitsu genre resource
 */
export interface KitsuGenre {
    id: string;
    type: "genres";
    links: {
        self: string;
    };
    attributes: KitsuGenreAttributes;
}

// ============================================================================
// Kitsu Category Types
// ============================================================================

/**
 * Kitsu category attributes
 */
export interface KitsuCategoryAttributes {
    createdAt: string;
    updatedAt: string;
    title: string;
    description: string | null;
    totalMediaCount: number;
    slug: string;
    nsfw: boolean;
    childCount: number;
}

/**
 * Kitsu category resource
 */
export interface KitsuCategory {
    id: string;
    type: "categories";
    links: {
        self: string;
    };
    attributes: KitsuCategoryAttributes;
}

// ============================================================================
// Kitsu Producer/Studio Types
// ============================================================================

/**
 * Kitsu producer attributes
 */
export interface KitsuProducerAttributes {
    createdAt: string;
    updatedAt: string;
    slug: string;
    name: string;
}

/**
 * Kitsu producer resource
 */
export interface KitsuProducer {
    id: string;
    type: "producers";
    links: {
        self: string;
    };
    attributes: KitsuProducerAttributes;
}

/**
 * Kitsu anime production attributes (junction between anime and producer)
 */
export interface KitsuAnimeProductionAttributes {
    role: string; // e.g., "producer", "licensor", "studio"
}

/**
 * Kitsu anime production resource
 */
export interface KitsuAnimeProduction {
    id: string;
    type: "animeProductions";
    attributes: KitsuAnimeProductionAttributes;
    relationships: {
        anime: RelationshipData;
        producer: RelationshipData;
    };
}

// ============================================================================
// Kitsu Streaming Link Types
// ============================================================================

/**
 * Kitsu streamer attributes
 */
export interface KitsuStreamerAttributes {
    createdAt: string;
    updatedAt: string;
    siteName: string;
}

/**
 * Kitsu streamer resource
 */
export interface KitsuStreamer {
    id: string;
    type: "streamers";
    attributes: KitsuStreamerAttributes;
}

/**
 * Kitsu streaming link attributes
 */
export interface KitsuStreamingLinkAttributes {
    createdAt: string;
    updatedAt: string;
    url: string;
    subs: string[];
    dubs: string[];
}

/**
 * Kitsu streaming link resource
 */
export interface KitsuStreamingLink {
    id: string;
    type: "streamingLinks";
    attributes: KitsuStreamingLinkAttributes;
    relationships: {
        streamer: RelationshipData;
        media: RelationshipData;
    };
}

// ============================================================================
// Kitsu Mapping Types (for external IDs like MAL, AniList)
// ============================================================================

/**
 * Kitsu mapping attributes
 */
export interface KitsuMappingAttributes {
    createdAt: string;
    updatedAt: string;
    externalSite: string; // e.g., "myanimelist/anime", "anilist/anime"
    externalId: string;
}

/**
 * Kitsu mapping resource
 */
export interface KitsuMapping {
    id: string;
    type: "mappings";
    attributes: KitsuMappingAttributes;
}

// ============================================================================
// Kitsu API Response Types
// ============================================================================

/**
 * Included resource types that can be returned with anime
 */
export type KitsuIncludedResource =
    | KitsuGenre
    | KitsuCategory
    | KitsuProducer
    | KitsuAnimeProduction
    | KitsuStreamingLink
    | KitsuStreamer
    | KitsuMapping;

/**
 * Kitsu API response for anime list
 */
export interface KitsuAnimeListResponse {
    data: KitsuAnime[];
    included?: KitsuIncludedResource[];
    meta: {
        count: number;
    };
    links: PaginationLinks;
}

/**
 * Kitsu API response for single anime
 */
export interface KitsuAnimeResponse {
    data: KitsuAnime;
    included?: KitsuIncludedResource[];
}

/**
 * Kitsu API error response
 */
export interface KitsuErrorResponse {
    errors: Array<{
        title: string;
        detail: string;
        code: string;
        status: string;
    }>;
}

// ============================================================================
// Season Types
// ============================================================================

/**
 * Anime season values
 */
export type Season = "winter" | "spring" | "summer" | "fall";

/**
 * Season filter parameters for Kitsu API
 */
export interface SeasonFilter {
    season: Season;
    year: number;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cached response record from database
 */
export interface CachedResponse {
    id: string;
    cache_key: string;
    response: KitsuAnimeListResponse;
    created_at: string;
    expires_at: string;
}

/**
 * Cache key components
 */
export interface CacheKeyParams {
    season: Season;
    year: number;
    page: number;
}
