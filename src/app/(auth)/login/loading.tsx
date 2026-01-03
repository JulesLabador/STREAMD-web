import { PageLoadingSpinner } from "@/components/ui/spinner";

/**
 * Loading state for the login page
 *
 * Displays a centered spinner while the page is loading.
 * This file is automatically used by Next.js when navigating to the login page.
 */
export default function LoginLoading() {
    return <PageLoadingSpinner label="Loading..." />;
}

