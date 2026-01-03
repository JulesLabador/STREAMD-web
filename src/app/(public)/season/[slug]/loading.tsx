import { SeasonPageSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the season detail page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to a season page.
 */
export default function SeasonLoading() {
    return <SeasonPageSkeleton />;
}

