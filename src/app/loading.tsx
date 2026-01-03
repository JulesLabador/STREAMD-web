import { HomePageSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the home page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to the home page.
 */
export default function HomeLoading() {
    return <HomePageSkeleton />;
}

