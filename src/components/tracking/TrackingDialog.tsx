"use client";

import { useState, useTransition } from "react";
import {
    Loader2,
    Trash2,
    Play,
    CheckCircle,
    Clock,
    Pause,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    addAnimeToList,
    updateAnimeTracking,
    removeAnimeFromList,
} from "@/app/actions/user";
import type { UserAnime, UserAnimeStatus } from "@/types/user";
import {
    USER_ANIME_STATUS_LABELS,
    USER_ANIME_STATUS_ORDER,
} from "@/types/user";

/**
 * Icon components mapped to each status
 */
const STATUS_ICONS: Record<UserAnimeStatus, React.ElementType> = {
    WATCHING: Play,
    COMPLETED: CheckCircle,
    PLANNING: Clock,
    PAUSED: Pause,
    DROPPED: XCircle,
};

/**
 * Props for the TrackingDialog component
 */
interface TrackingDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** The anime ID to track */
    animeId: string;
    /** The anime title for display */
    animeTitle: string;
    /** Total episode count (for validation) */
    episodeCount: number | null;
    /** Existing tracking data (if already tracked) */
    existingTracking: UserAnime | null;
    /** Callback when tracking is updated */
    onTrackingUpdate?: (tracking: UserAnime | null) => void;
}

/**
 * TrackingDialog component
 *
 * Modal dialog for adding or editing anime tracking:
 * - Status selection (Planning, Watching, Completed, etc.)
 * - Episode progress input
 * - Rating input (0-10)
 * - Remove from list option (for existing entries)
 */
export function TrackingDialog({
    open,
    onOpenChange,
    animeId,
    animeTitle,
    episodeCount,
    existingTracking,
    onTrackingUpdate,
}: TrackingDialogProps) {
    const isEditing = existingTracking !== null;

    // Form state
    const [status, setStatus] = useState<UserAnimeStatus>(
        existingTracking?.status ?? "PLANNING"
    );
    const [currentEpisode, setCurrentEpisode] = useState<number>(
        existingTracking?.currentEpisode ?? 0
    );
    const [rating, setRating] = useState<number | null>(
        existingTracking?.rating ?? null
    );

    // Transition states
    const [isPending, startTransition] = useTransition();
    const [isRemoving, startRemoveTransition] = useTransition();

    /**
     * Handles form submission
     */
    const handleSubmit = () => {
        startTransition(async () => {
            // Validate episode count
            if (episodeCount !== null && currentEpisode > episodeCount) {
                toast.error(`Episode cannot exceed ${episodeCount}`);
                return;
            }

            if (isEditing) {
                // Update existing tracking
                const result = await updateAnimeTracking(animeId, {
                    status,
                    currentEpisode,
                    rating,
                });

                if (result.success) {
                    toast.success("Tracking updated!");
                    onTrackingUpdate?.(result.data);
                    onOpenChange(false);
                } else {
                    toast.error(result.error);
                }
            } else {
                // Add new tracking
                const result = await addAnimeToList({
                    animeId,
                    status,
                    currentEpisode,
                    rating: rating ?? undefined,
                });

                if (result.success) {
                    toast.success("Added to your list!");
                    onTrackingUpdate?.(result.data);
                    onOpenChange(false);
                } else {
                    toast.error(result.error);
                }
            }
        });
    };

    /**
     * Handles removing anime from list
     */
    const handleRemove = () => {
        startRemoveTransition(async () => {
            const result = await removeAnimeFromList(animeId);

            if (result.success) {
                toast.success("Removed from your list");
                onTrackingUpdate?.(null);
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        });
    };

    /**
     * Handles status change and auto-adjusts episode count
     */
    const handleStatusChange = (newStatus: UserAnimeStatus) => {
        setStatus(newStatus);

        // Auto-set episode count for COMPLETED status
        if (newStatus === "COMPLETED" && episodeCount !== null) {
            setCurrentEpisode(episodeCount);
        }
    };

    const isSubmitting = isPending || isRemoving;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md border-border/50 bg-card shadow-2xl shadow-black/50 ring-1 ring-white/10 overflow-hidden">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Tracking" : "Add to List"}
                    </DialogTitle>
                    <DialogDescription className="line-clamp-1">
                        {animeTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 w-full">
                    {/* Status select */}
                    <div className="grid gap-3">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                            value={status}
                            onValueChange={(value) =>
                                handleStatusChange(value as UserAnimeStatus)
                            }
                            disabled={isSubmitting}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {(() => {
                                        const Icon = STATUS_ICONS[status];
                                        return (
                                            <span className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                {USER_ANIME_STATUS_LABELS[status]}
                                            </span>
                                        );
                                    })()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {USER_ANIME_STATUS_ORDER.map((s) => {
                                    const Icon = STATUS_ICONS[s];
                                    return (
                                        <SelectItem key={s} value={s}>
                                            <span className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                {USER_ANIME_STATUS_LABELS[s]}
                                            </span>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Episode progress */}
                    <div className="grid gap-3">
                        <label className="text-sm font-medium">
                            Episode Progress
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={currentEpisode}
                                onChange={(e) => {
                                    const value = e.target.value.replace(
                                        /[^0-9]/g,
                                        ""
                                    );
                                    const num = parseInt(value) || 0;
                                    const max = episodeCount ?? Infinity;
                                    setCurrentEpisode(Math.min(num, max));
                                }}
                                disabled={isSubmitting}
                                className="w-20 text-center"
                            />
                            <span className="text-sm text-muted-foreground">
                                / {episodeCount ?? "?"}
                            </span>
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="grid gap-3 w-full">
                        <label className="text-sm font-medium">
                            Rating{" "}
                            <span className="text-muted-foreground font-normal">
                                (optional)
                            </span>
                        </label>
                        <div className="flex w-full gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                        setRating(
                                            rating === value ? null : value
                                        )
                                    }
                                    disabled={isSubmitting}
                                    className={`h-9 flex-1 rounded-md text-sm font-medium transition-colors hover:cursor-pointer ${
                                        rating === value
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    } disabled:pointer-events-none disabled:opacity-50`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer with action buttons - all in one row */}
                <div className="flex items-center justify-between gap-2">
                    {/* Remove button (only for existing entries) */}
                    {isEditing ? (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleRemove}
                            disabled={isSubmitting}
                            size="sm"
                        >
                            {isRemoving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Remove
                        </Button>
                    ) : (
                        <div />
                    )}

                    {/* Cancel and Submit buttons */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            size="sm"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            size="sm"
                        >
                            {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isEditing ? "Update" : "Add to List"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
