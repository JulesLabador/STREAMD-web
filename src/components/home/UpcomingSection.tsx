import Link from "next/link";
import { Calendar, Users, Film, Tv, Sparkles } from "lucide-react";
import { AnimeCarousel } from "./AnimeCarousel";
import { Card, CardContent } from "@/components/ui/card";
import type { NextSeasonStats, AnimeSeason } from "@/types/anime";

/**
 * Props for UpcomingSection
 */
interface UpcomingSectionProps {
    /** Next season statistics with most anticipated anime */
    stats: NextSeasonStats;
}

/**
 * Season display names
 */
const SEASON_NAMES: Record<AnimeSeason, string> = {
    WINTER: "Winter",
    SPRING: "Spring",
    SUMMER: "Summer",
    FALL: "Fall",
};

/**
 * UpcomingSection - Next season preview with countdown
 *
 * Features:
 * - Season countdown banner
 * - Key statistics (anime count, format breakdown, sequels vs new)
 * - Most anticipated anime carousel (by planning count)
 */
export function UpcomingSection({ stats }: UpcomingSectionProps) {
    const seasonName = `${SEASON_NAMES[stats.season.season]} ${
        stats.season.year
    }`;

    // Calculate format breakdown for display
    const tvCount = stats.formatBreakdown["TV"] || 0;
    const movieCount = stats.formatBreakdown["MOVIE"] || 0;

    return (
        <section className="space-y-8">
            {/* Section header with countdown */}
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Coming Next: {seasonName}
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Preview upcoming anime and build your watchlist
                        </p>
                    </div>

                    {/* Countdown badge */}
                    {stats.daysUntilStart > 0 && (
                        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {stats.daysUntilStart} days until season starts
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
                {/* Total anime */}
                <Card className="border-0">
                    <CardContent className="flex items-center gap-3 px-4 py-2 sm:py-4">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Film className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg sm:text-2xl font-bold text-foreground">
                                {stats.season.animeCount}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Anime announced
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* TV series */}
                <Card className="border-0">
                    <CardContent className="flex items-center gap-3 px-4 py-2 sm:py-4">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-chart-2/10">
                            <Tv className="h-4 w-4 sm:h-5 sm:w-5 text-chart-2" />
                        </div>
                        <div>
                            <p className="text-lg sm:text-2xl font-bold text-foreground">
                                {tvCount}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                TV series
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* New series */}
                <Card className="border-0">
                    <CardContent className="flex items-center gap-3 px-4 py-2 sm:py-4">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-chart-3/10">
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-chart-3" />
                        </div>
                        <div>
                            <p className="text-lg sm:text-2xl font-bold text-foreground">
                                {stats.newSeriesCount}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                New series
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Users planning */}
                <Card className="border-0">
                    <CardContent className="flex items-center gap-3 px-4 py-2 sm:py-4">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-chart-4/10">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-chart-4" />
                        </div>
                        <div>
                            <p className="text-lg sm:text-2xl font-bold text-foreground">
                                {stats.usersPlanning}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Users planning
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Most anticipated carousel */}
            {stats.mostAnticipated.length > 0 && (
                <AnimeCarousel
                    title="Most Anticipated"
                    subtitle="Anime with the most users planning to watch"
                    anime={stats.mostAnticipated}
                    viewAllHref={`/season/${stats.season.slug}`}
                    showPlanningCount={true}
                />
            )}
        </section>
    );
}
