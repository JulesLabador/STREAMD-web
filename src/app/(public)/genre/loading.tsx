import { BrowsePageSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the genres index page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to the genres page.
 */
export default function GenresLoading() {
    return <BrowsePageSkeleton />;
}

