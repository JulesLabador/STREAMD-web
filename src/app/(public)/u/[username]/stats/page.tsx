import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Tv, Play, Clock, Star } from "lucide-react";
import { getUserProfile, getUserStats } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    StatCard,
    formatWatchTime,
    YearlyProgressBar,
    GenreChart,
    RatingDistribution,
    HistoricalStats,
} from "@/components/stats";

/**
 * Page props with dynamic username parameter
 */
interface StatsPageProps {
    params: Promise<{ username: string }>;
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
    params,
}: StatsPageProps): Promise<Metadata> {
    const { username } = await params;
    const result = await getUserProfile(username);

    if (!result.success) {
        return {
            title: "User Not Found",
        };
    }

    const profile = result.data;
    const displayName = profile.displayName || profile.username;

    return {
        title: `${displayName}&apos;s Stats`,
        description: `View ${displayName}&apos;s anime watching statistics on STREAMD.`,
        openGraph: {
            title: `${displayName}&apos;s Stats | STREAMD`,
            description: `View ${displayName}&apos;s anime watching statistics on STREAMD.`,
            type: "profile",
        },
    };
}

/**
 * User statistics dashboard page
 *
 * Displays comprehensive anime watching statistics including:
 * - Hero stat cards with big numbers
 * - Current year progress bar
 * - Genre and rating distributions
 * - Collapsible historical data
 *
 * Route: /u/[username]/stats
 */
export default async function StatsPage({ params }: StatsPageProps) {
    const { username } = await params;

    // Fetch user profile and stats in parallel
    const [profileResult, statsResult] = await Promise.all([
        getUserProfile(username),
        getUserProfile(username).then(async (result) => {
            if (!result.success) return null;
            return getUserStats(result.data.id);
        }),
    ]);

    // Handle not found
    if (!profileResult.success) {
        if (profileResult.code === "NOT_FOUND") {
            notFound();
        }
        return (
            <div className="min-h-screen p-4">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-foreground">
                            Something went wrong
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {profileResult.error}
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/">Go back home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const profile = profileResult.data;

    // Handle stats fetch error
    if (!statsResult || !statsResult.success) {
        return (
            <div className="min-h-screen p-4">
                <div className="mx-auto max-w-7xl">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="mb-6 -ml-2"
                    >
                        <Link href={`/u/${username}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Profile
                        </Link>
                    </Button>
                    <div className="flex min-h-[400px] items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-foreground">
                                Unable to load statistics
                            </h2>
                            <p className="mt-2 text-muted-foreground">
                                Please try again later.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const stats = statsResult.data;
    const displayName = profile.displayName || profile.username;

    // Get current year data for featured progress bar
    const currentYearData = stats.yearlyData.find(
        (y) => y.year === stats.currentYear
    ) || {
        year: stats.currentYear,
        completed: 0,
        watching: 0,
        planned: 0,
        paused: 0,
        dropped: 0,
        totalAnimeForYear: 0,
    };

    // Get historical data (excluding current year)
    const historicalData = stats.yearlyData.filter(
        (y) => y.year !== stats.currentYear
    );

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="-ml-2"
                        >
                            <Link href={`/u/${username}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Profile
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        {displayName}&apos;s {stats.currentYear} Stats
                    </h1>
                </div>

                {/* Hero Stat Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        value={stats.totalAnime}
                        label="Anime This Year"
                        icon={Tv}
                        subtitle="tracked"
                    />
                    <StatCard
                        value={stats.totalEpisodes.toLocaleString()}
                        label="Episodes Watched"
                        icon={Play}
                        subtitle="total"
                    />
                    <StatCard
                        value={formatWatchTime(stats.watchTimeMinutes)}
                        label="Watch Time"
                        icon={Clock}
                        subtitle={`${Math.round(stats.watchTimeMinutes / 60)} hours`}
                    />
                    <StatCard
                        value={stats.averageRating?.toFixed(1) ?? "—"}
                        label="Average Rating"
                        icon={Star}
                        subtitle={stats.averageRating ? "out of 10" : "no ratings yet"}
                    />
                </div>

                {/* Current Year Progress */}
                <Card className="mb-8">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium">
                            {stats.currentYear} Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <YearlyProgressBar data={currentYearData} featured />
                    </CardContent>
                </Card>

                {/* Charts Grid */}
                <div className="mb-8 grid gap-6 md:grid-cols-2">
                    <GenreChart data={stats.topGenres} />
                    <RatingDistribution
                        data={stats.ratingDistribution}
                        averageRating={stats.averageRating}
                    />
                </div>

                {/* Historical Data (Collapsible) */}
                {historicalData.length > 0 && (
                    <HistoricalStats data={historicalData} />
                )}

                {/* Empty State */}
                {stats.totalAnime === 0 && historicalData.length === 0 && (
                    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
                        <div className="text-center">
                            <p className="text-muted-foreground">
                                No anime tracked yet. Start adding anime to see your stats!
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/">Browse Anime</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

