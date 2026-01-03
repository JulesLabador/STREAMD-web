import { UpcomingPageSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the upcoming anime page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to the upcoming page.
 */
export default function UpcomingLoading() {
    return <UpcomingPageSkeleton />;
}

