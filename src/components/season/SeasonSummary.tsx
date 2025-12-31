import { ChevronDown, ChevronUp } from "lucide-react";
import { SeasonTimeContext } from "./season-utils";

/**
 * Props for SeasonSummary component
 */
interface SeasonSummaryProps {
    /** Short intro paragraph (AI-generated) */
    introParagraph: string | null;
    /** Full summary content (AI-generated) */
    fullSummary: string | null;
    /** Formatted season name (e.g., "Winter 2025") */
    seasonName: string;
    /** Time context for styling/messaging */
    timeContext: SeasonTimeContext;
}

/**
 * Season Summary Section
 *
 * Displays AI-generated content when available.
 * Shows an intro paragraph always visible and a collapsible
 * full summary for longer content.
 *
 * @param introParagraph - Short intro text
 * @param fullSummary - Longer summary content
 * @param seasonName - Display name of the season
 * @param timeContext - Past, current, or future context
 */
export function SeasonSummary({
    introParagraph,
    fullSummary,
    seasonName,
}: SeasonSummaryProps) {
    // If no AI content, don&apos;t render anything
    if (!introParagraph && !fullSummary) {
        return null;
    }

    return (
        <section className="mb-8">
            {/* Intro paragraph - always visible */}
            {introParagraph && (
                <p className="text-lg leading-relaxed text-foreground/90">
                    {introParagraph}
                </p>
            )}

            {/* Full summary - collapsible for longer content */}
            {fullSummary && (
                <details className="group mt-4">
                    <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
                        <span>Read more about {seasonName}</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:hidden" />
                        <ChevronUp className="hidden h-4 w-4 transition-transform group-open:block" />
                    </summary>
                    <div className="mt-4 space-y-4 text-muted-foreground">
                        {fullSummary.split("\n\n").map((paragraph, index) => (
                            <p key={index} className="leading-relaxed">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </details>
            )}
        </section>
    );
}

