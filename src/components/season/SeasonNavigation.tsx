import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeSeason, createSeasonSlug } from "@/types/anime";
import {
    formatSeasonName,
    getPreviousSeason,
    getNextSeason,
} from "./season-utils";

/**
 * Props for SeasonNavigation component
 */
interface SeasonNavigationProps {
    /** Current season being viewed */
    currentSeason: AnimeSeason;
    /** Current year being viewed */
    currentYear: number;
}

/**
 * Season Navigation Component
 *
 * Displays links to navigate to the previous and next seasons.
 * Handles year transitions (Winter -> Fall of previous year, etc.)
 * and respects min/max year boundaries.
 *
 * @param currentSeason - The season currently being viewed
 * @param currentYear - The year currently being viewed
 */
export function SeasonNavigation({
    currentSeason,
    currentYear,
}: SeasonNavigationProps) {
    const previous = getPreviousSeason(currentSeason, currentYear);
    const next = getNextSeason(currentSeason, currentYear);

    // Don&apos;t render if no navigation available
    if (!previous && !next) {
        return null;
    }

    return (
        <nav
            className="flex items-center justify-between gap-4 pt-8"
            aria-label="Season navigation"
        >
            {/* Previous Season Link */}
            {previous ? (
                <Link
                    href={`/season/${createSeasonSlug(
                        previous.season,
                        previous.year
                    )}`}
                    className="hover:cursor-pointer group flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    <div className="flex flex-col items-start">
                        <span className="text-xs text-muted-foreground/70">
                            Previous
                        </span>
                        <span>
                            {formatSeasonName(previous.season)} {previous.year}
                        </span>
                    </div>
                </Link>
            ) : (
                <div /> // Spacer for alignment
            )}

            {/* Next Season Link */}
            {next ? (
                <Link
                    href={`/season/${createSeasonSlug(next.season, next.year)}`}
                    className="hover:cursor-pointer group flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground/70">
                            Next
                        </span>
                        <span>
                            {formatSeasonName(next.season)} {next.year}
                        </span>
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            ) : (
                <div /> // Spacer for alignment
            )}
        </nav>
    );
}

