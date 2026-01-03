import { BrowsePageSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the browse by genre page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to a browse genre page.
 */
export default function BrowseGenreLoading() {
    return <BrowsePageSkeleton />;
}

