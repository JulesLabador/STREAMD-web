import { Metadata } from "next";
import { Tag } from "lucide-react";
import { getGenres } from "@/app/actions/anime";
import { BrowsePageHeader, BrowseGrid, BrowseCard } from "@/components/browse";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.streamdanime.io";

/**
 * Static metadata for the genres index page
 */
export const metadata: Metadata = {
    title: "Anime Genres",
    description:
        "Browse anime by genre. Discover Action, Romance, Comedy, Drama, Fantasy, Sci-Fi, and more anime genres.",
    openGraph: {
        title: "Anime Genres | STREAMD",
        description:
            "Browse anime by genre. Discover Action, Romance, Comedy, Drama, Fantasy, Sci-Fi, and more anime genres.",
        type: "website",
    },
    alternates: {
        canonical: `${SITE_URL}/genre`,
    },
};

/**
 * Genres index page
 *
 * Displays a grid of all genres with anime counts.
 * Server Component that fetches genres data.
 */
export default async function GenresPage() {
    const result = await getGenres();

    // Handle error state
    if (!result.success) {
        return (
            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <BrowsePageHeader
                    title="Anime Genres"
                    description="Browse anime by genre"
                />
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

    const genres = result.data;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <BrowsePageHeader
                title="Anime Genres"
                description="Browse anime by genre"
                count={genres.length}
                countLabel="genres"
            />

            <BrowseGrid
                isEmpty={genres.length === 0}
                emptyMessage="No genres found"
            >
                {genres.map((genre) => (
                    <BrowseCard
                        key={genre.id}
                        name={genre.name}
                        href={`/genre/${genre.slug}`}
                        count={genre.animeCount}
                        icon={<Tag className="h-5 w-5" />}
                    />
                ))}
            </BrowseGrid>
        </div>
    );
}
