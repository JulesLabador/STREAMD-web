"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackingDialog } from "./TrackingDialog";
import { getUserAnimeForAnime } from "@/app/actions/user";
import type { UserAnime } from "@/types/user";
import { USER_ANIME_STATUS_LABELS } from "@/types/user";

/**
 * Props for the TrackingButton component
 */
interface TrackingButtonProps {
    /** The anime ID to track */
    animeId: string;
    /** The anime title for display in dialog */
    animeTitle: string;
    /** Total episode count (for validation) */
    episodeCount: number | null;
    /** Whether the user is authenticated */
    isAuthenticated: boolean;
    /** Initial tracking data (from server) */
    initialTracking?: UserAnime | null;
}

/**
 * TrackingButton component
 *
 * Button that allows users to add or edit anime tracking:
 * - Shows "Add to List" for untracked anime
 * - Shows current status for tracked anime
 * - Opens TrackingDialog on click
 * - Requires authentication
 */
export function TrackingButton({
    animeId,
    animeTitle,
    episodeCount,
    isAuthenticated,
    initialTracking,
}: TrackingButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tracking, setTracking] = useState<UserAnime | null>(
        initialTracking ?? null
    );
    const [isLoading, startTransition] = useTransition();

    // Fetch tracking data on mount if not provided
    useEffect(() => {
        if (isAuthenticated && initialTracking === undefined) {
            startTransition(async () => {
                const result = await getUserAnimeForAnime(animeId);
                if (result.success) {
                    setTracking(result.data);
                }
            });
        }
    }, [animeId, isAuthenticated, initialTracking]);

    /**
     * Handles button click
     */
    const handleClick = () => {
        if (!isAuthenticated) {
            // Redirect to login
            window.location.href = `/login?redirectTo=/anime/${encodeURIComponent(
                animeId
            )}`;
            return;
        }
        setIsDialogOpen(true);
    };

    /**
     * Handles tracking update from dialog
     */
    const handleTrackingUpdate = (newTracking: UserAnime | null) => {
        setTracking(newTracking);
    };

    const isTracked = tracking !== null;

    return (
        <>
            <Button
                onClick={handleClick}
                variant={isTracked ? "secondary" : "default"}
                className="w-full sm:w-auto hover:cursor-pointer"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </>
                ) : isTracked ? (
                    <>
                        <Check className="mr-2 h-4 w-4" />
                        {USER_ANIME_STATUS_LABELS[tracking.status]}
                    </>
                ) : (
                    <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to List
                    </>
                )}
            </Button>

            <TrackingDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                animeId={animeId}
                animeTitle={animeTitle}
                episodeCount={episodeCount}
                existingTracking={tracking}
                onTrackingUpdate={handleTrackingUpdate}
            />
        </>
    );
}
