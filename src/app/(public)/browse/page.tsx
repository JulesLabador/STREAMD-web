import { Metadata } from "next";
import { Suspense } from "react";
import {
    getFilteredAnimeList,
    getGenres,
    getAvailableYears,
    type AnimeFilters,
} from "@/app/actions/anime";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { AnimeFilters as AnimeFiltersComponent } from "@/components/anime/AnimeFilters";
import { AnimePagination } from "@/components/anime/AnimePagination";
import { BrowsePageHeader, PopularCategories } from "@/components/browse";
import type { AnimeSeason, AnimeFormat, AnimeStatus, Anime } from "@/types/anime";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.streamdanime.io";

/**
 * Page props with search params
 */
interface BrowsePageProps {
    searchParams: Promise<{
        genres?: string | string[];
        years?: string | string[];
        seasons?: string | string[];
        formats?: string | string[];
        statuses?: string | string[];
        search?: string;
        page?: string;
    }>;
}

/**
 * Season display names for metadata
 */
const SEASON_NAMES: Record<string, string> = {
    WINTER: "Winter",
    SPRING: "Spring",
    SUMMER: "Summer",
    FALL: "Fall",
};

/**
 * Format display names for metadata
 */
const FORMAT_NAMES: Record<string, string> = {
    TV: "TV",
    MOVIE: "Movie",
    OVA: "OVA",
    ONA: "ONA",
    SPECIAL: "Special",
    MUSIC: "Music",
};

/**
 * Status display names for metadata
 */
const STATUS_NAMES: Record<string, string> = {
    RELEASING: "Airing",
    FINISHED: "Finished",
    NOT_YET_RELEASED: "Upcoming",
    HIATUS: "On Hiatus",
    CANCELLED: "Cancelled",
};

/**
 * Helper to parse array params from URL (handles both single string and array)
 */
function parseArrayParam(param: string | string[] | undefined): string[] {
    if (!param) return [];
    return Array.isArray(param) ? param : [param];
}

/**
 * Generates a dynamic page title based on active filters
 * Creates SEO-friendly titles like "Action TV Anime from Winter 2024"
 */
function generatePageTitle(
    filters: AnimeFilters,
    genreNames: string[]
): string {
    const parts: string[] = [];

    // Add genre names (up to 2 for readability)
    if (genreNames.length > 0) {
        if (genreNames.length <= 2) {
            parts.push(genreNames.join(" & "));
        } else {
            parts.push(`${genreNames[0]} & ${genreNames.length - 1} more`);
        }
    }

    // Add format(s)
    if (filters.formats && filters.formats.length > 0) {
        if (filters.formats.length === 1) {
            parts.push(FORMAT_NAMES[filters.formats[0]] || filters.formats[0]);
        } else {
            parts.push(`${filters.formats.length} Formats`);
        }
    }

    // Add "Anime" if we have any filters
    if (
        parts.length > 0 ||
        (filters.seasons && filters.seasons.length > 0) ||
        (filters.years && filters.years.length > 0) ||
        (filters.statuses && filters.statuses.length > 0)
    ) {
        parts.push("Anime");
    }

    // Add season and year
    if (
        filters.seasons &&
        filters.seasons.length > 0 &&
        filters.years &&
        filters.years.length > 0
    ) {
        if (filters.seasons.length === 1 && filters.years.length === 1) {
            parts.push(
                `from ${
                    SEASON_NAMES[filters.seasons[0]] || filters.seasons[0]
                } ${filters.years[0]}`
            );
        } else {
            parts.push(`from ${filters.years.length} Year(s)`);
        }
    } else if (filters.years && filters.years.length > 0) {
        if (filters.years.length === 1) {
            parts.push(`from ${filters.years[0]}`);
        } else {
            parts.push(`from ${filters.years.length} Years`);
        }
    } else if (filters.seasons && filters.seasons.length > 0) {
        if (filters.seasons.length === 1) {
            parts.push(
                `- ${SEASON_NAMES[filters.seasons[0]] || filters.seasons[0]}`
            );
        } else {
            parts.push(`- ${filters.seasons.length} Seasons`);
        }
    }

    // Add status
    if (filters.statuses && filters.statuses.length > 0) {
        if (filters.statuses.length === 1) {
            const statusName =
                STATUS_NAMES[filters.statuses[0]] || filters.statuses[0];
            if (filters.statuses[0] === "RELEASING") {
                parts.push("- Currently Airing");
            } else if (filters.statuses[0] === "NOT_YET_RELEASED") {
                parts.push("- Upcoming");
            } else {
                parts.push(`- ${statusName}`);
            }
        } else {
            parts.push(`- ${filters.statuses.length} Statuses`);
        }
    }

    // Add search term
    if (filters.search) {
        return `Search: "${filters.search}" | STREAMD`;
    }

    // Default title if no filters
    if (parts.length === 0) {
        return "Browse Anime | STREAMD";
    }

    return `${parts.join(" ")} | STREAMD`;
}

