import type { Anime } from '@/types/anime';
import { AnimeCard } from './AnimeCard';

/**
 * Props for the AnimeGrid component
 */
interface AnimeGridProps {
  anime: Anime[];
  /** Optional empty state message */
  emptyMessage?: string;
}

/**
 * AnimeGrid component
 *
 * Displays a responsive grid of anime cards.
 * Grid columns adjust based on viewport:
 * - Mobile: 2 columns
 * - Tablet: 3-4 columns
 * - Desktop: 5-6 columns
 *
 * Includes an empty state when no anime are provided.
 */
export function AnimeGrid({ anime, emptyMessage = 'No anime found' }: AnimeGridProps) {
  // Empty state
  if (!anime || anime.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {anime.map((item) => (
        <AnimeCard key={item.id} anime={item} />
      ))}
    </div>
  );
}

