import { ProfileSkeleton } from "@/components/ui/loading-skeletons";

/**
 * Loading state for the user profile page
 *
 * Displays a skeleton UI matching the profile layout while data is being fetched.
 * This file is automatically used by Next.js when navigating to a user profile page.
 */
export default function ProfileLoading() {
    return <ProfileSkeleton />;
}