/**
 * Generates a dynamic page description based on active filters
 */
function generatePageDescription(
    filters: AnimeFilters,
    genreNames: string[],
    totalCount: number
): string {
    const parts: string[] = [];

    parts.push(`Browse ${totalCount.toLocaleString()}`);

    // Add genre names
    if (genreNames.length > 0) {
        if (genreNames.length <= 2) {
            parts.push(genreNames.join(" and ").toLowerCase());
        } else {
            parts.push(
                `${genreNames[0].toLowerCase()} and ${
                    genreNames.length - 1
                } more genres`
            );
        }
    }

    // Add format
    if (filters.formats && filters.formats.length > 0) {
        if (filters.formats.length === 1) {
            parts.push(
                (
                    FORMAT_NAMES[filters.formats[0]] || filters.formats[0]
                ).toLowerCase()
            );
        } else {
            parts.push("various format");
        }
    }

    parts.push("anime");

    // Add season and year
    if (
        filters.seasons &&
        filters.seasons.length > 0 &&
        filters.years &&
        filters.years.length > 0
    ) {
        if (filters.seasons.length === 1 && filters.years.length === 1) {
            parts.push(
                `from ${
                    SEASON_NAMES[filters.seasons[0]] || filters.seasons[0]
                } ${filters.years[0]}`
            );
        }
    } else if (filters.years && filters.years.length > 0) {
        if (filters.years.length === 1) {
            parts.push(`from ${filters.years[0]}`);
        }
    }

    // Add status
    if (filters.statuses && filters.statuses.length > 0) {
        if (filters.statuses.length === 1) {
            const statusName =
                STATUS_NAMES[filters.statuses[0]] || filters.statuses[0];
            if (filters.statuses[0] === "RELEASING") {
                parts.push("that are currently airing");
            } else if (filters.statuses[0] === "NOT_YET_RELEASED") {
                parts.push("coming soon");
            } else {
                parts.push(`with status: ${statusName.toLowerCase()}`);
            }
        }
    }

    parts.push(
        ". Discover trending series and track your favorites on STREAMD."
    );

    return parts.join(" ");
}

/**
 * Builds canonical URL with consistent parameter ordering
 */
function buildCanonicalUrl(filters: AnimeFilters, page: number): string {
    const params = new URLSearchParams();

    // Add params in consistent order for canonical URLs
    if (filters.genres && filters.genres.length > 0) {
        filters.genres.sort().forEach((g) => params.append("genres", g));
    }
    if (filters.years && filters.years.length > 0) {
        filters.years
            .sort((a, b) => b - a)
            .forEach((y) => params.append("years", y.toString()));
    }
    if (filters.seasons && filters.seasons.length > 0) {
        filters.seasons.sort().forEach((s) => params.append("seasons", s));
    }
    if (filters.formats && filters.formats.length > 0) {
        filters.formats.sort().forEach((f) => params.append("formats", f));
    }
    if (filters.statuses && filters.statuses.length > 0) {
        filters.statuses.sort().forEach((s) => params.append("statuses", s));
    }
    if (filters.search) params.set("search", filters.search);
    if (page > 1) params.set("page", page.toString());

    const queryString = params.toString();
    return queryString
        ? `${SITE_URL}/browse?${queryString}`
        : `${SITE_URL}/browse`;
}

/**
 * Generates JSON-LD structured data for the browse page
 * Includes ItemList schema for search results and WebPage schema
 */
