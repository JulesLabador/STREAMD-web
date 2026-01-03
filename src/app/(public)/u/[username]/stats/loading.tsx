import { ProfileSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the user stats page
 *
 * Displays a skeleton UI while the page data is being fetched.
 * This file is automatically used by Next.js when navigating to a user stats page.
 */
export default function StatsLoading() {
    return <ProfileSkeleton />;
}

