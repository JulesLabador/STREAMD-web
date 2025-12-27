import { Metadata } from "next";
import { getAnimeList } from "@/app/actions/anime";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { InlineSearch } from "@/components/search";
import { WebsiteJsonLd } from "@/components/seo/WebsiteJsonLd";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://streamd.app";

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
 * Home page - Browse anime
 *
 * Server Component that fetches and displays a grid of anime
 * from the database, sorted by popularity. Features an inline
 * search bar for quick anime discovery.
 */
export default async function HomePage() {
    // Fetch anime list from database
    const result = await getAnimeList(1, 24);

    // Handle error state
    if (!result.success) {
        return (
            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

    const { data: animeList, pagination } = result.data;

    return (
        <>
            {/* JSON-LD Structured Data for SEO */}
            <WebsiteJsonLd />

            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Inline search bar */}
                <div className="mb-8">
                    <InlineSearch
                    placeholder="Search for anime..."
                    className="max-w-2xl mx-auto"
                />
            </div>

            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Browse Anime
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Discover and track your favorite anime series
                </p>
            </div>

            {/* Anime grid */}
            <AnimeGrid anime={animeList} />

                {/* Pagination info */}
                {pagination.totalCount > 0 && (
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        Showing {animeList.length} of {pagination.totalCount}{" "}
                        anime
                    </div>
                )}
            </div>
        </>
    );
}
