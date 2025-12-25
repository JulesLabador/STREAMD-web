import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getStudioBySlug } from "@/app/actions/anime";
import { BrowsePageHeader } from "@/components/browse";
import { AnimeGrid } from "@/components/anime/AnimeGrid";

/**
 * Page props with dynamic slug parameter
 */
interface StudioPageProps {
    params: Promise<{ slug: string }>;
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
 * Server Component with SEO optimization.
 */
export default async function StudioPage({ params }: StudioPageProps) {
    const { slug } = await params;
    const result = await getStudioBySlug(slug);

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

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <BrowsePageHeader
                title={studio.name}
                description={`Anime produced by ${studio.name}`}
                count={anime.pagination.totalCount}
                backHref="/studio"
                backText="All Studios"
            />

            <AnimeGrid
                anime={anime.data}
                emptyMessage={`No anime found for ${studio.name}`}
            />

            {/* Pagination info */}
            {anime.pagination.totalCount > 0 && (
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    Showing {anime.data.length} of {anime.pagination.totalCount}{" "}
                    anime
                </div>
            )}
        </div>
    );
}
