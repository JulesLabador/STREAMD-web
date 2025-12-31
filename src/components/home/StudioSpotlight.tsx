import Link from "next/link";
import { Building2, ArrowRight, Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StudioWithCount } from "@/types/anime";
import { cn } from "@/lib/utils";

/**
 * Props for StudioSpotlight
 */
interface StudioSpotlightProps {
    /** Studios to display */
    studios: StudioWithCount[];
    /** Section title */
    title?: string;
    /** Section subtitle */
    subtitle?: string;
    /** Additional className */
    className?: string;
}

/**
 * StudioSpotlight - Featured studios carousel/grid
 *
 * Displays studios that are active in the current season
 * with their anime counts. Links to studio pages.
 */
export function StudioSpotlight({
    studios,
    title = "Trending Studios",
    subtitle = "Studios with the most anime this season",
    className,
}: StudioSpotlightProps) {
    if (!studios || studios.length === 0) {
        return null;
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
                <Link
                    href="/studio"
                    className="group flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    All studios
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>

            {/* Studios grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {studios.map((studio) => (
                    <Link
                        key={studio.id}
                        href={`/studio/${studio.slug}`}
                        className="group"
                    >
                        <Card className="h-full border-0 bg-card/50 transition-all hover:bg-card hover:shadow-md">
                            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                {/* Studio icon */}
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>

                                {/* Studio name */}
                                <h4 className="line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                                    {studio.name}
                                </h4>

                                {/* Anime count */}
                                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Film className="h-3 w-3" />
                                    <span>
                                        {studio.animeCount} anime this season
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
