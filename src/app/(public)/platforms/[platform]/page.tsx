import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getAnimeByPlatform } from "@/app/actions/anime";
import { parsePlatformSlug } from "@/types/anime";
import { BrowsePageHeader } from "@/components/browse";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { AnimePagination } from "@/components/anime/AnimePagination";

/**
 * Page props with dynamic platform parameter and search params
 */
interface PlatformPageProps {
    params: Promise<{ platform: string }>;
    searchParams: Promise<{ page?: string }>;
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
    params,
}: PlatformPageProps): Promise<Metadata> {
    const { platform: platformSlug } = await params;
    const platform = parsePlatformSlug(platformSlug);

    if (!platform) {
        return {
            title: "Platform Not Found | STREAMD",
        };
    }

    const result = await getAnimeByPlatform(platform);

    if (!result.success) {
        return {
            title: "Platform Not Found | STREAMD",
        };
    }

    const { platformInfo } = result.data;

    return {
        title: `Anime on ${platformInfo.name} | STREAMD`,
        description: `Browse ${platformInfo.animeCount} anime available on ${platformInfo.name}. Find what to watch and track your favorites.`,
        openGraph: {
            title: `Anime on ${platformInfo.name} | STREAMD`,
            description: `Browse ${platformInfo.animeCount} anime available on ${platformInfo.name}. Find what to watch and track your favorites.`,
            type: "website",
        },
    };
}

/**
 * Platform detail page
 *
 * Displays anime available on a specific streaming platform.
 * Server Component with SEO optimization and pagination support.
 */
export default async function PlatformPage({ params, searchParams }: PlatformPageProps) {
    const { platform: platformSlug } = await params;
    const resolvedSearchParams = await searchParams;
    const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;

    const platform = parsePlatformSlug(platformSlug);

    // Invalid platform slug
    if (!platform) {
        notFound();
    }

    const result = await getAnimeByPlatform(platform, page, 24);

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

    const { platformInfo, anime } = result.data;
    const { pagination } = anime;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <BrowsePageHeader
                title={platformInfo.name}
                description={`Anime available on ${platformInfo.name}`}
                count={pagination.totalCount}
                backText="Back"
            />

            <AnimeGrid
                anime={anime.data}
                emptyMessage={`No anime found on ${platformInfo.name}`}
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
                basePath={`/platforms/${platformSlug}`}
            />
        </div>
    );
}
