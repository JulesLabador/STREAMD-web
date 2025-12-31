"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Tv,
    Sparkles,
    Calendar,
    Command,
    Play,
    ArrowRight,
} from "lucide-react";
import { SearchProvider } from "@/components/search/SearchProvider";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchResults } from "@/components/search/SearchResults";
import { Button } from "@/components/ui/button";
import type { CurrentSeasonStats } from "@/app/actions/anime";
import { cn } from "@/lib/utils";

/**
 * Props for HeroSection
 */
interface HeroSectionProps {
    /** Current season statistics for the banner */
    stats: CurrentSeasonStats | null;
    /** Optional banner image URL */
    bannerImageUrl?: string;
}

/**
 * Season display names
 */
const SEASON_NAMES: Record<string, string> = {
    WINTER: "Winter",
    SPRING: "Spring",
    SUMMER: "Summer",
    FALL: "Fall",
};

/**
 * HeroSection - Main hero area with search bar and seasonal banner image
 *
 * Features:
 * - Search bar at the top with keyboard shortcut hint
 * - Full-width banner with gradient background (or custom image)
 * - Current year/season information overlaid on left side
 * - Keyboard shortcut (/) to focus search
 */
export function HeroSection({ stats, bannerImageUrl }: HeroSectionProps) {
    const [showResults, setShowResults] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);

    /**
     * Handle click outside to close results
     */
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /**
     * Handle keyboard shortcut to focus search
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Focus search on "/" key press (when not in an input)
            if (
                e.key === "k" &&
                !["INPUT", "TEXTAREA"].includes(
                    (e.target as HTMLElement).tagName
                )
            ) {
                e.preventDefault();
                // Find and focus the input within our container
                const input = inputContainerRef.current?.querySelector("input");
                if (input) {
                    input.focus();
                    setShowResults(true);
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    /**
     * Handle close - hide results dropdown
     */
    const handleClose = useCallback(() => {
        setShowResults(false);
    }, []);

    // Get current year and season info
    const currentYear = stats?.year ?? new Date().getFullYear();
    const seasonName = stats
        ? `${SEASON_NAMES[stats.season]} ${stats.year}`
        : null;

    return (
        <section className="relative">
            {/* Search Bar Section */}
            <div className="relative z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div
                        ref={containerRef}
                        className="relative mx-auto max-w-2xl"
                    >
                        <SearchProvider onClose={handleClose}>
                            {/* Search input with keyboard hint */}
                            <div
                                ref={inputContainerRef}
                                className="relative"
                                onFocus={() => setShowResults(true)}
                                onClick={() => setShowResults(true)}
                            >
                                <SearchInput
                                    placeholder="Search anime, studios, seasons..."
                                    size="lg"
                                    className="w-full"
                                />

                                {/* Keyboard shortcut hint */}
                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                    <kbd
                                        className={cn(
                                            "hidden items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-flex",
                                            showResults && "opacity-0"
                                        )}
                                    >
                                        <Command className="h-3 w-3" />
                                        <span>K</span>
                                    </kbd>
                                </div>
                            </div>

                            {/* Results dropdown */}
                            {showResults && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-border bg-background shadow-xl">
                                    <SearchResults
                                        maxHeight="400px"
                                        showEmptyState={false}
                                    />
                                </div>
                            )}
                        </SearchProvider>
                    </div>
                </div>
            </div>

            {/* Hero Banner - Constrained width with rounded corners */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="relative h-[350px] sm:h-[400px] lg:h-[450px] overflow-hidden rounded-2xl border border-border/50">
                    {/* Background - Image or Gradient */}
                    {bannerImageUrl ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                            style={{
                                backgroundImage: `url(${bannerImageUrl})`,
                            }}
                        />
                    ) : (
                        <>
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.3),transparent)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(139,92,246,0.15),transparent)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.1),transparent)]" />
                            {/* Subtle grid pattern */}
                            <div
                                className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                }}
                            />
                        </>
                    )}

                    {/* Gradient Overlays for text readability */}
                    <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-background via-background/70 to-background/30" />
                    <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-background via-transparent to-transparent" />

                    {/* Content Overlay */}
                    <div className="relative z-10 h-full">
                        <div className="h-full px-6 sm:px-8 lg:px-10">
                            <div className="flex h-full items-center">
                                {/* Left side content */}
                                <div className="max-w-xl">
                                    {/* Year badge */}
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 backdrop-blur-sm border border-primary/20">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium text-primary">
                                            {currentYear} Anime
                                        </span>
                                    </div>

                                    {/* Main headline */}
                                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                                        Discover Your Next
                                        <span className="block text-primary">
                                            Anime Obsession
                                        </span>
                                    </h1>

                                    {/* Description */}
                                    <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
                                        Track, rate, and share your anime
                                        journey with thousands of titles
                                    </p>

                                    {/* Stats row */}
                                    {stats && (
                                        <div className="mt-6 flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                                                    <Tv className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {stats.airingCount}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Currently Airing
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-10 w-px bg-border" />
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/10 border border-chart-2/20">
                                                    <Sparkles className="h-5 w-5 text-chart-2" />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {stats.newAnimeCount}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        New This Season
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-10 w-px bg-border" />
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-3/10 border border-chart-3/20">
                                                    <Play className="h-5 w-5 text-chart-3" />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {stats.totalAnime}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Total This Season
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CTA Buttons */}
                                    <div className="mt-8 flex flex-wrap gap-3">
                                        {stats && (
                                            <Button
                                                asChild
                                                size="lg"
                                                className="gap-2 hover:cursor-pointer"
                                            >
                                                <Link
                                                    href={`/season/${stats.slug}`}
                                                >
                                                    Browse {seasonName}
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="lg"
                                            className="hover:cursor-pointer"
                                        >
                                            <Link href="/browse">
                                                Explore All Anime
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
