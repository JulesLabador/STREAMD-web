import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
    getFilteredAnimeList,
    getGenres,
    getAvailableYears,
    type AnimeFilters,
} from "@/app/actions/anime";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { AnimeFilters as AnimeFiltersComponent } from "@/components/anime/AnimeFilters";
import { AnimePagination } from "@/components/anime/AnimePagination";
import { BrowsePageHeader } from "@/components/browse";
import type { Anime } from "@/types/anime";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.streamdanime.io";

/**
 * Page props with dynamic genre parameter and search params
 */
interface BrowseGenrePageProps {
    params: Promise<{ genre: string }>;
    searchParams: Promise<{ page?: string }>;
}

/**
 * Generate static params for popular genres to enable static generation
 */
export async function generateStaticParams() {
    const result = await getGenres();
    if (!result.success) return [];

    // Generate static pages for top 20 genres by count
    return result.data
        .sort((a, b) => b.animeCount - a.animeCount)
        .slice(0, 20)
        .map((genre) => ({ genre: genre.slug }));
}

/**
 * Generates JSON-LD structured data for the genre browse page
 */
function generateJsonLd(
    animeList: Anime[],
    genreName: string,
    totalCount: number,
    canonicalUrl: string
) {
    const itemListElements = animeList.slice(0, 10).map((anime, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
            "@type": "TVSeries",
            name: anime.titles?.english || anime.titles?.romaji || "Unknown",
            url: `${SITE_URL}/anime/${anime.shortId}/${anime.slug}`,
            image: anime.coverImageUrl,
            description: anime.synopsis
                ? anime.synopsis.replace(/<[^>]*>/g, "").slice(0, 200)
                : undefined,
            aggregateRating: anime.averageRating
                ? {
                      "@type": "AggregateRating",
                      ratingValue: anime.averageRating / 10,
                      bestRating: 10,
                      worstRating: 0,
                      ratingCount: anime.popularity || 1,
                  }
                : undefined,
        },
    }));

    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": canonicalUrl,
                url: canonicalUrl,
                name: `${genreName} Anime | STREAMD`,
                description: `Browse ${totalCount.toLocaleString()} ${genreName} anime series. Discover the best ${genreName.toLowerCase()} shows and movies.`,
                isPartOf: {
                    "@type": "WebSite",
                    "@id": `${SITE_URL}/#website`,
                    url: SITE_URL,
                    name: "STREAMD",
                },
                breadcrumb: {
                    "@type": "BreadcrumbList",
                    itemListElement: [
                        {
                            "@type": "ListItem",
                            position: 1,
                            name: "Home",
                            item: SITE_URL,
                        },
                        {
                            "@type": "ListItem",
                            position: 2,
                            name: "Browse",
                            item: `${SITE_URL}/browse`,
                        },
                        {
                            "@type": "ListItem",
                            position: 3,
                            name: `${genreName} Anime`,
                            item: canonicalUrl,
                        },
                    ],
                },
            },
            {
                "@type": "ItemList",
                name: `${genreName} Anime`,
                description: `Top ${genreName} anime series and movies`,
                numberOfItems: totalCount,
                itemListElement: itemListElements,
            },
        ],
    };
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
    params,
}: BrowseGenrePageProps): Promise<Metadata> {
    const { genre: genreSlug } = await params;

    // Fetch genres to get the display name
    const genresResult = await getGenres();
    if (!genresResult.success) {
        return { title: "Genre Not Found | STREAMD" };
    }

    const genre = genresResult.data.find((g) => g.slug === genreSlug);
    if (!genre) {
        return { title: "Genre Not Found | STREAMD" };
    }

    // Fetch anime count
    const filters: AnimeFilters = { genres: [genreSlug] };
    const animeResult = await getFilteredAnimeList(filters, 1, 1);
    const totalCount = animeResult.success
        ? animeResult.data.pagination.totalCount
        : 0;

    const title = `${genre.name} Anime | STREAMD`;
    const description = `Browse ${totalCount.toLocaleString()} ${
        genre.name
    } anime series. Discover the best ${genre.name.toLowerCase()} shows, movies, and OVAs. Track your favorites on STREAMD.`;
    const canonicalUrl = `${SITE_URL}/browse/genre/${genreSlug}`;

    return {
        title,
        description,
        keywords: [
            `${genre.name} anime`,
            `best ${genre.name.toLowerCase()} anime`,
            `${genre.name.toLowerCase()} anime list`,
            `${genre.name.toLowerCase()} anime series`,
            "anime streaming",
            "anime tracker",
        ],
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        alternates: {
            canonical: canonicalUrl,
        },
    };
}

