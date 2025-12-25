import { getAnimeList } from "@/app/actions/anime";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { InlineSearch } from "@/components/search";

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
                    Showing {animeList.length} of {pagination.totalCount} anime
                </div>
            )}
        </div>
    );
}
