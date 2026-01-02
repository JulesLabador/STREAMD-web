import { Metadata } from "next";
import Link from "next/link";
import { Snowflake, Flower2, Sun, Leaf, Calendar, Film } from "lucide-react";
import { getSeasons } from "@/lib/queries";
import { BrowsePageHeader } from "@/components/browse";
import { Card, CardContent } from "@/components/ui/card";
import type { AnimeSeason, SeasonInfo } from "@/types/anime";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.streamdanime.io";

/**
 * Static metadata for the seasons index page
 */
export const metadata: Metadata = {
    title: "Anime by Season",
    description:
        "Browse anime by season. Discover anime from Winter, Spring, Summer, and Fall seasons across all years.",
    openGraph: {
        title: "Anime by Season | STREAMD",
        description:
            "Browse anime by season. Discover anime from Winter, Spring, Summer, and Fall seasons across all years.",
        type: "website",
    },
    alternates: {
        canonical: `${SITE_URL}/season`,
    },
};

/**
 * Season configuration with icons and gradient styles
 */
const SEASON_CONFIG: Record<
    AnimeSeason,
    {
        name: string;
        icon: typeof Snowflake;
        gradient: string;
        iconColor: string;
        dateRange: string;
    }
> = {
    WINTER: {
        name: "Winter",
        icon: Snowflake,
        gradient: "from-sky-500/20 to-blue-600/20",
        iconColor: "text-sky-400",
        dateRange: "January – March",
    },
    SPRING: {
        name: "Spring",
        icon: Flower2,
        gradient: "from-pink-500/20 to-rose-400/20",
        iconColor: "text-pink-400",
        dateRange: "April – June",
    },
    SUMMER: {
        name: "Summer",
        icon: Sun,
        gradient: "from-amber-500/20 to-yellow-400/20",
        iconColor: "text-amber-400",
        dateRange: "July – September",
    },
    FALL: {
        name: "Fall",
        icon: Leaf,
        gradient: "from-orange-500/20 to-red-500/20",
        iconColor: "text-orange-400",
        dateRange: "October – December",
    },
};

/**
 * Season order for consistent display within a year
 */
const SEASON_ORDER: AnimeSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

/**
 * Groups seasons by year
 * @param seasons - Array of season info
 * @returns Map of year to seasons array
 */
function groupSeasonsByYear(seasons: SeasonInfo[]): Map<number, SeasonInfo[]> {
    const grouped = new Map<number, SeasonInfo[]>();

    for (const season of seasons) {
        const existing = grouped.get(season.year) || [];
        existing.push(season);
        grouped.set(season.year, existing);
    }

    // Sort seasons within each year by season order
    for (const [year, yearSeasons] of grouped) {
        yearSeasons.sort(
            (a, b) =>
                SEASON_ORDER.indexOf(a.season) - SEASON_ORDER.indexOf(b.season)
        );
        grouped.set(year, yearSeasons);
    }

    return grouped;
}

/**
 * SeasonCard component with gradient background
 */
function SeasonCard({ season }: { season: SeasonInfo }) {
    const config = SEASON_CONFIG[season.season];
    const Icon = config.icon;

    return (
        <Link href={`/season/${season.slug}`} className="group block">
            <Card className="relative h-full overflow-hidden border-0 transition-all hover:scale-[1.02] hover:shadow-lg">
                {/* Gradient background */}
                <div
                    className={`absolute inset-0 bg-linear-to-br ${config.gradient} opacity-60 transition-opacity group-hover:opacity-100`}
                />

                <CardContent className="relative flex items-center gap-4 p-4">
                    {/* Season icon */}
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm ${config.iconColor}`}
                    >
                        <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary">
                            {config.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {config.dateRange}
                        </p>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                            {season.animeCount.toLocaleString()} anime
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

/**
 * Calculates year summary statistics
 */
function getYearStats(yearSeasons: SeasonInfo[]): {
    totalAnime: number;
    seasonCount: number;
} {
    const totalAnime = yearSeasons.reduce((sum, s) => sum + s.animeCount, 0);
    return {
        totalAnime,
        seasonCount: yearSeasons.length,
    };
}

/**
 * Seasons index page
 *
 * Displays seasons grouped by year with seasonal gradients and icons.
 * Each year shows up to 4 seasons in a grid.
 */
export default async function SeasonsPage() {
    const result = await getSeasons();

    // Handle error state
    if (!result.success) {
        return (
            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <BrowsePageHeader
                    title="Anime by Season"
                    description="Browse anime by release season"
                />
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-foreground">
                            Something went wrong
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {result.error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const seasons = result.data;
    const groupedSeasons = groupSeasonsByYear(seasons);

    // Sort years in descending order (most recent first)
    const sortedYears = Array.from(groupedSeasons.keys()).sort((a, b) => b - a);

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <BrowsePageHeader
                title="Anime by Season"
                description="Browse anime by release season"
                count={seasons.length}
                countLabel="seasons"
            />

            {/* Empty state */}
            {seasons.length === 0 && (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
                    <p className="text-muted-foreground">No seasons found</p>
                </div>
            )}

            {/* Grouped seasons by year */}
            <div className="space-y-12">
                {sortedYears.map((year, index) => {
                    const yearSeasons = groupedSeasons.get(year) || [];
                    const stats = getYearStats(yearSeasons);
                    const currentYear = new Date().getFullYear();
                    const isCurrentYear = year === currentYear;
                    const isFutureYear = year > currentYear;

                    return (
                        <section key={year}>
                            {/* Year header with stats */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                        {year}
                                    </h2>
                                    {isCurrentYear && (
                                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                            Current Year
                                        </span>
                                    )}
                                    {isFutureYear && (
                                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                            Upcoming
                                        </span>
                                    )}
                                </div>

                                {/* Year stats */}
                                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Film className="h-4 w-4" />
                                        <span>
                                            {stats.totalAnime.toLocaleString()}{" "}
                                            anime
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {stats.seasonCount}{" "}
                                            {stats.seasonCount === 1
                                                ? "season"
                                                : "seasons"}{" "}
                                            available
                                        </span>
                                    </div>
                                </div>

                                {/* Year description for recent years */}
                                {index < 3 && stats.totalAnime > 0 && (
                                    <p className="mt-2 text-sm text-muted-foreground/80">
                                        {isCurrentYear
                                            ? "Browse anime currently airing and recently released this year."
                                            : isFutureYear
                                            ? "Preview upcoming anime announcements for this year."
                                            : `Explore ${stats.totalAnime.toLocaleString()} anime titles that aired throughout ${year}.`}
                                    </p>
                                )}
                            </div>

                            {/* Season cards grid - 4 columns on desktop */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {yearSeasons.map((season) => (
                                    <SeasonCard
                                        key={season.slug}
                                        season={season}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
