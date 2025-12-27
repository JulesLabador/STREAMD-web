import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Snowflake,
    Flower2,
    Sun,
    Leaf,
    ArrowRight,
    Calendar,
    Sparkles,
    Users,
    Film,
    Clock,
    TrendingUp,
    Tv,
    Clapperboard,
    Star,
    ListPlus,
} from "lucide-react";
import {
    getNextSeasonStats,
    getUpcomingSeasonStats,
} from "@/app/actions/anime";
import { UpcomingJsonLd } from "@/components/seo/UpcomingJsonLd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
    AnimeSeason,
    AnimeWithPlanningCount,
    NextSeasonStats,
    SeasonInfo,
} from "@/types/anime";

/**
 * Feature flag to enable/disable this page
 * Set ENABLE_UPCOMING_PAGE=true in environment to enable
 */
const isPageEnabled = process.env.ENABLE_UPCOMING_PAGE === "true";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://streamd.app";

/**
 * Get next season name for metadata
 */
function getNextSeasonName(): { season: string; year: number } {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Determine next season
    if (month >= 1 && month <= 3) {
        return { season: "Spring", year };
    } else if (month >= 4 && month <= 6) {
        return { season: "Summer", year };
    } else if (month >= 7 && month <= 9) {
        return { season: "Fall", year };
    } else {
        return { season: "Winter", year: year + 1 };
    }
}

/**
 * Dynamic metadata for SEO optimization
 * Targets queries like "upcoming anime [next season] [year]"
 */
export async function generateMetadata(): Promise<Metadata> {
    if (!isPageEnabled) {
        return {
            title: "Page Not Found | STREAMD",
            robots: { index: false, follow: false },
        };
    }

    const { season, year } = getNextSeasonName();

    return {
        title: `${season} ${year} Anime - Upcoming Releases & Most Anticipated | STREAMD`,
        description: `Discover the most anticipated anime for ${season} ${year}. Browse upcoming releases, see what fans are planning to watch, and get ready for the next anime season.`,
        keywords: [
            `${season.toLowerCase()} ${year} anime`,
            "upcoming anime",
            `anime ${year}`,
            "most anticipated anime",
            "new anime releases",
            "anime schedule",
            "anime calendar",
            `next season anime`,
        ],
        openGraph: {
            title: `${season} ${year} Anime - Upcoming & Most Anticipated | STREAMD`,
            description: `Discover the most anticipated anime for ${season} ${year}. See what fans are planning to watch.`,
            type: "website",
            url: `${SITE_URL}/upcoming`,
        },
        twitter: {
            card: "summary_large_image",
            title: `${season} ${year} Anime | STREAMD`,
            description: `Most anticipated anime for ${season} ${year}`,
        },
        alternates: {
            canonical: `${SITE_URL}/upcoming`,
        },
    };
}

/**
 * Season configuration with icons and gradient styles
 */
const SEASON_CONFIG: Record<
    AnimeSeason,
    {
        name: string;
        icon: typeof Snowflake;
        gradient: string;
        heroGradient: string;
        iconColor: string;
        dateRange: string;
    }
> = {
    WINTER: {
        name: "Winter",
        icon: Snowflake,
        gradient: "from-sky-500/20 via-blue-500/15 to-indigo-600/20",
        heroGradient: "from-sky-600/30 via-blue-600/25 to-indigo-700/30",
        iconColor: "text-sky-400",
        dateRange: "January – March",
    },
    SPRING: {
        name: "Spring",
        icon: Flower2,
        gradient: "from-pink-500/20 via-rose-400/15 to-fuchsia-500/20",
        heroGradient: "from-pink-600/30 via-rose-500/25 to-fuchsia-600/30",
        iconColor: "text-pink-400",
        dateRange: "April – June",
    },
    SUMMER: {
        name: "Summer",
        icon: Sun,
        gradient: "from-amber-500/20 via-yellow-400/15 to-orange-500/20",
        heroGradient: "from-amber-600/30 via-yellow-500/25 to-orange-600/30",
        iconColor: "text-amber-400",
        dateRange: "July – September",
    },
    FALL: {
        name: "Fall",
        icon: Leaf,
        gradient: "from-orange-500/20 via-red-400/15 to-rose-600/20",
        heroGradient: "from-orange-600/30 via-red-500/25 to-rose-700/30",
        iconColor: "text-orange-400",
        dateRange: "October – December",
    },
};

/**
 * Next Season Hero - Full-width featured section
 */
