import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { UserAnimeWithAnime } from "@/types/user";
import { USER_ANIME_STATUS_LABELS } from "@/types/user";

/**
 * Props for the UserAnimeCard component
 */
interface UserAnimeCardProps {
    userAnime: UserAnimeWithAnime;
    showStatus?: boolean;
}

/**
 * Gets the badge variant for user anime status
 */
function getStatusVariant(
    status: UserAnimeWithAnime["status"]
): "watching" | "completed" | "planned" | "onHold" | "dropped" {
    switch (status) {
        case "WATCHING":
            return "watching";
        case "COMPLETED":
            return "completed";
        case "PLANNING":
            return "planned";
        case "PAUSED":
            return "onHold";
        case "DROPPED":
            return "dropped";
    }
}

/**
 * UserAnimeCard component
 *
 * Displays an anime card with user's tracking information including:
 * - Cover image with aspect ratio
 * - Title
 * - User's rating (if set)
 * - Episode progress
 * - Status badge (optional)
 *
 * Links to the anime detail page via slug
 */
export function UserAnimeCard({
    userAnime,
    showStatus = false,
}: UserAnimeCardProps) {
    const { anime } = userAnime;
    const displayTitle = anime.titles.english || anime.titles.romaji;

    // Calculate episode progress percentage
    const progressPercent =
        anime.episodeCount && anime.episodeCount > 0
            ? (userAnime.currentEpisode / anime.episodeCount) * 100
            : 0;

    return (
        <Link
            href={`/anime/${anime.slug}`}
            className="group block overflow-hidden rounded-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {/* Cover image container with 3:4 aspect ratio */}
            <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-muted">
                {anime.coverImageUrl ? (
                    <Image
                        src={anime.coverImageUrl}
                        alt={displayTitle}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-opacity group-hover:opacity-90"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-secondary">
                        <span className="text-4xl text-muted-foreground">
                            🎬
                        </span>
                    </div>
                )}

                {/* Status badge overlay */}
                {showStatus && (
                    <div className="absolute left-2 top-2">
                        <Badge
                            variant={getStatusVariant(userAnime.status)}
                            className="text-xs"
                        >
                            {USER_ANIME_STATUS_LABELS[userAnime.status]}
                        </Badge>
                    </div>
                )}

                {/* User rating overlay (if set) */}
                {userAnime.rating !== null && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{userAnime.rating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Card content */}
            <div className="mt-3 space-y-2 mb-4">
                {/* Title */}
                <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
                    {displayTitle}
                </h3>

                {/* Episode progress */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            {userAnime.currentEpisode} /{" "}
                            {anime.episodeCount ?? "?"}
                        </span>
                        {anime.episodeCount && (
                            <span>{Math.round(progressPercent)}%</span>
                        )}
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                </div>
            </div>
        </Link>
    );
}
