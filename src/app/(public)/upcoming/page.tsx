import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    Snowflake,
    Flower2,
    Sun,
    Leaf,
    ArrowRight,
    Calendar,
    Sparkles,
} from "lucide-react";
import { getUpcomingAnime, getUpcomingSeasonStats } from "@/app/actions/anime";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { UpcomingJsonLd } from "@/components/seo/UpcomingJsonLd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnimeSeason, SeasonInfo } from "@/types/anime";

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
 * Get current year for dynamic metadata
 */
function getCurrentYear(): number {
    return new Date().getFullYear();
}

/**
 * Get current season name for metadata
 */
function getCurrentSeasonName(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return "Winter";
    if (month >= 4 && month <= 6) return "Spring";
    if (month >= 7 && month <= 9) return "Summer";
    return "Fall";
}

/**
 * Dynamic metadata for SEO optimization
 * Targets queries like "upcoming anime 2025", "new anime releases"
 * Returns minimal metadata if page is disabled
 */
export async function generateMetadata(): Promise<Metadata> {
    // Return minimal metadata if page is disabled
    if (!isPageEnabled) {
        return {
            title: "Page Not Found | STREAMD",
            robots: { index: false, follow: false },
        };
    }

    const year = getCurrentYear();
    const season = getCurrentSeasonName();

    return {
        title: `Upcoming Anime ${year} - New Releases & Schedule | STREAMD`,
        description: `Discover upcoming anime for ${season} ${year} and beyond. Browse new anime releases, airing schedules, and plan your watchlist with the latest anime announcements.`,
        keywords: [
            "upcoming anime",
            `anime ${year}`,
            "new anime releases",
            "anime schedule",
            `${season.toLowerCase()} ${year} anime`,
            "anime airing",
            "anime calendar",
        ],
        openGraph: {
            title: `Upcoming Anime ${year} - New Releases & Schedule | STREAMD`,
            description: `Discover upcoming anime for ${season} ${year} and beyond. Browse new anime releases and plan your watchlist.`,
            type: "website",
            url: `${SITE_URL}/upcoming`,
        },
        twitter: {
            card: "summary_large_image",
            title: `Upcoming Anime ${year} | STREAMD`,
            description: `Discover upcoming anime for ${season} ${year} and beyond.`,
        },
        alternates: {
            canonical: `${SITE_URL}/upcoming`,
        },
    };
}

/**
 * Season configuration with icons and gradient styles
 * Reused from the season page for consistency
 */
const SEASON_CONFIG: Record<
    AnimeSeason,
    {
        name: string;
        icon: typeof Snowflake;
        gradient: string;
        hoverGradient: string;
        iconColor: string;
        dateRange: string;
    }
> = {
    WINTER: {
        name: "Winter",
        icon: Snowflake,
        gradient: "from-sky-500/20 via-blue-500/15 to-indigo-600/20",
        hoverGradient: "from-sky-500/30 via-blue-500/25 to-indigo-600/30",
        iconColor: "text-sky-400",
        dateRange: "January – March",
    },
    SPRING: {
        name: "Spring",
        icon: Flower2,
        gradient: "from-pink-500/20 via-rose-400/15 to-fuchsia-500/20",
        hoverGradient: "from-pink-500/30 via-rose-400/25 to-fuchsia-500/30",
        iconColor: "text-pink-400",
        dateRange: "April – June",
    },
    SUMMER: {
        name: "Summer",
        icon: Sun,
        gradient: "from-amber-500/20 via-yellow-400/15 to-orange-500/20",
        hoverGradient: "from-amber-500/30 via-yellow-400/25 to-orange-500/30",
        iconColor: "text-amber-400",
        dateRange: "July – September",
    },
    FALL: {
        name: "Fall",
        icon: Leaf,
        gradient: "from-orange-500/20 via-red-400/15 to-rose-600/20",
        hoverGradient: "from-orange-500/30 via-red-400/25 to-rose-600/30",
        iconColor: "text-orange-400",
        dateRange: "October – December",
    },
};

/**
 * Hero Season Card - Large featured card for current/next season
 */