function generateJsonLd(
    animeList: Anime[],
    filters: AnimeFilters,
    genreNames: string[],
    totalCount: number,
    canonicalUrl: string,
    pageTitle: string,
    pageDescription: string
) {
    // Generate breadcrumb items based on active filters
    const breadcrumbItems = [
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
    ];

    // Add filter-specific breadcrumb if applicable
    if (genreNames.length === 1) {
        breadcrumbItems.push({
            "@type": "ListItem",
            position: 3,
            name: `${genreNames[0]} Anime`,
            item: canonicalUrl,
        });
    } else if (filters.years && filters.years.length === 1) {
        breadcrumbItems.push({
            "@type": "ListItem",
            position: 3,
            name: `${filters.years[0]} Anime`,
            item: canonicalUrl,
        });
    }

    // Generate ItemList for anime results
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
            // WebPage schema
            {
                "@type": "WebPage",
                "@id": canonicalUrl,
                url: canonicalUrl,
                name: pageTitle,
                description: pageDescription,
                isPartOf: {
                    "@type": "WebSite",
                    "@id": `${SITE_URL}/#website`,
                    url: SITE_URL,
                    name: "STREAMD",
                },
                breadcrumb: {
                    "@type": "BreadcrumbList",
                    itemListElement: breadcrumbItems,
                },
            },
            // ItemList schema for search results
            {
                "@type": "ItemList",
                name: pageTitle,
                description: pageDescription,
                numberOfItems: totalCount,
                itemListElement: itemListElements,
            },
            // CollectionPage schema for better categorization
            {
                "@type": "CollectionPage",
                "@id": `${canonicalUrl}#collection`,
                url: canonicalUrl,
                name: pageTitle,
                description: pageDescription,
                mainEntity: {
                    "@type": "ItemList",
                    numberOfItems: totalCount,
                },
            },
        ],
    };
}

/**
 * Component to render JSON-LD structured data
 */
