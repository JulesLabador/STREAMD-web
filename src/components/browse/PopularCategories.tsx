"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { GenreWithCount } from "@/types/anime";

/**
 * Props for the PopularCategories component
 */
interface PopularCategoriesProps {
    /** Available genres with counts */
    genres: GenreWithCount[];
    /** Available years */
    years: number[];
}

/**
 * Season definitions with display names
 */
const SEASONS = [
    { value: "WINTER", label: "Winter", emoji: "❄️" },
    { value: "SPRING", label: "Spring", emoji: "🌸" },
    { value: "SUMMER", label: "Summer", emoji: "☀️" },
    { value: "FALL", label: "Fall", emoji: "🍂" },
] as const;

/**
 * Format definitions with display names
 */
const FORMATS = [
    { value: "TV", label: "TV Series" },
    { value: "MOVIE", label: "Movies" },
    { value: "OVA", label: "OVAs" },
    { value: "ONA", label: "ONAs" },
] as const;

/**
 * PopularCategories component
 *
 * Displays a section with popular filter combinations as clickable links.
 * This creates a strong internal linking structure for SEO while providing
 * quick access to commonly browsed categories.
 */
export function PopularCategories({ genres, years }: PopularCategoriesProps) {
    // Get top genres by count
    const topGenres = genres
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

    // Get recent years (last 5)
    const recentYears = years
        .sort((a, b) => b - a)
        .slice(0, 5);

    // Current year for seasonal anime
    const currentYear = new Date().getFullYear();

    return (
        <section className="mb-12 space-y-8">
            {/* Section header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground">
                    Popular Categories
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Quick links to browse anime by genre, year, season, or format
                </p>
            </div>

            {/* Popular Genres */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Top Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                    {topGenres.map((genre) => (
                        <Link
                            key={genre.slug}
                            href={`/browse/genre/${genre.slug}`}
                            className="group"
                        >
                            <Badge
                                variant="secondary"
                                className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                            >
                                {genre.name}
                                <span className="ml-1 text-xs opacity-60 group-hover:opacity-80">
                                    ({genre.count.toLocaleString()})
                                </span>
                            </Badge>
                        </Link>
                    ))}
                    <Link href="/browse" className="group">
                        <Badge
                            variant="outline"
                            className="cursor-pointer transition-colors hover:bg-muted"
                        >
                            View All Genres →
                        </Badge>
                    </Link>
                </div>
            </div>

            {/* Recent Years */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    By Year
                </h3>
                <div className="flex flex-wrap gap-2">
                    {recentYears.map((year) => (
                        <Link
                            key={year}
                            href={`/browse/year/${year}`}
                            className="group"
                        >
                            <Badge
                                variant="secondary"
                                className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                            >
                                {year}
                                {year === currentYear && (
                                    <span className="ml-1 text-xs opacity-60">
                                        (Current)
                                    </span>
                                )}
                            </Badge>
                        </Link>
                    ))}
                    <Link href="/browse" className="group">
                        <Badge
                            variant="outline"
                            className="cursor-pointer transition-colors hover:bg-muted"
                        >
                            View All Years →
                        </Badge>
                    </Link>
                </div>
            </div>

            {/* Current Seasons */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Seasonal Anime
                </h3>
                <div className="flex flex-wrap gap-2">
                    {SEASONS.map((season) => (
                        <Link
                            key={season.value}
                            href={`/browse?seasons=${season.value}&years=${currentYear}`}
                            className="group"
                        >
                            <Badge
                                variant="secondary"
                                className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                            >
                                {season.emoji} {season.label} {currentYear}
                            </Badge>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Formats */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    By Format
                </h3>
                <div className="flex flex-wrap gap-2">
                    {FORMATS.map((format) => (
                        <Link
                            key={format.value}
                            href={`/browse?formats=${format.value}`}
                            className="group"
                        >
                            <Badge
                                variant="secondary"
                                className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                            >
                                {format.label}
                            </Badge>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Popular Combinations */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Popular Combinations
                </h3>
                <div className="flex flex-wrap gap-2">
                    {/* Action anime from current year */}
                    <Link
                        href={`/browse?genres=action&years=${currentYear}`}
                        className="group"
                    >
                        <Badge
                            variant="secondary"
                            className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                            Action {currentYear}
                        </Badge>
                    </Link>
                    {/* Romance movies */}
                    <Link
                        href="/browse?genres=romance&formats=MOVIE"
                        className="group"
                    >
                        <Badge
                            variant="secondary"
                            className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                            Romance Movies
                        </Badge>
                    </Link>
                    {/* Currently airing */}
                    <Link
                        href="/browse?statuses=RELEASING"
                        className="group"
                    >
                        <Badge
                            variant="secondary"
                            className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                            🔴 Currently Airing
                        </Badge>
                    </Link>
                    {/* Fantasy TV series */}
                    <Link
                        href="/browse?genres=fantasy&formats=TV"
                        className="group"
                    >
                        <Badge
                            variant="secondary"
                            className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                            Fantasy TV Series
                        </Badge>
                    </Link>
                    {/* Sci-Fi from recent years */}
                    <Link
                        href={`/browse?genres=sci-fi&years=${currentYear}&years=${currentYear - 1}`}
                        className="group"
                    >
                        <Badge
                            variant="secondary"
                            className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                            Recent Sci-Fi
                        </Badge>
                    </Link>
                    {/* Comedy ONA */}
                    <Link
                        href="/browse?genres=comedy&formats=ONA"
                        className="group"
                    >
                        <Badge
                            variant="secondary"
                            className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                            Comedy ONAs
                        </Badge>
                    </Link>
                </div>
            </div>
        </section>
    );
}

