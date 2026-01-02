import { Metadata } from "next";
import {
    getSeasonalStats,
    getCurrentSeasonAnime,
    getNextSeasonStats,
    getCurrentSeasonStudios,
} from "@/lib/queries";
import {
    HeroSection,
    SeasonSection,
    UpcomingSection,
    DiscoverySection,
} from "@/components/home";
import { WebsiteJsonLd } from "@/components/seo/WebsiteJsonLd";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.streamdanime.io";

/**
 * Homepage metadata with Open Graph and Twitter Card tags
 * for optimal social sharing and SEO
 */
export const metadata: Metadata = {
    title: "STREAMD - Track Your Anime Journey",
    description:
        "Track, rate, and share your anime journey with STREAMD. Discover new anime, build your watchlist, and connect with fans worldwide.",
    openGraph: {
        title: "STREAMD - Track Your Anime Journey",
        description:
            "Track, rate, and share your anime journey with STREAMD. Discover new anime, build your watchlist, and connect with fans worldwide.",
        url: SITE_URL,
        siteName: "STREAMD",
        images: [
            {
                url: `${SITE_URL}/og-image.png`,
                width: 1200,
                height: 630,
                alt: "STREAMD - Anime Tracking Platform",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "STREAMD - Track Your Anime Journey",
        description:
            "Track, rate, and share your anime journey with STREAMD. Discover new anime and build your watchlist.",
        images: [`${SITE_URL}/og-image.png`],
    },
    alternates: {
        canonical: SITE_URL,
    },
};

/**
 * Home page - Seasonal Command Center
 *
 * A dynamic dashboard that answers: "What anime should I care about right now?"
 *
 * Sections:
 * 1. Hero Search + Seasonal Context
 * 2. This Season at a Glance (Most Popular, Highest Rated)
 * 3. Upcoming Anime (Next Season Preview)
 * 4. Discovery & Exploration (Studios, Browse Paths)
 *
 * All data is fetched in parallel for optimal performance.
 */
export default async function HomePage() {
    // Fetch all data in parallel for optimal performance
    const [
        seasonalStatsResult,
        popularAnimeResult,
        topRatedAnimeResult,
        nextSeasonResult,
        studiosResult,
    ] = await Promise.all([
        getSeasonalStats(),
        getCurrentSeasonAnime("popularity", 12),
        getCurrentSeasonAnime("rating", 12),
        getNextSeasonStats(12),
        getCurrentSeasonStudios(6),
    ]);

    // Extract data with fallbacks
    const seasonalStats = seasonalStatsResult.success
        ? seasonalStatsResult.data
        : null;
    const popularAnime = popularAnimeResult.success
        ? popularAnimeResult.data
        : [];
    const topRatedAnime = topRatedAnimeResult.success
        ? topRatedAnimeResult.data
        : [];
    const nextSeasonStats = nextSeasonResult.success
        ? nextSeasonResult.data
        : null;
    const studios = studiosResult.success ? studiosResult.data : [];

    return (
        <>
            {/* JSON-LD Structured Data for SEO */}
            <WebsiteJsonLd />

            <div className="min-h-screen">
                {/* Hero Section with Search and Seasonal Context */}
                <HeroSection stats={seasonalStats} />

                {/* Main Content */}
                <div className="mx-auto max-w-7xl space-y-10 sm:space-y-16 pb-16">
                    {/* This Season at a Glance */}
                    {seasonalStats && (
                        <SeasonSection
                            season={seasonalStats.season}
                            year={seasonalStats.year}
                            slug={seasonalStats.slug}
                            popularAnime={popularAnime}
                            topRatedAnime={topRatedAnime}
                        />
                    )}

                    {/* Upcoming Anime - Next Season Preview */}
                    {nextSeasonStats && (
                        <UpcomingSection stats={nextSeasonStats} />
                    )}

                    {/* Discovery & Exploration */}
                    <DiscoverySection studios={studios} />
                </div>
            </div>
        </>
    );
}