function NextSeasonHero({ stats }: { stats: NextSeasonStats }) {
    const config = SEASON_CONFIG[stats.season.season];
    const Icon = config.icon;

    return (
        <section className="relative mb-12 overflow-hidden rounded-2xl">
            {/* Gradient background */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${config.heroGradient}`}
            />

            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
                <div className="absolute right-1/4 top-1/3 h-32 w-32 rounded-full bg-white/10 blur-xl" />
            </div>

            <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left content */}
                    <div className="max-w-2xl">
                        {/* Badge */}
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/20 px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
                            <Clock className="h-4 w-4" />
                            {stats.daysUntilStart > 0
                                ? `${stats.daysUntilStart} days until season starts`
                                : "Season starting soon!"}
                        </div>

                        {/* Title */}
                        <div className="mb-4 flex items-center gap-4">
                            <div
                                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-background/40 backdrop-blur-sm ${config.iconColor}`}
                            >
                                <Icon className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                                    {config.name} {stats.season.year}
                                </h1>
                                <p className="mt-1 text-lg text-muted-foreground">
                                    {config.dateRange}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="mb-6 text-lg text-foreground/80">
                            Get ready for the upcoming anime season. Browse
                            announced titles, see what&apos;s generating buzz,
                            and plan your watchlist.
                        </p>

                        {/* CTA */}
                        <Button size="lg" asChild>
                            <Link href={`/season/${stats.season.slug}`}>
                                Browse {config.name} {stats.season.year} Anime
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>

                    {/* Right content - Countdown card */}
                    <div className="hidden lg:block">
                        <Card className="border-0 bg-background/40 backdrop-blur-sm">
                            <CardContent className="p-6 text-center">
                                <p className="mb-2 text-sm font-medium text-muted-foreground">
                                    Season Starts
                                </p>
                                <p className="text-5xl font-bold text-foreground">
                                    {stats.daysUntilStart}
                                </p>
                                <p className="mt-1 text-lg text-muted-foreground">
                                    days
                                </p>
                                <div className="mt-4 text-sm text-muted-foreground">
                                    {new Date(
                                        stats.startDate
                                    ).toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * Season Stats Grid - Displays key statistics for the upcoming season
 */
function SeasonStatsGrid({ stats }: { stats: NextSeasonStats }) {
    return (
        <section className="mb-12">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard
                    icon={Film}
                    value={stats.season.animeCount}
                    label="Anime Announced"
                />
                <StatCard
                    icon={Users}
                    value={stats.usersPlanning}
                    label="Users Waiting"
                />
                <StatCard
                    icon={ListPlus}
                    value={stats.totalPlanningEntries}
                    label="Watchlist Adds"
                />
                <StatCard
                    icon={Tv}
                    value={stats.formatBreakdown["TV"] || 0}
                    label="TV Series"
                />
                <StatCard
                    icon={Clapperboard}
                    value={stats.sequelCount}
                    label="Sequels"
                />
                <StatCard
                    icon={Star}
                    value={stats.newSeriesCount}
                    label="New Series"
                />
            </div>
        </section>
    );
}

/**
 * Stat Card - Compact stat display for stats grid
 */
function StatCard({
    icon: Icon,
    value,
    label,
}: {
    icon: typeof Film;
    value: number;
    label: string;
}) {
    return (
        <Card className="border-0 bg-card">
            <CardContent className="p-4">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold text-foreground">
                        {value.toLocaleString()}
                    </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </CardContent>
        </Card>
    );
}

/**
 * Most Anticipated Anime Card with planning count
 */
function AnticipatedAnimeCard({ anime }: { anime: AnimeWithPlanningCount }) {
    const displayTitle = anime.titles.english || anime.titles.romaji;

    return (
        <Link
            href={`/anime/${anime.slug}`}
            className="group block overflow-hidden rounded-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {/* Cover image container */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                {anime.coverImageUrl ? (
                    <Image
                        src={anime.coverImageUrl}
                        alt={displayTitle}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover transition-opacity group-hover:opacity-90"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-secondary">
                        <span className="text-4xl text-muted-foreground">
                            🎬
                        </span>
                    </div>
                )}

                {/* Planning count badge */}
                {anime.planningCount > 0 && (
                    <div className="absolute left-2 top-2">
                        <Badge
                            variant="planned"
                            className="gap-1 text-xs font-medium"
                        >
                            <Users className="h-3 w-3" />
                            {anime.planningCount.toLocaleString()}
                        </Badge>
                    </div>
                )}

                {/* Rating overlay */}
                {anime.averageRating !== null && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                        <span className="text-yellow-400">★</span>
                        <span>{anime.averageRating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Card content */}
            <div className="mt-3 space-y-1">
                <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
                    {displayTitle}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{anime.format}</span>
                    {anime.episodeCount && (
                        <>
                            <span className="text-border">•</span>
                            <span>
                                {anime.episodeCount}{" "}
                                {anime.episodeCount === 1 ? "ep" : "eps"}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}

/**
 * Current Season Card - Compact version
 */
function CurrentSeasonCard({ season }: { season: SeasonInfo }) {
    const config = SEASON_CONFIG[season.season];
    const Icon = config.icon;

    return (
        <Link href={`/season/${season.slug}`} className="group block">
            <Card className="relative overflow-hidden border-0 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
                <div
                    className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`}
                />

                <CardContent className="relative flex items-center gap-4 p-5">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm ${config.iconColor}`}
                    >
                        <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground group-hover:text-primary">
                                {config.name} {season.year}
                            </h3>
                            <Badge
                                variant="watching"
                                className="text-xs font-medium"
                            >
                                <Sparkles className="mr-1 h-3 w-3" />
                                Now Airing
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {season.animeCount.toLocaleString()} anime •{" "}
                            {config.dateRange}
                        </p>
                    </div>

                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </CardContent>
            </Card>
        </Link>
    );
}

/**
 * Compact Season Card for future seasons
 */
function CompactSeasonCard({ season }: { season: SeasonInfo }) {
    const config = SEASON_CONFIG[season.season];
    const Icon = config.icon;

    return (
        <Link href={`/season/${season.slug}`} className="group block">
            <Card className="relative overflow-hidden border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
                <div
                    className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-60 transition-opacity group-hover:opacity-100`}
                />

                <CardContent className="relative flex items-center gap-3 p-4">
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm ${config.iconColor}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary">
                            {config.name} {season.year}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {season.animeCount.toLocaleString()} anime
                        </p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </CardContent>
            </Card>
        </Link>
    );
}

/**
 * Upcoming Anime Page
 *
 * SEO-optimized landing page emphasizing the NEXT anime season.
 * Features:
 * - Full-width hero for next season with countdown and stats
 * - Most anticipated anime section based on user planning data
 * - Current season card (demoted)
 * - Future seasons quick navigation
 */
export default async function UpcomingPage() {
    // Feature flag check
    if (!isPageEnabled) {
        notFound();
    }

    // Fetch data in parallel
    const [nextSeasonResult, seasonStatsResult] = await Promise.all([
        getNextSeasonStats(6),
        getUpcomingSeasonStats(),
    ]);

    // Handle error states
    if (!nextSeasonResult.success) {
        return (
            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-foreground">
                            Something went wrong
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {nextSeasonResult.error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const nextSeasonStats = nextSeasonResult.data;
    const { currentSeason, nextSeasons } = seasonStatsResult.success
        ? seasonStatsResult.data
        : { currentSeason: null, nextSeasons: [] };

    // Get future seasons (excluding the one in hero)
    const futureSeasons = nextSeasons.filter(
        (s) =>
            !(
                s.season === nextSeasonStats.season.season &&
                s.year === nextSeasonStats.season.year
            )
    );

    return (
        <>
            {/* JSON-LD Structured Data */}
            <UpcomingJsonLd
                anime={nextSeasonStats.mostAnticipated}
                currentSeason={currentSeason}
                nextSeasons={nextSeasons}
                siteUrl={SITE_URL}
            />

            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                        <Calendar className="h-4 w-4" />
                        Anime Schedule
                    </div>
                    <h1 className="sr-only">
                        Upcoming Anime -{" "}
                        {SEASON_CONFIG[nextSeasonStats.season.season].name}{" "}
                        {nextSeasonStats.season.year}
                    </h1>
                </div>

                {/* Next Season Hero */}
                <NextSeasonHero stats={nextSeasonStats} />

                {/* Season Stats Grid */}
                <SeasonStatsGrid stats={nextSeasonStats} />

                {/* Most Anticipated Section */}
                {nextSeasonStats.mostAnticipated.length > 0 && (
                    <section className="mb-12">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">
                                        Most Anticipated
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Top picks based on user watchlists
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link
                                    href={`/season/${nextSeasonStats.season.slug}`}
                                >
                                    View All
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {nextSeasonStats.mostAnticipated.map((anime) => (
                                <AnticipatedAnimeCard
                                    key={anime.id}
                                    anime={anime}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Current Season - Compact */}
                {currentSeason && (
                    <section className="mb-12">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">
                            Currently Airing
                        </h2>
                        <CurrentSeasonCard season={currentSeason} />
                    </section>
                )}

                {/* Future Seasons */}
                {futureSeasons.length > 0 && (
                    <section className="mb-12">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">
                                Future Seasons
                            </h2>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/season">
                                    View All Seasons
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {futureSeasons.map((season) => (
                                <CompactSeasonCard
                                    key={season.slug}
                                    season={season}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Browse All Seasons CTA */}
                <section>
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
                            <Calendar className="mb-4 h-12 w-12 text-primary/60" />
                            <h2 className="text-2xl font-bold text-foreground">
                                Explore All Seasons
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                                Browse our complete archive of anime seasons
                                from past years to upcoming releases.
                            </p>
                            <Button className="mt-6" asChild>
                                <Link href="/season">
                                    Browse Season Archive
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}
