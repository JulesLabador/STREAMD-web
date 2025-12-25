import { Metadata } from "next";
import { Building2 } from "lucide-react";
import { getStudios } from "@/app/actions/anime";
import { BrowsePageHeader, BrowseGrid, BrowseCard } from "@/components/browse";

/**
 * Static metadata for the studios index page
 */
export const metadata: Metadata = {
    title: "Animation Studios | STREAMD",
    description:
        "Browse anime by animation studio. Discover anime from MAPPA, Wit Studio, Bones, Kyoto Animation, and more.",
    openGraph: {
        title: "Animation Studios | STREAMD",
        description:
            "Browse anime by animation studio. Discover anime from MAPPA, Wit Studio, Bones, Kyoto Animation, and more.",
        type: "website",
    },
};

/**
 * Studios index page
 *
 * Displays a grid of all animation studios with anime counts.
 * Server Component that fetches studios data.
 */
export default async function StudiosPage() {
    const result = await getStudios();

    // Handle error state
    if (!result.success) {
        return (
            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <BrowsePageHeader
                    title="Animation Studios"
                    description="Browse anime by animation studio"
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

    const studios = result.data;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <BrowsePageHeader
                title="Animation Studios"
                description="Browse anime by animation studio"
                count={studios.length}
                countLabel="studios"
            />

            <BrowseGrid
                isEmpty={studios.length === 0}
                emptyMessage="No studios found"
            >
                {studios.map((studio) => (
                    <BrowseCard
                        key={studio.id}
                        name={studio.name}
                        href={`/studio/${studio.slug}`}
                        count={studio.animeCount}
                        icon={<Building2 className="h-5 w-5" />}
                    />
                ))}
            </BrowseGrid>
        </div>
    );
}
