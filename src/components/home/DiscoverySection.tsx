import Link from "next/link";
import {
    Calendar,
    Film,
    Building2,
    Tv,
    ArrowRight,
    Compass,
} from "lucide-react";
import { StudioSpotlight } from "./StudioSpotlight";
import { Card, CardContent } from "@/components/ui/card";
import type { StudioWithCount } from "@/types/anime";
import { cn } from "@/lib/utils";

/**
 * Props for DiscoverySection
 */
interface DiscoverySectionProps {
    /** Studios active in the current season */
    studios: StudioWithCount[];
}

/**
 * Browse path configuration
 */
const BROWSE_PATHS = [
    {
        title: "Seasons",
        description: "Browse by release season",
        href: "/season",
        icon: Calendar,
        color: "text-primary",
        bgColor: "bg-primary/10",
    },
    {
        title: "Genres",
        description: "Find anime by genre",
        href: "/genre",
        icon: Compass,
        color: "text-chart-2",
        bgColor: "bg-chart-2/10",
    },
    {
        title: "Studios",
        description: "Explore by animation studio",
        href: "/studio",
        icon: Building2,
        color: "text-chart-3",
        bgColor: "bg-chart-3/10",
    },
    {
        title: "Platforms",
        description: "Find where to watch",
        href: "/platforms",
        icon: Tv,
        color: "text-chart-4",
        bgColor: "bg-chart-4/10",
    },
];

/**
 * DiscoverySection - Discovery and exploration modules
 *
 * Features:
 * - Trending studios spotlight
 * - Quick browse path links
 * - Encourages serendipitous discovery
 */
export function DiscoverySection({ studios }: DiscoverySectionProps) {
    return (
        <section className="space-y-10 px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Discover &amp; Explore
                </h2>
                <p className="mt-2 text-muted-foreground">
                    Find your next favorite anime through different paths
                </p>
            </div>

            {/* Studios spotlight */}
            {studios.length > 0 && <StudioSpotlight studios={studios} />}

            {/* Browse paths */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                    Browse By
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {BROWSE_PATHS.map((path) => {
                        const Icon = path.icon;
                        return (
                            <Link
                                key={path.href}
                                href={path.href}
                                className="group"
                            >
                                <Card className="h-full border-0 bg-card/50 transition-all hover:bg-card hover:shadow-md">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        {/* Icon */}
                                        <div
                                            className={cn(
                                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                                                path.bgColor,
                                                "group-hover:scale-105"
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    "h-6 w-6",
                                                    path.color
                                                )}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-medium text-foreground transition-colors group-hover:text-primary">
                                                {path.title}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {path.description}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
