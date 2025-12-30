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
 * SearchResultItem - Single search result row
 *
 * Displays:
 * - Title (English preferred, fallback to Romaji)
 * - Format, year, episode count
 * - Rating
 *
 * Highlights when selected via keyboard navigation.
 * Uses <a> tag instead of <button> to avoid browser default text-align: center.
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

    // Use shortId if available, otherwise fall back to slug-only URL
    const animeUrl = anime.shortId
        ? `/anime/${anime.shortId}/${anime.slug}`
        : `/anime/${anime.slug}`;

    return (
        <a
            href={animeUrl}
            onClick={(e) => {
                e.preventDefault();
                onSelect(anime);
            }}
            className={cn(
                "w-full h-20 flex flex-col items-start gap-0.5 px-4 py-2 rounded-md overflow-hidden justify-center",
                "transition-colors duration-100",
                "hover:bg-accent hover:cursor-pointer",
                isSelected && "bg-accent"
            )}
        >
            {/* First line: Title */}
            <p className="w-full text-sm font-medium text-foreground truncate">
                {displayTitle}
            </p>

            {/* Second line: Metadata and rating */}
            <div className="w-full flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{metadata.join(" • ")}</span>
                {anime.averageRating !== null && (
                    <span className="shrink-0 flex items-center gap-0.5">
                        <span className="text-yellow-400">★</span>
                        <span>{anime.averageRating.toFixed(1)}</span>
                    </span>
                )}
            </div>
        </a>
    );
}
