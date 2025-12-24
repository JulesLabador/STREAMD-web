/**
 * Anime domain types
 * Based on the database schema defined in the technical specification
 */

/**
 * Anime format types (TV series, movies, etc.)
 */
export type AnimeFormat = 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC';

/**
 * Anime airing status
 */
export type AnimeStatus =
  | 'FINISHED'
  | 'RELEASING'
  | 'NOT_YET_RELEASED'
  | 'CANCELLED'
  | 'HIATUS';

/**
 * Anime season (quarterly release periods)
 */
export type AnimeSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

/**
 * Streaming platform identifiers
 */
export type StreamingPlatform =
  | 'CRUNCHYROLL'
  | 'FUNIMATION'
  | 'NETFLIX'
  | 'HULU'
  | 'AMAZON'
  | 'HIDIVE'
  | 'OTHER';

/**
 * Anime titles in multiple languages
 * Stored as JSONB in the database
 */
export interface AnimeTitles {
  english: string | null;
  romaji: string;
  japanese: string | null;
}

/**
 * Core anime entity
 * Represents the main anime record from the database
 */
export interface Anime {
  id: string;
  slug: string;
  titles: AnimeTitles;
  format: AnimeFormat;
  episodeCount: number | null;
  episodeDuration: number | null;
  season: AnimeSeason | null;
  seasonYear: number | null;
  startDate: string | null;
  endDate: string | null;
  synopsis: string | null;
  averageRating: number | null;
  popularity: number;
  status: AnimeStatus;
  malId: number | null;
  anilistId: number | null;
  kitsuId: string | null;
  coverImageUrl: string | null;
  bannerImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Genre entity
 */
export interface Genre {
  id: string;
  name: string;
  slug: string;
}

/**
 * Studio entity
 */
export interface Studio {
  id: string;
  name: string;
  slug: string;
}

/**
 * Streaming link entity
 */
export interface StreamingLink {
  id: string;
  animeId: string;
  platform: StreamingPlatform;
  url: string;
  region: string;
}

/**
 * Anime with related data (genres, studios, streaming links)
 * Used for detail pages where full information is needed
 */
export interface AnimeWithRelations extends Anime {
  genres: Genre[];
  studios: Studio[];
  streamingLinks: StreamingLink[];
}

/**
 * Database row type for anime table
 * Matches the snake_case column names from PostgreSQL
 */
export interface AnimeRow {
  id: string;
  slug: string;
  titles: AnimeTitles;
  format: AnimeFormat;
  episode_count: number | null;
  episode_duration: number | null;
  season: AnimeSeason | null;
  season_year: number | null;
  start_date: string | null;
  end_date: string | null;
  synopsis: string | null;
  average_rating: number | null;
  popularity: number;
  status: AnimeStatus;
  id_mal: number | null;
  id_anilist: number | null;
  id_kitsu: string | null;
  cover_image_url: string | null;
  banner_image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Transforms a database row to the Anime domain type
 * Converts snake_case to camelCase
 */
export function transformAnimeRow(row: AnimeRow): Anime {
  return {
    id: row.id,
    slug: row.slug,
    titles: row.titles,
    format: row.format,
    episodeCount: row.episode_count,
    episodeDuration: row.episode_duration,
    season: row.season,
    seasonYear: row.season_year,
    startDate: row.start_date,
    endDate: row.end_date,
    synopsis: row.synopsis,
    averageRating: row.average_rating,
    popularity: row.popularity,
    status: row.status,
    malId: row.id_mal,
    anilistId: row.id_anilist,
    kitsuId: row.id_kitsu,
    coverImageUrl: row.cover_image_url,
    bannerImageUrl: row.banner_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================
// Browse Page Types
// =============================================

/**
 * Studio with anime count for browse pages
 */
export interface StudioWithCount extends Studio {
  animeCount: number;
}

/**
 * Genre with anime count for browse pages
 */
export interface GenreWithCount extends Genre {
  animeCount: number;
}

/**
 * Season information for browse pages
 * Represents a specific season/year combination
 */
export interface SeasonInfo {
  season: AnimeSeason;
  year: number;
  slug: string;
  animeCount: number;
}

/**
 * Platform information for browse pages
 * Represents a streaming platform with anime count
 */
export interface PlatformInfo {
  platform: StreamingPlatform;
  slug: string;
  name: string;
  animeCount: number;
}

/**
 * Creates a slug from season and year
 * @param season - The anime season
 * @param year - The year
 * @returns Slug in format "winter-2024"
 */
export function createSeasonSlug(season: AnimeSeason, year: number): string {
  return `${season.toLowerCase()}-${year}`;
}

/**
 * Parses a season slug into season and year
 * @param slug - Slug in format "winter-2024"
 * @returns Object with season and year, or null if invalid
 */
export function parseSeasonSlug(slug: string): { season: AnimeSeason; year: number } | null {
  const match = slug.match(/^(winter|spring|summer|fall)-(\d{4})$/i);
  if (!match) return null;

  const season = match[1].toUpperCase() as AnimeSeason;
  const year = parseInt(match[2], 10);

  return { season, year };
}

/**
 * Creates a slug from platform name
 * @param platform - The streaming platform
 * @returns Lowercase slug
 */
export function createPlatformSlug(platform: StreamingPlatform): string {
  return platform.toLowerCase();
}

/**
 * Parses a platform slug into StreamingPlatform
 * @param slug - Lowercase platform slug
 * @returns StreamingPlatform or null if invalid
 */
export function parsePlatformSlug(slug: string): StreamingPlatform | null {
  const platform = slug.toUpperCase() as StreamingPlatform;
  const validPlatforms: StreamingPlatform[] = [
    'CRUNCHYROLL',
    'FUNIMATION',
    'NETFLIX',
    'HULU',
    'AMAZON',
    'HIDIVE',
    'OTHER',
  ];

  return validPlatforms.includes(platform) ? platform : null;
}

