"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { Anime, AnimeWithPlanningCount } from "@/types/anime";
import { cn } from "@/lib/utils";

/**
 * Props for AnimeCarousel
 */
interface AnimeCarouselProps {
    /** Section title */
    title: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Anime to display in the carousel */
    anime: Anime[] | AnimeWithPlanningCount[];
    /** Optional link to view all */
    viewAllHref?: string;
    /** Whether to show planning count badges (for anticipated anime) */
    showPlanningCount?: boolean;
    /** Additional className for the container */
    className?: string;
}

/**
 * Type guard to check if anime has planning count
 */
function hasPlanning(
    anime: Anime | AnimeWithPlanningCount
): anime is AnimeWithPlanningCount {
    return "planningCount" in anime;
}

/**
 * AnimeCarousel - Horizontal scrollable anime card row using shadcn Carousel
 *
 * Features:
 * - Smooth horizontal scrolling with Embla Carousel
 * - Navigation arrows for desktop (hidden when at boundaries)
 * - Section title with optional "View All" link
 * - Responsive card sizing with multiple items visible
 * - Touch support for mobile devices
 * - Keyboard navigation support
 */
export function AnimeCarousel({
    title,
    subtitle,
    anime,
    viewAllHref,
    showPlanningCount = false,
    className,
}: AnimeCarouselProps) {
    // Don&apos;t render if no anime
    if (!anime || anime.length === 0) {
        return null;
    }

    return (
        <section className={cn("relative", className)}>
            {/* Header */}
            <div className="mb-4 flex items-end justify-between px-4 sm:px-6 lg:px-8">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>

                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="group flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        View all
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                )}
            </div>

            {/* Carousel */}
            <div className="px-4 sm:px-6 lg:px-8">
                <Carousel
                    opts={{
                        align: "start",
                        loop: false,
                        dragFree: true,
                        containScroll: "trimSnaps",
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-3 sm:-ml-4">
                        {anime.map((item) => (
                            <CarouselItem
                                key={item.id}
                                className="basis-[140px] pl-3 sm:basis-[160px] sm:pl-4 lg:basis-[180px]"
                            >
                                <AnimeCard
                                    anime={item}
                                    planningCount={
                                        showPlanningCount && hasPlanning(item)
                                            ? item.planningCount
                                            : undefined
                                    }
                                    hideStatus={showPlanningCount}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {/* Navigation buttons - positioned outside carousel bounds */}
                    <CarouselPrevious
                        variant="ghost"
                        className="left-0 h-10 w-10 -translate-x-1/2 border-0 bg-background/80 shadow-lg backdrop-blur-sm transition-all hover:bg-background disabled:pointer-events-none disabled:opacity-0"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </CarouselPrevious>
                    <CarouselNext
                        variant="ghost"
                        className="right-0 h-10 w-10 translate-x-1/2 border-0 bg-background/80 shadow-lg backdrop-blur-sm transition-all hover:bg-background disabled:pointer-events-none disabled:opacity-0"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </CarouselNext>
                </Carousel>
            </div>
        </section>
    );
}
