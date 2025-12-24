import type { AnimeWithRelations } from '@/types/anime';

/**
 * Props for the AnimeJsonLd component
 */
interface AnimeJsonLdProps {
  anime: AnimeWithRelations;
  url: string;
}

/**
 * Generates JSON-LD structured data for an anime
 *
 * Uses TVSeries schema for TV anime and Movie schema for movies.
 * Includes rating, episode count, studio, and other metadata.
 */
export function AnimeJsonLd({ anime, url }: AnimeJsonLdProps) {
  const displayTitle = anime.titles.english || anime.titles.romaji;
  const isMovie = anime.format === 'MOVIE';

  // Build the JSON-LD object based on format
  const jsonLd = isMovie
    ? buildMovieSchema(anime, displayTitle, url)
    : buildTVSeriesSchema(anime, displayTitle, url);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Builds TVSeries schema for TV anime
 */
function buildTVSeriesSchema(
  anime: AnimeWithRelations,
  displayTitle: string,
  url: string
) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: displayTitle,
    url: url,
  };

  // Alternative names
  const alternateNames: string[] = [];
  if (anime.titles.english && anime.titles.romaji !== anime.titles.english) {
    alternateNames.push(anime.titles.romaji);
  }
  if (anime.titles.japanese) {
    alternateNames.push(anime.titles.japanese);
  }
  if (alternateNames.length > 0) {
    schema.alternateName = alternateNames;
  }

  // Description
  if (anime.synopsis) {
    schema.description = anime.synopsis;
  }

  // Image
  if (anime.coverImageUrl) {
    schema.image = anime.coverImageUrl;
  }

  // Episode count
  if (anime.episodeCount) {
    schema.numberOfEpisodes = anime.episodeCount;
  }

  // Date published (start date)
  if (anime.startDate) {
    schema.datePublished = anime.startDate;
  }

  // Production company (studios)
  if (anime.studios.length > 0) {
    schema.productionCompany = anime.studios.map((studio) => ({
      '@type': 'Organization',
      name: studio.name,
      url: `${url.split('/anime/')[0]}/studio/${studio.slug}`,
    }));
  }

  // Aggregate rating
  if (anime.averageRating !== null) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: anime.averageRating,
      bestRating: 10,
      worstRating: 0,
    };
  }

  // Genre (if available)
  if (anime.genres.length > 0) {
    schema.genre = anime.genres.map((g) => g.name);
  }

  // Content rating based on format
  schema.contentRating = 'TV-14';

  // Country of origin
  schema.countryOfOrigin = {
    '@type': 'Country',
    name: 'Japan',
  };

  return schema;
}

/**
 * Builds Movie schema for anime movies
 */
function buildMovieSchema(
  anime: AnimeWithRelations,
  displayTitle: string,
  url: string
) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: displayTitle,
    url: url,
  };

  // Alternative names
  const alternateNames: string[] = [];
  if (anime.titles.english && anime.titles.romaji !== anime.titles.english) {
    alternateNames.push(anime.titles.romaji);
  }
  if (anime.titles.japanese) {
    alternateNames.push(anime.titles.japanese);
  }
  if (alternateNames.length > 0) {
    schema.alternateName = alternateNames;
  }

  // Description
  if (anime.synopsis) {
    schema.description = anime.synopsis;
  }

  // Image
  if (anime.coverImageUrl) {
    schema.image = anime.coverImageUrl;
  }

  // Duration in ISO 8601 format
  if (anime.episodeDuration) {
    schema.duration = `PT${anime.episodeDuration}M`;
  }

  // Date published (start date)
  if (anime.startDate) {
    schema.datePublished = anime.startDate;
  }

  // Production company (studios)
  if (anime.studios.length > 0) {
    schema.productionCompany = anime.studios.map((studio) => ({
      '@type': 'Organization',
      name: studio.name,
      url: `${url.split('/anime/')[0]}/studio/${studio.slug}`,
    }));
  }

  // Aggregate rating
  if (anime.averageRating !== null) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: anime.averageRating,
      bestRating: 10,
      worstRating: 0,
    };
  }

  // Genre (if available)
  if (anime.genres.length > 0) {
    schema.genre = anime.genres.map((g) => g.name);
  }

  // Country of origin
  schema.countryOfOrigin = {
    '@type': 'Country',
    name: 'Japan',
  };

  return schema;
}