function HeroSeasonCard({
    season,
    isCurrent,
}: {
    season: SeasonInfo;
    isCurrent: boolean;
}) {
    const config = SEASON_CONFIG[season.season];
    const Icon = config.icon;

    return (
        <Link href={`/season/${season.slug}`} className="group block h-full">
            <Card className="relative h-full overflow-hidden border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                {/* Gradient background with animation */}
                <div
                    className={`absolute inset-0 bg-gradient-to-br ${config.gradient} transition-all duration-300 group-hover:opacity-100`}
                />
                <div
                    className={`absolute inset-0 bg-gradient-to-br ${config.hoverGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />

                {/* Decorative pattern overlay */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />
                    <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/10" />
                </div>

                <CardContent className="relative flex h-full flex-col justify-between p-6">
                    {/* Header with badge */}
                    <div className="flex items-start justify-between">
                        <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm ${config.iconColor}`}
                        >
                            <Icon className="h-7 w-7" />
                        </div>
                        {isCurrent && (
                            <Badge
                                variant="watching"
                                className="animate-pulse text-xs font-medium"
                            >
                                <Sparkles className="mr-1 h-3 w-3" />
                                Now Airing
                            </Badge>
                        )}
                    </div>

                    {/* Content */}
                    <div className="mt-6 space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            {config.name} {season.year}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {config.dateRange}
                        </p>
                        <p className="text-lg font-semibold text-foreground/90">
                            {season.animeCount.toLocaleString()} anime
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-6">
                        <Button
                            variant="secondary"
                            className="w-full gap-2 bg-background/60 backdrop-blur-sm transition-all group-hover:bg-background/80"
                        >
                            Browse Season
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

/**
 * Compact Season Card for quick navigation grid
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
 * SEO-optimized landing page for users searching for upcoming anime.
 * Features:
 * - Hero section with current and next season
 * - Quick navigation to future seasons
 * - Preview grid of upcoming/airing anime
 * - Structured data for rich search results
 *
 * Note: This page is behind a feature flag (ENABLE_UPCOMING_PAGE)
 * and will return 404 unless explicitly enabled.
 */
export default async function UpcomingPage() {
    // Feature flag check - return 404 if page is not enabled
    if (!isPageEnabled) {
        notFound();
    }

    // Fetch data in parallel
    const [seasonStatsResult, upcomingAnimeResult] = await Promise.all([
        getUpcomingSeasonStats(),
        getUpcomingAnime(12),
    ]);

    // Handle error states
    if (!seasonStatsResult.success) {
        return (
            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-foreground">
                            Something went wrong
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {seasonStatsResult.error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const { currentSeason, nextSeasons } = seasonStatsResult.data;
    const upcomingAnime = upcomingAnimeResult.success
        ? upcomingAnimeResult.data
        : [];

    // Determine hero seasons (current + first next season)
    const heroSeasons: Array<{ season: SeasonInfo; isCurrent: boolean }> = [];
    if (currentSeason) {
        heroSeasons.push({ season: currentSeason, isCurrent: true });
    }
    if (nextSeasons.length > 0) {
        heroSeasons.push({ season: nextSeasons[0], isCurrent: false });
    }

    // Remaining seasons for quick nav (skip first if it&apos;s in hero)
    const quickNavSeasons = nextSeasons.slice(heroSeasons.length > 1 ? 1 : 0);

    return (
        <>
            {/* JSON-LD Structured Data */}
            <UpcomingJsonLd
                anime={upcomingAnime}
                currentSeason={currentSeason}
                nextSeasons={nextSeasons}
                siteUrl={SITE_URL}
            />

            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-10 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                        <Calendar className="h-4 w-4" />
                        Anime Schedule
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        Upcoming Anime
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Discover what&apos;s airing now and plan your watchlist
                        for upcoming seasons. Stay ahead with the latest anime
                        releases.
                    </p>
                </div>

                {/* Hero Section - Current & Next Season */}
                {heroSeasons.length > 0 && (
                    <section className="mb-12">
                        <div
                            className={`grid gap-6 ${
                                heroSeasons.length === 2
                                    ? "md:grid-cols-2"
                                    : "mx-auto max-w-lg"
                            }`}
                        >
                            {heroSeasons.map(({ season, isCurrent }) => (
                                <HeroSeasonCard
                                    key={season.slug}
                                    season={season}
                                    isCurrent={isCurrent}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Quick Navigation - Future Seasons */}
                {quickNavSeasons.length > 0 && (
                    <section className="mb-12">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-foreground">
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
                            {quickNavSeasons.map((season) => (
                                <CompactSeasonCard
                                    key={season.slug}
                                    season={season}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Upcoming Anime Preview */}
                <section>
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">
                                Airing & Upcoming
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Currently airing and soon-to-release anime
                            </p>
                        </div>
                    </div>

                    <AnimeGrid
                        anime={upcomingAnime}
                        emptyMessage="No upcoming anime found"
                    />

                    {/* View more link */}
                    {upcomingAnime.length > 0 && currentSeason && (
                        <div className="mt-8 text-center">
                            <Button variant="outline" asChild>
                                <Link href={`/season/${currentSeason.slug}`}>
                                    View Full{" "}
                                    {SEASON_CONFIG[currentSeason.season].name}{" "}
                                    {currentSeason.year} Lineup
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </section>

                {/* Browse All Seasons CTA */}
                <section className="mt-16">
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
