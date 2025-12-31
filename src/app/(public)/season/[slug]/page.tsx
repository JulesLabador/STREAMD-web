import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getAnimeBySeason, getSeasonContent } from "@/app/actions/anime";
import { parseSeasonSlug } from "@/types/anime";
import { BrowsePageHeader } from "@/components/browse";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { AnimePagination } from "@/components/anime/AnimePagination";
import { SeasonJsonLd } from "@/components/seo";
import {
    SeasonBadge,
    SeasonNavigation,
    SeasonSummary,
    SEASON_MONTHS,
    formatSeasonName,
    getSeasonTimeContext,
} from "@/components/season";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.streamdanime.io";

/**
 * Page props with dynamic slug parameter and search params
 */
interface SeasonPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

/**
 * Generate dynamic metadata for SEO
 * Uses AI-generated content when available for better search rankings
 */
export async function generateMetadata({
    params,
}: SeasonPageProps): Promise<Metadata> {
    const { slug } = await params;
    const parsed = parseSeasonSlug(slug);

    if (!parsed) {
        return {
            title: "Season Not Found",
            robots: { index: false, follow: false },
        };
    }

    // Fetch season data and AI content in parallel
    const [seasonResult, contentResult] = await Promise.all([
        getAnimeBySeason(parsed.season, parsed.year),
        getSeasonContent(slug),
    ]);

    if (!seasonResult.success) {
        return {
            title: "Season Not Found",
            robots: { index: false, follow: false },
        };
    }

    const { seasonInfo } = seasonResult.data;
    const content = contentResult.success ? contentResult.data : null;
    const seasonName = `${formatSeasonName(seasonInfo.season)} ${
        seasonInfo.year
    }`;
    const months = SEASON_MONTHS[seasonInfo.season];
    const timeContext = getSeasonTimeContext(
        seasonInfo.season,
        seasonInfo.year
    );

    // Use AI-generated description or create a contextual fallback
    let description: string;
    if (content?.metaDescription) {
        description = content.metaDescription;
    } else {
        // Create context-aware fallback description
        if (timeContext === "future") {
            description = `Discover ${seasonInfo.animeCount} anime announced for ${seasonName} (${months}). Preview upcoming releases and plan your watchlist.`;
        } else if (timeContext === "current") {
            description = `Browse ${seasonInfo.animeCount} anime airing in ${seasonName} (${months}). See what&apos;s currently streaming and track your favorites.`;
        } else {
            description = `Explore ${seasonInfo.animeCount} anime from ${seasonName} (${months}). Discover the highlights and hidden gems from this season.`;
        }
    }

    // Build comprehensive keywords
    const keywords = [
        `${seasonName.toLowerCase()} anime`,
        `anime ${seasonInfo.year}`,
        `${formatSeasonName(seasonInfo.season).toLowerCase()} ${
            seasonInfo.year
        } anime`,
        `new anime ${months.split(" - ")[0].toLowerCase()} ${seasonInfo.year}`,
        "anime season",
        "anime schedule",
        timeContext === "future" ? "upcoming anime" : "",
        timeContext === "current" ? "currently airing anime" : "",
    ].filter(Boolean);

    return {
        title: `${seasonName} Anime - ${seasonInfo.animeCount} Titles`,
        description,
        keywords,
        openGraph: {
            title: `${seasonName} Anime | STREAMD`,
            description,
            type: "website",
            url: `${SITE_URL}/season/${slug}`,
            siteName: "STREAMD",
        },
        twitter: {
            card: "summary_large_image",
            title: `${seasonName} Anime | STREAMD`,
            description,
        },
        alternates: {
            canonical: `${SITE_URL}/season/${slug}`,
        },
    };
}

/**
 * Season detail page
 *
 * Displays anime from a specific season/year in a grid layout.
 * Server Component with enhanced SEO optimization including:
 * - AI-generated descriptions and summaries
 * - JSON-LD structured data
 * - Contextual metadata for past/current/future seasons
 */
export default async function SeasonPage({
    params,
    searchParams,
}: SeasonPageProps) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const page = resolvedSearchParams.page
        ? parseInt(resolvedSearchParams.page, 10)
        : 1;

    const parsed = parseSeasonSlug(slug);

    // Invalid slug format
    if (!parsed) {
        notFound();
    }

    // Fetch season data and AI content in parallel
    const [result, contentResult] = await Promise.all([
        getAnimeBySeason(parsed.season, parsed.year, page, 24),
        getSeasonContent(slug),
    ]);

    // Handle errors
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

    const { seasonInfo, anime } = result.data;
    const { pagination } = anime;
    const content = contentResult.success ? contentResult.data : null;
    const seasonName = `${formatSeasonName(seasonInfo.season)} ${
        seasonInfo.year
    }`;
    const timeContext = getSeasonTimeContext(
        seasonInfo.season,
        seasonInfo.year
    );
    const months = SEASON_MONTHS[seasonInfo.season];

    // Get top anime for JSON-LD (first page only)
    const topAnime = page === 1 ? anime.data.slice(0, 10) : [];

    return (
        <>
            {/* JSON-LD Structured Data */}
            <SeasonJsonLd
                seasonInfo={seasonInfo}
                content={content}
                topAnime={topAnime}
                siteUrl={SITE_URL}
            />

            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Page Header with Badge */}
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <BrowsePageHeader
                            title={seasonName}
                            description={`${months} • ${pagination.totalCount} anime`}
                            count={pagination.totalCount}
                            backText="Back"
                        />
                        <SeasonBadge timeContext={timeContext} />
                    </div>
                </div>

                {/* AI-Generated Summary Section */}
                <SeasonSummary
                    introParagraph={content?.introParagraph || null}
                    fullSummary={content?.fullSummary || null}
                    seasonName={seasonName}
                    timeContext={timeContext}
                />

                {/* Anime Grid */}
                <AnimeGrid
                    anime={anime.data}
                    emptyMessage={`No anime found for ${seasonName}`}
                />

                {/* Pagination info */}
                {pagination.totalCount > 0 && (
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        Showing {anime.data.length} of {pagination.totalCount}{" "}
                        anime
                        {pagination.totalPages > 1 && (
                            <span>
                                {" "}
                                (Page {pagination.page} of{" "}
                                {pagination.totalPages})
                            </span>
                        )}
                    </div>
                )}

                {/* Pagination controls */}
                <AnimePagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    basePath={`/season/${slug}`}
                />

                {/* Season Navigation */}
                <SeasonNavigation
                    currentSeason={seasonInfo.season}
                    currentYear={seasonInfo.year}
                />
            </div>
        </>
    );
}
