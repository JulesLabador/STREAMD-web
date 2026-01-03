import { BrowsePageSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the studio detail page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to a studio page.
 */
export default function StudioLoading() {
    return <BrowsePageSkeleton />;
}

