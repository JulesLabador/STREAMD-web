import { Sparkles } from "lucide-react";
import { SeasonTimeContext } from "./season-utils";

/**
 * Props for SeasonBadge component
 */
interface SeasonBadgeProps {
    /** Time context of the season (past, current, or future) */
    timeContext: SeasonTimeContext;
}

/**
 * Season Badge Component
 *
 * Shows a contextual badge for current or upcoming seasons.
 * Returns null for past seasons as they don&apos;t need a badge.
 *
 * @param timeContext - Whether the season is past, current, or future
 */
export function SeasonBadge({ timeContext }: SeasonBadgeProps) {
    // Past seasons don&apos;t need a badge
    if (timeContext === "past") {
        return null;
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                timeContext === "current"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}
        >
            <Sparkles className="h-3 w-3" />
            {timeContext === "current" ? "Now Airing" : "Upcoming"}
        </span>
    );
}

