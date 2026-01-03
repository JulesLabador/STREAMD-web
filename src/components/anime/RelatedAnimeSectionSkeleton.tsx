import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loading state for the RelatedAnimeSection
 *
 * Displays placeholder content while related anime data is being fetched.
 * Used as the fallback in Suspense boundary.
 */
export function RelatedAnimeSectionSkeleton() {
    return (
        <Card className="border-0">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Related Anime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Single group skeleton */}
                <div className="space-y-3">
                    {/* Badge skeleton */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-3 w-6" />
                    </div>

                    {/* Horizontal scroll of cards */}
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="w-[140px] flex-shrink-0 sm:w-[160px]">
                                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                                <div className="mt-2 space-y-1">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

