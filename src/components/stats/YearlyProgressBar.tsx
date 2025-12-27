"use client";

import { cn } from "@/lib/utils";
import type { YearlyAnimeData } from "@/types/user";

/**
 * Props for the YearlyProgressBar component
 */
interface YearlyProgressBarProps {
    /** Yearly anime data with status counts */
    data: YearlyAnimeData;
    /** Whether this is the current/featured year (larger display) */
    featured?: boolean;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * YearlyProgressBar component
 *
 * Displays a stacked horizontal progress bar showing anime by status
 * relative to the total anime released for that year:
 * - Green: Completed
 * - Blue: Watching
 * - Gray: Planned
 * - Yellow: Paused (optional, shown in legend)
 * - Red: Dropped (optional, shown in legend)
 * - Remaining space: Not tracked (muted background)
 */
export function YearlyProgressBar({
    data,
    featured = false,
    className,
}: YearlyProgressBarProps) {
    // Calculate user's tracked anime count
    const userTracked =
        data.completed + data.watching + data.planned + data.paused + data.dropped;

    // Use totalAnimeForYear as the base for percentage calculations
    // Fall back to userTracked if totalAnimeForYear is 0 or not available
    const totalBase = data.totalAnimeForYear > 0 ? data.totalAnimeForYear : userTracked;

    if (userTracked === 0) {
        return (
            <div className={cn("space-y-2", className)}>
                {!featured && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{data.year}</span>
                        <span className="text-muted-foreground">No anime tracked</span>
                    </div>
                )}
                <div className="h-3 w-full rounded-full bg-muted" />
            </div>
        );
    }

    // Calculate percentages relative to total anime for the year
    const completedPct = (data.completed / totalBase) * 100;
    const watchingPct = (data.watching / totalBase) * 100;
    const plannedPct = (data.planned / totalBase) * 100;
    const pausedPct = (data.paused / totalBase) * 100;
    const droppedPct = (data.dropped / totalBase) * 100;

    // Calculate the percentage of all tracked anime relative to total
    const trackedPct = Math.round((userTracked / totalBase) * 100);

    return (
        <div className={cn("space-y-3", className)}>
            {/* Year label (only for non-featured) */}
            {!featured && (
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{data.year}</span>
                    <span className="text-muted-foreground">
                        {userTracked} / {data.totalAnimeForYear > 0 ? data.totalAnimeForYear : userTracked} anime ({trackedPct}%)
                    </span>
                </div>
            )}

            {/* Featured year header */}
            {featured && data.totalAnimeForYear > 0 && (
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                        Tracking <span className="font-medium text-foreground">{userTracked}</span> of{" "}
                        <span className="font-medium text-foreground">{data.totalAnimeForYear}</span> anime released ({trackedPct}%)
                    </span>
                </div>
            )}

            {/* Progress bar - shows tracked anime relative to total released */}
            <div
                className={cn(
                    "flex w-full overflow-hidden rounded-full bg-muted",
                    featured ? "h-6" : "h-3"
                )}
            >
                {/* Completed - Green */}
                {completedPct > 0 && (
                    <div
                        className="bg-green-500 transition-all duration-300"
                        style={{ width: `${completedPct}%` }}
                        title={`Completed: ${data.completed}`}
                    />
                )}

                {/* Watching - Blue */}
                {watchingPct > 0 && (
                    <div
                        className="bg-blue-500 transition-all duration-300"
                        style={{ width: `${watchingPct}%` }}
                        title={`Watching: ${data.watching}`}
                    />
                )}

                {/* Planned - Gray */}
                {plannedPct > 0 && (
                    <div
                        className="bg-zinc-400 transition-all duration-300"
                        style={{ width: `${plannedPct}%` }}
                        title={`Planned: ${data.planned}`}
                    />
                )}

                {/* Paused - Yellow */}
                {pausedPct > 0 && (
                    <div
                        className="bg-yellow-500 transition-all duration-300"
                        style={{ width: `${pausedPct}%` }}
                        title={`Paused: ${data.paused}`}
                    />
                )}

                {/* Dropped - Red */}
                {droppedPct > 0 && (
                    <div
                        className="bg-red-500 transition-all duration-300"
                        style={{ width: `${droppedPct}%` }}
                        title={`Dropped: ${data.dropped}`}
                    />
                )}

                {/* Remaining space shows as muted background (already set on parent) */}
            </div>

            {/* Legend */}
            <div
                className={cn(
                    "flex flex-wrap gap-x-4 gap-y-1",
                    featured ? "text-sm" : "text-xs"
                )}
            >
                {data.completed > 0 && (
                    <LegendItem color="bg-green-500" label="Completed" count={data.completed} />
                )}
                {data.watching > 0 && (
                    <LegendItem color="bg-blue-500" label="Watching" count={data.watching} />
                )}
                {data.planned > 0 && (
                    <LegendItem color="bg-zinc-400" label="Planned" count={data.planned} />
                )}
                {data.paused > 0 && (
                    <LegendItem color="bg-yellow-500" label="On Hold" count={data.paused} />
                )}
                {data.dropped > 0 && (
                    <LegendItem color="bg-red-500" label="Dropped" count={data.dropped} />
                )}
            </div>
        </div>
    );
}

/**
 * Legend item component for the progress bar
 */
interface LegendItemProps {
    color: string;
    label: string;
    count: number;
}

function LegendItem({ color, label, count }: LegendItemProps) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={cn("h-2.5 w-2.5 rounded-sm", color)} />
            <span className="text-muted-foreground">
                {label}: <span className="font-medium text-foreground">{count}</span>
            </span>
        </div>
    );
}