function JsonLdScript({ data }: { data: object }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

/**
 * Generates SEO keywords based on active filters
 * Creates relevant keyword combinations for search engines
 */
function generateKeywords(
    filters: AnimeFilters,
    genreNames: string[]
): string[] {
    const keywords: string[] = [
        "anime",
        "anime streaming",
        "anime tracker",
        "watch anime",
    ];

    // Add genre-specific keywords
    if (genreNames.length > 0) {
        for (const genre of genreNames) {
            keywords.push(`${genre.toLowerCase()} anime`);
            keywords.push(`best ${genre.toLowerCase()} anime`);
            keywords.push(`${genre.toLowerCase()} anime list`);
        }
    }

    // Add year-specific keywords
    if (filters.years && filters.years.length > 0) {
        for (const year of filters.years) {
            keywords.push(`${year} anime`);
            keywords.push(`anime ${year}`);
            keywords.push(`best anime ${year}`);
            keywords.push(`new anime ${year}`);
        }

        // Combine genre + year
        if (genreNames.length > 0) {
            for (const genre of genreNames.slice(0, 2)) {
                for (const year of filters.years.slice(0, 2)) {
                    keywords.push(`${genre.toLowerCase()} anime ${year}`);
                }
            }
        }
    }

    // Add season-specific keywords
    if (filters.seasons && filters.seasons.length > 0) {
        for (const season of filters.seasons) {
            const seasonName = SEASON_NAMES[season]?.toLowerCase() || season.toLowerCase();
            keywords.push(`${seasonName} anime`);
            keywords.push(`${seasonName} season anime`);

            // Combine season + year
            if (filters.years && filters.years.length > 0) {
                for (const year of filters.years.slice(0, 2)) {
                    keywords.push(`${seasonName} ${year} anime`);
                }
            }
        }
    }

    // Add format-specific keywords
    if (filters.formats && filters.formats.length > 0) {
        for (const format of filters.formats) {
            const formatName = FORMAT_NAMES[format]?.toLowerCase() || format.toLowerCase();
            keywords.push(`anime ${formatName}`);
            if (format === "MOVIE") {
                keywords.push("anime movies");
                keywords.push("best anime movies");
            } else if (format === "TV") {
                keywords.push("anime series");
                keywords.push("anime tv shows");
            }
        }
    }

    // Add status-specific keywords
    if (filters.statuses && filters.statuses.length > 0) {
        for (const status of filters.statuses) {
            if (status === "RELEASING") {
                keywords.push("currently airing anime");
                keywords.push("ongoing anime");
                keywords.push("airing anime");
            } else if (status === "NOT_YET_RELEASED") {
                keywords.push("upcoming anime");
                keywords.push("new anime releases");
            } else if (status === "FINISHED") {
                keywords.push("completed anime");
                keywords.push("finished anime");
            }
        }
    }

    // Remove duplicates and limit to 15 keywords
    return [...new Set(keywords)].slice(0, 15);
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
    searchParams,
}: BrowsePageProps): Promise<Metadata> {
    const params = await searchParams;

    // Parse filters from search params
    const genreSlugs = parseArrayParam(params.genres);
    const yearStrings = parseArrayParam(params.years);
    const seasonStrings = parseArrayParam(params.seasons);
    const formatStrings = parseArrayParam(params.formats);
    const statusStrings = parseArrayParam(params.statuses);

    const filters: AnimeFilters = {
        genres: genreSlugs,
        years: yearStrings.map((y) => parseInt(y, 10)).filter((y) => !isNaN(y)),
        seasons: seasonStrings as AnimeSeason[],
        formats: formatStrings as AnimeFormat[],
        statuses: statusStrings as AnimeStatus[],
        search: params.search,
    };

    const page = params.page ? parseInt(params.page, 10) : 1;

    // Fetch data for metadata
    const [genresResult, animeResult] = await Promise.all([
        getGenres(),
        getFilteredAnimeList(filters, page, 24),
    ]);

    // Get genre names for display
    const genreNames =
        genresResult.success && filters.genres
            ? filters.genres
                  .map(
                      (slug) =>
                          genresResult.data.find((g) => g.slug === slug)?.name
                  )
                  .filter((name): name is string => !!name)
            : [];

    const totalCount = animeResult.success
        ? animeResult.data.pagination.totalCount
        : 0;

    const title = generatePageTitle(filters, genreNames);
    const description = generatePageDescription(
        filters,
        genreNames,
        totalCount
    );
    const canonicalUrl = buildCanonicalUrl(filters, page);
    const keywords = generateKeywords(filters, genreNames);

    return {
        title,
        description,
        keywords,
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: "website",
            siteName: "STREAMD",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            site: "@streamdanime",
        },
        alternates: {
            canonical: canonicalUrl,
        },
        // Prevent indexing of search results
        ...(filters.search && {
            robots: {
                index: false,
                follow: true,
            },
        }),
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
 * Browse page content component
 * Separated for Suspense boundary
 */
async function BrowseContent({
    searchParams,
}: {
    searchParams: BrowsePageProps["searchParams"];
}) {
    const params = await searchParams;

    // Parse filters from search params
    const genreSlugs = parseArrayParam(params.genres);
    const yearStrings = parseArrayParam(params.years);
    const seasonStrings = parseArrayParam(params.seasons);
    const formatStrings = parseArrayParam(params.formats);
    const statusStrings = parseArrayParam(params.statuses);

    const filters: AnimeFilters = {
        genres: genreSlugs,
        years: yearStrings.map((y) => parseInt(y, 10)).filter((y) => !isNaN(y)),
        seasons: seasonStrings as AnimeSeason[],
        formats: formatStrings as AnimeFormat[],
        statuses: statusStrings as AnimeStatus[],
        search: params.search,
    };

    const page = params.page ? parseInt(params.page, 10) : 1;

    // Fetch all data in parallel
    const [genresResult, yearsResult, animeResult] = await Promise.all([
        getGenres(),
        getAvailableYears(),
        getFilteredAnimeList(filters, page, 24),
    ]);

    // Handle errors
    if (!genresResult.success || !yearsResult.success) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-foreground">
                        Something went wrong
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Failed to load filter options
                    </p>
                </div>
            </div>
        );
    }

    if (!animeResult.success) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-foreground">
                        Something went wrong
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        {animeResult.error}
                    </p>
                </div>
            </div>
        );
    }

    const genres = genresResult.data;
    const years = yearsResult.data;
    const { data: animeList, pagination } = animeResult.data;

    // Prepare current filters for the component (as strings for URL params)
    const currentFilters = {
        genres: genreSlugs,
        years: yearStrings,
        seasons: seasonStrings,
        formats: formatStrings,
        statuses: statusStrings,
        search: params.search || null,
    };

    // Generate page title for header
    const genreNames = filters.genres
        ? filters.genres
              .map((slug) => genres.find((g) => g.slug === slug)?.name)
              .filter((name): name is string => !!name)
        : [];

    // Determine header title based on filters
    let headerTitle = "Browse Anime";
    if (filters.search) {
        headerTitle = `Search Results for "${filters.search}"`;
    } else if (
        genreNames.length > 0 ||
        (filters.formats && filters.formats.length > 0) ||
        (filters.seasons && filters.seasons.length > 0) ||
        (filters.years && filters.years.length > 0)
    ) {
        const titleParts: string[] = [];
        if (genreNames.length > 0) {
            titleParts.push(genreNames.slice(0, 2).join(" & "));
        }
        if (filters.formats && filters.formats.length > 0) {
            if (filters.formats.length === 1) {
                titleParts.push(
                    FORMAT_NAMES[filters.formats[0]] || filters.formats[0]
                );
            }
        }
        titleParts.push("Anime");
        if (
            filters.seasons &&
            filters.seasons.length > 0 &&
            filters.years &&
            filters.years.length > 0
        ) {
            if (filters.seasons.length === 1 && filters.years.length === 1) {
                titleParts.push(
                    `- ${
                        SEASON_NAMES[filters.seasons[0]] || filters.seasons[0]
                    } ${filters.years[0]}`
                );
            }
        } else if (filters.years && filters.years.length > 0) {
            if (filters.years.length === 1) {
                titleParts.push(`- ${filters.years[0]}`);
            } else {
                titleParts.push(`- ${filters.years.length} Years`);
            }
        }
        headerTitle = titleParts.join(" ");
    }

    // Generate canonical URL and metadata for JSON-LD
    const canonicalUrl = buildCanonicalUrl(filters, page);
    const pageTitle = generatePageTitle(filters, genreNames);
    const pageDescription = generatePageDescription(
        filters,
        genreNames,
        pagination.totalCount
    );

    // Generate JSON-LD structured data
    const jsonLd = generateJsonLd(
        animeList,
        filters,
        genreNames,
        pagination.totalCount,
        canonicalUrl,
        pageTitle,
        pageDescription
    );

    // Check if any filters are active
    const hasActiveFilters =
        (filters.genres && filters.genres.length > 0) ||
        (filters.years && filters.years.length > 0) ||
        (filters.seasons && filters.seasons.length > 0) ||
        (filters.formats && filters.formats.length > 0) ||
        (filters.statuses && filters.statuses.length > 0) ||
        filters.search;

    return (
        <>
            {/* JSON-LD Structured Data */}
            <JsonLdScript data={jsonLd} />

            {/* Page header */}
            <BrowsePageHeader
                title={headerTitle}
                description="Discover and filter anime by genre, year, season, format, and more"
                count={pagination.totalCount}
            />

            {/* Popular Categories - only show when no filters are active */}
            {!hasActiveFilters && (
                <PopularCategories genres={genres} years={years} />
            )}

            {/* Filters */}
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
                emptyMessage="No anime found matching your filters"
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
                basePath="/browse"
                searchParams={params}
            />
        </>
    );
}

/**
 * Browse page - Filter and discover anime
 *
 * Server Component that reads URL search params to filter anime.
 * Supports filtering by:
 * - Genres (multiple, AND logic)
 * - Years (multiple, OR logic)
 * - Seasons (multiple, OR logic - Winter, Spring, Summer, Fall)
 * - Formats (multiple, OR logic - TV, Movie, OVA, ONA, Special, Music)
 * - Statuses (multiple, OR logic - Airing, Finished, Upcoming, etc.)
 * - Text search
 *
 * Generates dynamic SEO metadata based on active filters.
 */
export default async function BrowsePage({ searchParams }: BrowsePageProps) {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Suspense fallback={<AnimeGridSkeleton />}>
                <BrowseContent searchParams={searchParams} />
            </Suspense>
        </div>
    );
}
