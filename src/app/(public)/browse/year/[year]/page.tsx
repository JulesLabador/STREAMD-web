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
 * Page props with dynamic year parameter and search params
 */
interface BrowseYearPageProps {
    params: Promise<{ year: string }>;
    searchParams: Promise<{ page?: string }>;
}

/**
 * Generate static params for recent years to enable static generation
 */
export async function generateStaticParams() {
    const result = await getAvailableYears();
    if (!result.success) return [];

    // Generate static pages for the last 15 years
    const currentYear = new Date().getFullYear();
    return result.data
        .filter((year) => year >= currentYear - 15)
        .map((year) => ({ year: year.toString() }));
}

/**
 * Generates JSON-LD structured data for the year browse page
 */
function generateJsonLd(
    animeList: Anime[],
    year: number,
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
            image: anime.coverImage?.extraLarge || anime.coverImage?.large,
            description: anime.description
                ? anime.description.replace(/<[^>]*>/g, "").slice(0, 200)
                : undefined,
            datePublished: anime.startDate
                ? `${anime.startDate.year}-${String(
                      anime.startDate.month || 1
                  ).padStart(2, "0")}-${String(anime.startDate.day || 1).padStart(
                      2,
                      "0"
                  )}`
                : undefined,
            aggregateRating: anime.averageScore
                ? {
                      "@type": "AggregateRating",
                      ratingValue: anime.averageScore / 10,
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
                name: `${year} Anime | STREAMD`,
                description: `Browse ${totalCount.toLocaleString()} anime from ${year}. Discover the best shows and movies released in ${year}.`,
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
                            name: `${year} Anime`,
                            item: canonicalUrl,
                        },
                    ],
                },
            },
            {
                "@type": "ItemList",
                name: `${year} Anime`,
                description: `Anime series and movies from ${year}`,
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
}: BrowseYearPageProps): Promise<Metadata> {
    const { year: yearStr } = await params;
    const year = parseInt(yearStr, 10);

    if (isNaN(year) || year < 1900 || year > 2100) {
        return { title: "Year Not Found | STREAMD" };
    }

    // Fetch anime count
    const filters: AnimeFilters = { years: [year] };
    const animeResult = await getFilteredAnimeList(filters, 1, 1);
    const totalCount = animeResult.success
        ? animeResult.data.pagination.totalCount
        : 0;

    const currentYear = new Date().getFullYear();
    const yearDescription =
        year === currentYear
            ? "this year"
            : year === currentYear - 1
            ? "last year"
            : `in ${year}`;

    const title = `${year} Anime | STREAMD`;
    const description = `Browse ${totalCount.toLocaleString()} anime released ${yearDescription}. Discover the best shows, movies, and OVAs from ${year}. Track your favorites on STREAMD.`;
    const canonicalUrl = `${SITE_URL}/browse/year/${year}`;

    return {
        title,
        description,
        keywords: [
            `${year} anime`,
            `anime ${year}`,
            `best anime ${year}`,
            `new anime ${year}`,
            `anime released ${year}`,
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
 * Browse year page content component
 */
async function BrowseYearContent({
    params,
    searchParams,
}: BrowseYearPageProps) {
    const { year: yearStr } = await params;
    const resolvedSearchParams = await searchParams;
    const page = resolvedSearchParams.page
        ? parseInt(resolvedSearchParams.page, 10)
        : 1;

    const year = parseInt(yearStr, 10);

    // Validate year
    if (isNaN(year) || year < 1900 || year > 2100) {
        notFound();
    }

    // Fetch all data in parallel
    const [genresResult, yearsResult, animeResult] = await Promise.all([
        getGenres(),
        getAvailableYears(),
        getFilteredAnimeList({ years: [year] }, page, 24),
    ]);

    // Check if year exists in available years
    if (!yearsResult.success || !yearsResult.data.includes(year)) {
        notFound();
    }

    if (!genresResult.success || !animeResult.success) {
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
        genres: [] as string[],
        years: [yearStr],
        seasons: [] as string[],
        formats: [] as string[],
        statuses: [] as string[],
        search: null,
    };

    // Generate JSON-LD
    const canonicalUrl = `${SITE_URL}/browse/year/${year}`;
    const jsonLd = generateJsonLd(
        animeList,
        year,
        pagination.totalCount,
        canonicalUrl
    );

    const currentYear = new Date().getFullYear();
    const yearLabel =
        year === currentYear
            ? `${year} (This Year)`
            : year === currentYear - 1
            ? `${year} (Last Year)`
            : year.toString();

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Page header */}
            <BrowsePageHeader
                title={`${yearLabel} Anime`}
                description={`Discover anime series and movies released in ${year}`}
                count={pagination.totalCount}
                backHref="/browse"
                backText="All Anime"
            />

            {/* Filters - pre-selected with current year */}
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
                emptyMessage={`No anime found from ${year}`}
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
                basePath={`/browse/year/${year}`}
            />
        </>
    );
}

/**
 * Browse by Year page
 *
 * Pre-built landing page for browsing anime by a specific year.
 * Provides clean URLs like /browse/year/2024 for better SEO.
 * Uses the same filter infrastructure as the main browse page.
 */
export default async function BrowseYearPage(props: BrowseYearPageProps) {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Suspense fallback={<AnimeGridSkeleton />}>
                <BrowseYearContent {...props} />
            </Suspense>
        </div>
    );
}

