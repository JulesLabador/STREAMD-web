import { Metadata } from "next";
import { Play } from "lucide-react";
import { getPlatforms } from "@/lib/queries";
import { BrowsePageHeader, BrowseGrid, BrowseCard } from "@/components/browse";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.streamdanime.io";

/**
 * Static metadata for the platforms index page
 */
export const metadata: Metadata = {
    title: "Streaming Platforms",
    description:
        "Browse anime by streaming platform. Find anime available on Crunchyroll, Netflix, Hulu, Amazon Prime Video, HIDIVE, and more.",
    openGraph: {
        title: "Streaming Platforms | STREAMD",
        description:
            "Browse anime by streaming platform. Find anime available on Crunchyroll, Netflix, Hulu, Amazon Prime Video, HIDIVE, and more.",
        type: "website",
    },
    alternates: {
        canonical: `${SITE_URL}/platforms`,
    },
};

/**
 * Platforms index page
 *
 * Displays a grid of all streaming platforms with anime counts.
 * Server Component that fetches platforms data.
 */
export default async function PlatformsPage() {
    const result = await getPlatforms();

    // Handle error state
    if (!result.success) {
        return (
            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <BrowsePageHeader
                    title="Streaming Platforms"
                    description="Browse anime by streaming platform"
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

    const platforms = result.data;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <BrowsePageHeader
                title="Streaming Platforms"
                description="Browse anime by streaming platform"
                count={platforms.length}
                countLabel="platforms"
            />

            <BrowseGrid
                isEmpty={platforms.length === 0}
                emptyMessage="No platforms found"
            >
                {platforms.map((platform) => (
                    <BrowseCard
                        key={platform.platform}
                        name={platform.name}
                        href={`/platforms/${platform.slug}`}
                        count={platform.animeCount}
                        icon={<Play className="h-5 w-5" />}
                    />
                ))}
            </BrowseGrid>
        </div>
    );
}
