import { PageLoadingSpinner } from "@/components/ui/spinner";

/**
 * Loading state for the seasons index page
 *
 * Displays a centered spinner while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to the seasons page.
 */
export default function SeasonsLoading() {
    return <PageLoadingSpinner label="Loading seasons..." />;
}

