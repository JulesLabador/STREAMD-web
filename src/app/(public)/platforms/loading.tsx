import { PageLoadingSpinner } from "@/components/ui/spinner";

/**
 * Loading state for the platforms index page
 *
 * Displays a centered spinner while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to the platforms page.
 */
export default function PlatformsLoading() {
    return <PageLoadingSpinner label="Loading platforms..." />;
}

