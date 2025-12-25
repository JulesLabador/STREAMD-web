"use client";

import { useSearchContext } from "./SearchProvider";
import { cn } from "@/lib/utils";
import type { Anime } from "@/types/anime";

/**
 * Props for SearchResultItem
 */
interface SearchResultItemProps {
    /** The anime to display */
    anime: Anime;
    /** Index of this item in the results list */
    index: number;
}

/**
 * Formats the anime status for display
 */
function formatStatus(status: Anime["status"]): string {
    const statusMap: Record<Anime["status"], string> = {
        FINISHED: "Finished",
        RELEASING: "Airing",
        NOT_YET_RELEASED: "Upcoming",
        CANCELLED: "Cancelled",
        HIATUS: "On Hiatus",
    };
    return statusMap[status] || status;
}

/**
 * SearchResultItem - Single search result row
 *
 * Displays:
 * - Cover image thumbnail
 * - Title (English preferred, fallback to Romaji)
 * - Format, year, episode count
 * - Rating
 *
 * Highlights when selected via keyboard navigation.
 */
export function SearchResultItem({ anime, index }: SearchResultItemProps) {
    const { selectedIndex, onSelect } = useSearchContext();
    const isSelected = selectedIndex === index;

    // Prefer English title, fallback to Romaji
    const displayTitle = anime.titles.english || anime.titles.romaji;

    // Build metadata string
    const metadata: string[] = [anime.format];
    if (anime.seasonYear) {
        metadata.push(String(anime.seasonYear));
    }
    if (anime.episodeCount) {
        metadata.push(`${anime.episodeCount} eps`);
    }

    return (
        <button
            type="button"
            onClick={() => onSelect(anime)}
            className={cn(
                "w-full h-12 flex items-center justify-start gap-3 px-3 py-2 rounded-md text-left",
                "transition-colors duration-100",
                "hover:bg-accent hover:cursor-pointer",
                isSelected && "bg-accent"
            )}
        >
            {/* Title (larger, medium weight) */}
            <p className="text-base font-medium text-foreground truncate max-w-[50%]">
                {displayTitle}
            </p>

            {/* Metadata (type, year, episodes) */}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
                {metadata.join(" • ")}
            </span>

            {/* Rating */}
            {anime.averageRating !== null && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span className="text-yellow-400">★</span>
                    <span>{anime.averageRating.toFixed(1)}</span>
                </div>
            )}
        </button>
    );
}
