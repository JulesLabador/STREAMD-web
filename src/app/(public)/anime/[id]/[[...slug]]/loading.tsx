import { AnimeDetailSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the anime detail page
 *
 * Displays a skeleton UI matching the anime detail layout while data is being fetched.
 * This file is automatically used by Next.js when navigating to an anime page.
 */
export default function AnimeLoading() {
    return <AnimeDetailSkeleton />;
}

