import { BrowsePageSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the platform detail page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to a platform page.
 */
export default function PlatformLoading() {
    return <BrowsePageSkeleton />;
}

