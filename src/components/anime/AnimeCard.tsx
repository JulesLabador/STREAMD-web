import Link from 'next/link';
import Image from 'next/image';
import type { Anime } from '@/types/anime';
import { Badge } from '@/components/ui/badge';

/**
 * Props for the AnimeCard component
 */
interface AnimeCardProps {
  anime: Anime;
}

/**
 * Formats the anime status for display
 * Converts database enum to user-friendly text
 */
function formatStatus(status: Anime['status']): string {
  const statusMap: Record<Anime['status'], string> = {
    FINISHED: 'Finished',
    RELEASING: 'Airing',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
    HIATUS: 'On Hiatus',
  };
  return statusMap[status] || status;
}

/**
 * Gets the badge variant for anime status
 */
function getStatusVariant(
  status: Anime['status']
): 'watching' | 'completed' | 'planned' | 'onHold' | 'secondary' {
  switch (status) {
    case 'RELEASING':
      return 'watching';
    case 'FINISHED':
      return 'completed';
    case 'NOT_YET_RELEASED':
      return 'planned';
    case 'HIATUS':
      return 'onHold';
    default:
      return 'secondary';
  }
}

/**
 * AnimeCard component
 *
 * Displays an anime in a card format with:
 * - Cover image with aspect ratio
 * - Title (English preferred, fallback to Romaji)
 * - Format badge (TV, Movie, etc.)
 * - Status indicator
 * - Episode count
 *
 * Links to the anime detail page via slug
 */
export function AnimeCard({ anime }: AnimeCardProps) {
  // Prefer English title, fallback to Romaji
  const displayTitle = anime.titles.english || anime.titles.romaji;

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="group block overflow-hidden rounded-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Cover image container with 3:4 aspect ratio */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {anime.coverImageUrl ? (
          <Image
            src={anime.coverImageUrl}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-opacity group-hover:opacity-90"
          />
        ) : (
          // Placeholder when no image
          <div className="flex h-full items-center justify-center bg-secondary">
            <span className="text-4xl text-muted-foreground">🎬</span>
          </div>
        )}

        {/* Status badge overlay */}
        {anime.status === 'RELEASING' && (
          <div className="absolute left-2 top-2">
            <Badge variant={getStatusVariant(anime.status)} className="text-xs">
              {formatStatus(anime.status)}
            </Badge>
          </div>
        )}

        {/* Rating overlay (if available) */}
        {anime.averageRating !== null && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
            <span className="text-yellow-400">★</span>
            <span>{anime.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="mt-3 space-y-1">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
          {displayTitle}
        </h3>

        {/* Metadata row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Format */}
          <span>{anime.format}</span>

          {/* Separator */}
          {anime.episodeCount && (
            <>
              <span className="text-border">•</span>
              <span>
                {anime.episodeCount} {anime.episodeCount === 1 ? 'ep' : 'eps'}
              </span>
            </>
          )}

          {/* Year */}
          {anime.seasonYear && (
            <>
              <span className="text-border">•</span>
              <span>{anime.seasonYear}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

