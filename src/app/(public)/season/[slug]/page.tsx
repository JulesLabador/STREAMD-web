import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getAnimeBySeason } from "@/app/actions/anime";
import { parseSeasonSlug } from "@/types/anime";
import { BrowsePageHeader } from "@/components/browse";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { AnimePagination } from "@/components/anime/AnimePagination";

/**
 * Page props with dynamic slug parameter and search params
 */
interface SeasonPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

/**
 * Formats season name for display
 * @param season - Season enum value
 * @returns Formatted season name
 */
function formatSeasonName(season: string): string {
    return season.charAt(0) + season.slice(1).toLowerCase();
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
    params,
}: SeasonPageProps): Promise<Metadata> {
    const { slug } = await params;
    const parsed = parseSeasonSlug(slug);

    if (!parsed) {
        return {
            title: "Season Not Found | STREAMD",
        };
    }

    const result = await getAnimeBySeason(parsed.season, parsed.year);

    if (!result.success) {
        return {
            title: "Season Not Found | STREAMD",
        };
    }

    const { seasonInfo } = result.data;
    const seasonName = `${formatSeasonName(seasonInfo.season)} ${seasonInfo.year}`;

    return {
        title: `${seasonName} Anime | STREAMD`,
        description: `Browse ${seasonInfo.animeCount} anime from ${seasonName}. Discover what aired during this season and track your favorites.`,
        openGraph: {
            title: `${seasonName} Anime | STREAMD`,
            description: `Browse ${seasonInfo.animeCount} anime from ${seasonName}. Discover what aired during this season and track your favorites.`,
            type: "website",
        },
    };
}

/**
 * Season detail page
 *
 * Displays anime from a specific season/year in a grid layout.
 * Server Component with SEO optimization and pagination support.
 */
export default async function SeasonPage({ params, searchParams }: SeasonPageProps) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;

    const parsed = parseSeasonSlug(slug);

    // Invalid slug format
    if (!parsed) {
        notFound();
    }

    const result = await getAnimeBySeason(parsed.season, parsed.year, page, 24);

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
    const seasonName = `${formatSeasonName(seasonInfo.season)} ${seasonInfo.year}`;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <BrowsePageHeader
                title={seasonName}
                description={`Anime that aired in ${seasonName}`}
                count={pagination.totalCount}
                backText="Back"
            />

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
                            (Page {pagination.page} of {pagination.totalPages})
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
        </div>
    );
}
