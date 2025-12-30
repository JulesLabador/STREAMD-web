import Link from "next/link";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { RelatedAnime, RelatedAnimeResult, AnimeRelationType } from "@/types/anime";
import {
    formatRelationType,
    getRelationTypePriority,
} from "@/types/anime";

/**
 * Props for the RelatedAnimeSection component
 */
interface RelatedAnimeSectionProps {
    /** Related anime result with data and error state */
    relatedAnime: RelatedAnimeResult;
}

/**
 * Groups related anime by their relation type
 * @param relatedAnime - Array of related anime
 * @returns Map of relation type to array of related anime
 */
function groupByRelationType(
    relatedAnime: RelatedAnime[]
): Map<AnimeRelationType, RelatedAnime[]> {
    const groups = new Map<AnimeRelationType, RelatedAnime[]>();

    for (const related of relatedAnime) {
        const existing = groups.get(related.relationType) || [];
        existing.push(related);
        groups.set(related.relationType, existing);
    }

    return groups;
}

/**
 * Sorts relation type groups by priority
 * Prequels and sequels appear first, followed by other relation types
 * @param groups - Map of relation type to related anime
 * @returns Sorted array of [relationType, relatedAnime[]] tuples
 */
function sortGroupsByPriority(
    groups: Map<AnimeRelationType, RelatedAnime[]>
): [AnimeRelationType, RelatedAnime[]][] {
    return Array.from(groups.entries()).sort(
        ([a], [b]) => getRelationTypePriority(a) - getRelationTypePriority(b)
    );
}

/**
 * Gets the badge variant for a relation type
 * @param relationType - The relation type
 * @returns Badge variant string
 */
function getRelationBadgeVariant(
    relationType: AnimeRelationType
): "default" | "secondary" | "outline" | "watching" | "completed" | "planned" {
    switch (relationType) {
        case "SEQUEL":
        case "PREQUEL":
            return "watching";
        case "SIDE_STORY":
        case "SPIN_OFF":
            return "secondary";
        case "ALTERNATIVE":
            return "planned";
        default:
            return "outline";
    }
}

/**
 * RelatedAnimeCard component
 * Displays a single related anime in a compact card format
 */
function RelatedAnimeCard({ related }: { related: RelatedAnime }) {
    const { anime } = related;
    const displayTitle = anime.titles.english || anime.titles.romaji;

    return (
        <Link
            href={`/anime/${anime.slug}`}
            className="group flex-shrink-0 w-[140px] sm:w-[160px] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
            {/* Cover image with 3:4 aspect ratio */}
            <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-muted">
                {anime.coverImageUrl ? (
                    <Image
                        src={anime.coverImageUrl}
                        alt={displayTitle}
                        fill
                        sizes="(max-width: 640px) 140px, 160px"
                        className="object-cover transition-opacity group-hover:opacity-90"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-secondary">
                        <span className="text-3xl text-muted-foreground">
                            🎬
                        </span>
                    </div>
                )}

                {/* Rating overlay */}
                {anime.averageRating !== null && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                        <span className="text-yellow-400">★</span>
                        <span>{anime.averageRating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Title and metadata */}
            <div className="mt-2 space-y-1">
                <h4 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
                    {displayTitle}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{anime.format}</span>
                    {anime.seasonYear && (
                        <>
                            <span className="text-border">•</span>
                            <span>{anime.seasonYear}</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}

/**
 * RelatedAnimeSection component
 *
 * Displays related anime grouped by relation type (sequels, prequels, etc.)
 * Uses a horizontal scroll layout for each group
 *
 * Features:
 * - Groups anime by relation type
 * - Sorts groups by priority (prequels/sequels first)
 * - Horizontal scroll for each group
 * - Compact card display with cover image and title
 * - Graceful error handling with user-friendly message
 */
export function RelatedAnimeSection({ relatedAnime }: RelatedAnimeSectionProps) {
    const { data, hasError } = relatedAnime;

    // Don&apos;t render if no related anime and no error
    if (!hasError && (!data || data.length === 0)) {
        return null;
    }

    // Show error state if there was an error fetching related anime
    if (hasError) {
        return (
            <Card className="border-0">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Related Anime</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Unable to load related anime. Please try again later.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Group and sort related anime by relation type
    const groups = groupByRelationType(data);
    const sortedGroups = sortGroupsByPriority(groups);

    return (
        <Card className="border-0">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Related Anime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {sortedGroups.map(([relationType, animeList]) => (
                    <div key={relationType} className="space-y-3">
                        {/* Relation type header with badge */}
                        <div className="flex items-center gap-2">
                            <Badge variant={getRelationBadgeVariant(relationType)}>
                                {formatRelationType(relationType)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                ({animeList.length})
                            </span>
                        </div>

                        {/* Horizontal scroll area for related anime */}
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex gap-4 pb-4">
                                {animeList.map((related) => (
                                    <RelatedAnimeCard
                                        key={related.anime.id}
                                        related={related}
                                    />
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

