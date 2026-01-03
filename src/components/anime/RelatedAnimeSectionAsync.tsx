import { getRelatedAnime } from "@/lib/queries";
import { RelatedAnimeSection } from "./RelatedAnimeSection";

/**
 * Props for the async related anime section
 */
interface RelatedAnimeSectionAsyncProps {
    /** UUID of the anime to fetch related anime for */
    animeId: string;
}

/**
 * Async server component that fetches and renders related anime
 *
 * This component is designed to be wrapped in Suspense for deferred loading.
 * It fetches related anime data independently from the main page data,
 * allowing the main content to render immediately while related anime loads.
 */
export async function RelatedAnimeSectionAsync({
    animeId,
}: RelatedAnimeSectionAsyncProps) {
    const relatedAnime = await getRelatedAnime(animeId);

    // Don&apos;t render if no related anime and no error
    if (!relatedAnime.hasError && relatedAnime.data.length === 0) {
        return null;
    }

    return <RelatedAnimeSection relatedAnime={relatedAnime} />;
}

