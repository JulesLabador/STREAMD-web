import type { ReactNode } from "react";
import type { Anime } from "@/types/anime";
import { AnimeCard } from "./AnimeCard";

/**
 * Props for the AnimeGrid component
 */
interface AnimeGridProps {
    /** Array of anime to display */
    anime: Anime[];
    /** Optional empty state message */
    emptyMessage?: string;
    /** Optional content to render above the grid (e.g., filters) */
    header?: ReactNode;
    /** Optional className for the grid container */
    className?: string;
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
 * Optionally renders header content (like filters) above the grid.
 */
export function AnimeGrid({
    anime,
    emptyMessage = "No anime found",
    header,
    className,
}: AnimeGridProps) {
    // Empty state
    if (!anime || anime.length === 0) {
        return (
            <div className={className}>
                {header && <div className="mb-6">{header}</div>}
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
                    <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {header && <div className="mb-6">{header}</div>}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {anime.map((item) => (
                    <AnimeCard key={item.id} anime={item} />
                ))}
            </div>
        </div>
    );
}
