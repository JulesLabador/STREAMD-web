import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAnimeBySeason } from '@/app/actions/anime';
import { parseSeasonSlug } from '@/types/anime';
import { BrowsePageHeader } from '@/components/browse';
import { AnimeGrid } from '@/components/anime/AnimeGrid';

/**
 * Page props with dynamic slug parameter
 */
interface SeasonPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Formats season name for display
 * @param season - Season enum value
 * @returns Formatted season name
 */
function formatSeasonName(season: string): string {
  return season.charAt(0) + season.slice(1).toLowerCase();
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
  params,
}: SeasonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSeasonSlug(slug);

  if (!parsed) {
    return {
      title: 'Season Not Found | STREAMD',
    };
  }

  const result = await getAnimeBySeason(parsed.season, parsed.year);

  if (!result.success) {
    return {
      title: 'Season Not Found | STREAMD',
    };
  }

  const { seasonInfo } = result.data;
  const seasonName = `${formatSeasonName(seasonInfo.season)} ${seasonInfo.year}`;

  return {
    title: `${seasonName} Anime | STREAMD`,
    description: `Browse ${seasonInfo.animeCount} anime from ${seasonName}. Discover what aired during this season and track your favorites.`,
    openGraph: {
      title: `${seasonName} Anime | STREAMD`,
      description: `Browse ${seasonInfo.animeCount} anime from ${seasonName}. Discover what aired during this season and track your favorites.`,
      type: 'website',
    },
  };
}

/**
 * Season detail page
 *
 * Displays anime from a specific season/year in a grid layout.
 * Server Component with SEO optimization.
 */
export default async function SeasonPage({ params }: SeasonPageProps) {
  const { slug } = await params;
  const parsed = parseSeasonSlug(slug);

  // Invalid slug format
  if (!parsed) {
    notFound();
  }

  const result = await getAnimeBySeason(parsed.season, parsed.year);

  // Handle errors
  if (!result.success) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="mt-2 text-muted-foreground">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { seasonInfo, anime } = result.data;
  const seasonName = `${formatSeasonName(seasonInfo.season)} ${seasonInfo.year}`;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BrowsePageHeader
        title={seasonName}
        description={`Anime that aired in ${seasonName}`}
        count={anime.pagination.totalCount}
        backHref="/season"
        backText="All Seasons"
      />

      <AnimeGrid
        anime={anime.data}
        emptyMessage={`No anime found for ${seasonName}`}
      />

      {/* Pagination info */}
      {anime.pagination.totalCount > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {anime.data.length} of {anime.pagination.totalCount} anime
        </div>
      )}
    </div>
  );
}

