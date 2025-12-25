"use client";

import { useSearchContext } from "./SearchProvider";
import { SearchResultItem } from "./SearchResultItem";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Props for SearchResults
 */
interface SearchResultsProps {
    /** Additional className for the container */
    className?: string;
    /** Maximum height for the results container */
    maxHeight?: string;
    /** Whether to show the results container when empty */
    showEmptyState?: boolean;
}

/**
 * SearchResults - Shared search results list component
 *
 * Displays:
 * - Loading skeletons while searching
 * - Empty state when no query
 * - No results message
 * - List of SearchResultItem components
 *
 * Used by both SearchModal and InlineSearch.
 */
export function SearchResults({
    className,
    maxHeight = "300px",
    showEmptyState = true,
}: SearchResultsProps) {
    const { query, results, isLoading, error } = useSearchContext();

    // Don&apos;t render anything if no query and not showing empty state
    if (!query.trim() && !showEmptyState) {
        return null;
    }

    return (
        <div
            className={cn("overflow-y-auto", className)}
            style={{ maxHeight }}
        >
            {/* Loading state */}
            {isLoading && (
                <div className="space-y-2 p-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="h-14 w-10 rounded" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error state */}
            {!isLoading && error && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    <p className="text-destructive">{error}</p>
                </div>
            )}

            {/* Empty query state */}
            {!isLoading && !error && !query.trim() && showEmptyState && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>Type to search for anime</p>
                </div>
            )}

            {/* No results state */}
            {!isLoading && !error && query.trim() && results.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>No anime found for &quot;{query}&quot;</p>
                </div>
            )}

            {/* Results list */}
            {!isLoading && !error && results.length > 0 && (
                <div className="p-1">
                    {results.map((anime, index) => (
                        <SearchResultItem
                            key={anime.id}
                            anime={anime}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

