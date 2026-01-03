import { BrowsePageSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the browse page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to the browse page.
 */
export default function BrowseLoading() {
    return <BrowsePageSkeleton />;
}

