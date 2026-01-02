import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserProfile, getUserAnimeByStatus } from "@/lib/queries";
import { ProfileHeader, AnimeListTabs } from "@/components/profile";
import { Button } from "@/components/ui/button";
import type { UserAnimeWithAnime, UserAnimeStatus } from "@/types/user";
import { USER_ANIME_STATUS_ORDER } from "@/types/user";

/**
 * Page props with dynamic username parameter
 */
interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
    params,
}: ProfilePageProps): Promise<Metadata> {
    const { username } = await params;
    const result = await getUserProfile(username);

    if (!result.success) {
        return {
            title: "User Not Found",
        };
    }

    const profile = result.data;
    const displayName = profile.username || profile.displayName;

    return {
        title: `${displayName}'s Profile`,
        description: `View ${displayName}'s anime list on STREAMD. ${profile.stats.totalAnime} anime tracked.`,
        openGraph: {
            title: `${displayName}'s Profile | STREAMD`,
            description: `View ${displayName}'s anime list on STREAMD. ${profile.stats.totalAnime} anime tracked.`,
            type: "profile",
        },
    };
}

/**
 * User profile page
 *
 * Displays a user's public profile including:
 * - Profile header with avatar, name, and stats
 * - Tabbed anime list organized by status
 *
 * Route: /u/[username]
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;

    // Fetch user profile
    const profileResult = await getUserProfile(username);

    // Handle not found
    if (!profileResult.success) {
        if (profileResult.code === "NOT_FOUND") {
            notFound();
        }
        // For other errors, show error state
        return (
            <div className="min-h-screen p-4">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-foreground">
                            Something went wrong
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {profileResult.error}
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/">Go back home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const profile = profileResult.data;

    // Fetch all anime by status in parallel
    const animePromises = USER_ANIME_STATUS_ORDER.map((status) =>
        getUserAnimeByStatus(profile.id, status, 1, 100)
    );

    const animeResults = await Promise.all(animePromises);

    // Build anime by status map
    const animeByStatus: Record<UserAnimeStatus, UserAnimeWithAnime[]> = {
        WATCHING: [],
        COMPLETED: [],
        PLANNING: [],
        PAUSED: [],
        DROPPED: [],
    };

    USER_ANIME_STATUS_ORDER.forEach((status, index) => {
        const result = animeResults[index];
        if (result.success) {
            animeByStatus[status] = result.data.data;
        }
    });

    return (
        <div className="min-h-screen">
            {/* Main container */}
            <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
                {/* Back button */}
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-6 -ml-2"
                >
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Browse
                    </Link>
                </Button>

                {/* Content sections */}
                <div className="space-y-8">
                    {/* Profile header */}
                    <div className="mb-8">
                        <ProfileHeader profile={profile} />
                    </div>

                    {/* Anime list tabs */}
                    {profile.stats.totalAnime > 0 ? (
                        <section>
                            <h2 className="mb-6 text-xl font-semibold">
                                Anime List
                            </h2>
                            <AnimeListTabs animeByStatus={animeByStatus} />
                        </section>
                    ) : (
                        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
                            <div className="text-center">
                                <p className="text-muted-foreground">
                                    {profile.displayName || profile.username}{" "}
                                    hasn&apos;t added any anime yet
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