/**
 * Loading skeleton for the anime grid
 */
function AnimeGridSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="aspect-3/4 animate-pulse rounded-lg bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
            ))}
        </div>
    );
}

/**
 * Browse genre page content component
 */
async function BrowseGenreContent({
    params,
    searchParams,
}: BrowseGenrePageProps) {
    const { genre: genreSlug } = await params;
    const resolvedSearchParams = await searchParams;
    const page = resolvedSearchParams.page
        ? parseInt(resolvedSearchParams.page, 10)
        : 1;

    // Fetch all data in parallel
    const [genresResult, yearsResult, animeResult] = await Promise.all([
        getGenres(),
        getAvailableYears(),
        getFilteredAnimeList({ genres: [genreSlug] }, page, 24),
    ]);

    // Handle genre not found
    if (!genresResult.success) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-foreground">
                        Something went wrong
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Failed to load genre data
                    </p>
                </div>
            </div>
        );
    }

    const genre = genresResult.data.find((g) => g.slug === genreSlug);
    if (!genre) {
        notFound();
    }

    if (!yearsResult.success || !animeResult.success) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-foreground">
                        Something went wrong
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Failed to load anime data
                    </p>
                </div>
            </div>
        );
    }

    const genres = genresResult.data;
    const years = yearsResult.data;
    const { data: animeList, pagination } = animeResult.data;

    // Current filters for the filter component
    const currentFilters = {
        genres: [genreSlug],
        years: [] as string[],
        seasons: [] as string[],
        formats: [] as string[],
        statuses: [] as string[],
        search: null,
    };

    // Generate JSON-LD
    const canonicalUrl = `${SITE_URL}/browse/genre/${genreSlug}`;
    const jsonLd = generateJsonLd(
        animeList,
        genre.name,
        pagination.totalCount,
        canonicalUrl
    );

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Page header */}
            <BrowsePageHeader
                title={`${genre.name} Anime`}
                description={`Discover the best ${genre.name.toLowerCase()} anime series, movies, and OVAs`}
                count={pagination.totalCount}
                backText="Back"
            />

            {/* Filters - pre-selected with current genre */}
            <div className="mb-8">
                <AnimeFiltersComponent
                    genres={genres}
                    years={years}
                    currentFilters={currentFilters}
                />
            </div>

            {/* Anime grid */}
            <AnimeGrid
                anime={animeList}
                emptyMessage={`No ${genre.name} anime found`}
            />

            {/* Pagination info */}
            {pagination.totalCount > 0 && (
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    Showing {animeList.length} of{" "}
                    {pagination.totalCount.toLocaleString()} anime
                    {pagination.totalPages > 1 && (
                        <span>
                            {" "}
                            (Page {pagination.page} of {pagination.totalPages})
                        </span>
                    )}
                </div>
            )}

            {/* Pagination controls */}
            <AnimePagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                basePath={`/browse/genre/${genreSlug}`}
            />
        </>
    );
}

/**
 * Browse by Genre page
 *
 * Pre-built landing page for browsing anime by a specific genre.
 * Provides clean URLs like /browse/genre/action for better SEO.
 * Uses the same filter infrastructure as the main browse page.
 */
export default async function BrowseGenrePage(props: BrowseGenrePageProps) {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Suspense fallback={<AnimeGridSkeleton />}>
                <BrowseGenreContent {...props} />
            </Suspense>
        </div>
    );
}
