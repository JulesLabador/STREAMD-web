import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getStudioBySlug } from "@/app/actions/anime";
import { BrowsePageHeader } from "@/components/browse";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { AnimePagination } from "@/components/anime/AnimePagination";

/**
 * Page props with dynamic slug parameter and search params
 */
interface StudioPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
    params,
}: StudioPageProps): Promise<Metadata> {
    const { slug } = await params;
    const result = await getStudioBySlug(slug);

    if (!result.success) {
        return {
            title: "Studio Not Found | STREAMD",
        };
    }

    const { studio, anime } = result.data;
    const animeCount = anime.pagination.totalCount;

    return {
        title: `${studio.name} Anime | STREAMD`,
        description: `Browse ${animeCount} anime produced by ${studio.name}. Track your favorites and discover new series from this studio.`,
        openGraph: {
            title: `${studio.name} Anime | STREAMD`,
            description: `Browse ${animeCount} anime produced by ${studio.name}. Track your favorites and discover new series from this studio.`,
            type: "website",
        },
    };
}

/**
 * Studio detail page
 *
 * Displays anime produced by a specific studio in a grid layout.
 * Server Component with SEO optimization and pagination support.
 */
export default async function StudioPage({ params, searchParams }: StudioPageProps) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;

    const result = await getStudioBySlug(slug, page, 24);

    // Handle not found
    if (!result.success) {
        if (result.code === "NOT_FOUND") {
            notFound();
        }
        // For other errors, show error state
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

    const { studio, anime } = result.data;
    const { pagination } = anime;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <BrowsePageHeader
                title={studio.name}
                description={`Anime produced by ${studio.name}`}
                count={pagination.totalCount}
                backHref="/studio"
                backText="All Studios"
            />

            <AnimeGrid
                anime={anime.data}
                emptyMessage={`No anime found for ${studio.name}`}
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
                basePath={`/studio/${slug}`}
            />
        </div>
    );
}
