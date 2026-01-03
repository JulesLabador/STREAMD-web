import { BrowsePageSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the browse by year page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to a browse year page.
 */
export default function BrowseYearLoading() {
    return <BrowsePageSkeleton />;
}

