import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

/**
 * AnimeCardSkeleton component
 *
 * Skeleton placeholder for a single anime card.
 * Matches the layout of AnimeCard component.
 */
export function AnimeCardSkeleton() {
    return (
        <div className="space-y-2">
            {/* Cover image skeleton */}
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            {/* Title skeleton */}
            <Skeleton className="h-4 w-3/4" />
            {/* Subtitle/meta skeleton */}
            <Skeleton className="h-3 w-1/2" />
        </div>
    );
}

/**
 * AnimeGridSkeleton component
 *
 * Grid of anime card skeletons for list pages.
 * Responsive grid matching AnimeGrid layout.
 *
 * @param count - Number of skeleton cards to display (default: 24)
 */
export function AnimeGridSkeleton({ count = 24 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: count }).map((_, i) => (
                <AnimeCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * BrowsePageSkeleton component
 *
 * Full page skeleton for browse/list pages including header and grid.
 */
export function BrowsePageSkeleton() {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header skeleton */}
            <div className="mb-8 space-y-4">
                {/* Back button */}
                <Skeleton className="h-10 w-20" />
                {/* Title */}
                <Skeleton className="h-8 w-48" />
                {/* Description */}
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Grid skeleton */}
            <AnimeGridSkeleton />
        </div>
    );
}

/**
 * AnimeDetailSkeleton component
 *
 * Full page skeleton for anime detail pages.
 * Matches the layout of the anime detail page.
 */
export function AnimeDetailSkeleton() {
    return (
        <div className="min-h-screen">
            {/* Banner skeleton */}
            <Skeleton className="h-[30vh] w-full sm:h-[35vh] md:h-[40vh]" />

            {/* Main container */}
            <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
                {/* Back button */}
                <Skeleton className="mb-6 h-10 w-20" />

                <div className="space-y-6">
                    {/* Hero section */}
                    <section className="space-y-4">
                        {/* Cover image */}
                        <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px]">
                            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                        </div>

                        {/* Titles */}
                        <div className="flex flex-col items-center gap-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>

                        {/* Badges */}
                        <div className="flex justify-center gap-2">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>

                        {/* Rating bar */}
                        <div className="flex justify-center">
                            <Skeleton className="h-8 w-48" />
                        </div>

                        {/* Tracking button */}
                        <div className="flex justify-center">
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </section>

                    {/* Info card */}
                    <Card className="border-0">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-24" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Synopsis card */}
                    <Card className="border-0">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-20" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                    </Card>

                    {/* Details card */}
                    <Card className="border-0">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-16" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Genres card */}
                    <Card className="border-0">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-16" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-6 w-20 rounded-full"
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/**
 * ProfileSkeleton component
 *
 * Full page skeleton for user profile pages.
 * Matches the layout of the profile page.
 */
export function ProfileSkeleton() {
    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
                {/* Back button */}
                <Skeleton className="mb-6 h-9 w-32" />

                <div className="space-y-8">
                    {/* Profile header */}
                    <div className="mb-8">
                        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                            {/* Avatar */}
                            <Skeleton className="h-24 w-24 rounded-full" />

                            {/* Info */}
                            <div className="flex-1 space-y-4 text-center sm:text-left">
                                <div className="space-y-2">
                                    <Skeleton className="mx-auto h-7 w-40 sm:mx-0" />
                                    <Skeleton className="mx-auto h-4 w-24 sm:mx-0" />
                                </div>

                                {/* Stats */}
                                <div className="flex justify-center gap-6 sm:justify-start">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <Skeleton className="h-6 w-8" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Anime list section */}
                    <section>
                        <Skeleton className="mb-6 h-6 w-24" />

                        {/* Tabs */}
                        <div className="mb-6 flex gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-9 w-24" />
                            ))}
                        </div>

                        {/* Anime grid */}
                        <AnimeGridSkeleton count={12} />
                    </section>
                </div>
            </div>
        </div>
    );
}

/**
 * HomePageSkeleton component
 *
 * Full page skeleton for the home page.
 */
export function HomePageSkeleton() {
    return (
        <div className="min-h-screen">
            {/* Hero section */}
            <div className="relative overflow-hidden bg-gradient-to-b from-background to-background/80 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <Skeleton className="mx-auto mb-4 h-12 w-3/4" />
                    <Skeleton className="mx-auto mb-8 h-6 w-1/2" />
                    <Skeleton className="mx-auto h-12 w-full max-w-xl rounded-lg" />
                </div>
            </div>

            {/* Content sections */}
            <div className="mx-auto max-w-7xl space-y-10 px-4 pb-16 sm:space-y-16 sm:px-6 lg:px-8">
                {/* Season section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <AnimeCardSkeleton key={i} />
                        ))}
                    </div>
                </section>

                {/* Another section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <AnimeCardSkeleton key={i} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

/**
 * SeasonPageSkeleton component
 *
 * Full page skeleton for season detail pages.
 */
export function SeasonPageSkeleton() {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
            </div>

            {/* Summary section */}
            <div className="mb-8 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </div>

            {/* Grid */}
            <AnimeGridSkeleton />

            {/* Pagination */}
            <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-10" />
                ))}
            </div>
        </div>
    );
}

/**
 * UpcomingPageSkeleton component
 *
 * Full page skeleton for the upcoming anime page.
 */
export function UpcomingPageSkeleton() {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="mb-8 text-center">
                <Skeleton className="mx-auto mb-4 h-8 w-40 rounded-full" />
            </div>

            {/* Hero section */}
            <div className="mb-12 rounded-2xl bg-muted/30 p-6 sm:p-10 lg:p-16">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <Skeleton className="h-6 w-48 rounded-full" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-48" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-12 w-48" />
                    </div>
                    <Skeleton className="hidden h-40 w-40 rounded-lg lg:block" />
                </div>
            </div>

            {/* Stats grid */}
            <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
            </div>

            {/* Most anticipated */}
            <section className="mb-12 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-9 w-24" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <AnimeCardSkeleton key={i} />
                    ))}
                </div>
            </section>
        </div>
    );
}

