import { TrendingUp, Star } from "lucide-react";
import { AnimeCarousel } from "./AnimeCarousel";
import type { Anime, AnimeSeason } from "@/types/anime";

/**
 * Props for SeasonSection
 */
interface SeasonSectionProps {
    /** Current season name */
    season: AnimeSeason;
    /** Current year */
    year: number;
    /** Season slug for linking */
    slug: string;
    /** Most popular anime this season */
    popularAnime: Anime[];
    /** Highest rated anime this season */
    topRatedAnime: Anime[];
}

/**
 * Season display names
 */
const SEASON_NAMES: Record<AnimeSeason, string> = {
    WINTER: "Winter",
    SPRING: "Spring",
    SUMMER: "Summer",
    FALL: "Fall",
};

/**
 * SeasonSection - "This Season at a Glance" section
 *
 * Displays multiple carousels showcasing the current season:
 * - Most Popular This Season (by popularity score)
 * - Highest Rated (by average rating)
 *
 * Each carousel links to the full season page for exploration.
 */
export function SeasonSection({
    season,
    year,
    slug,
    popularAnime,
    topRatedAnime,
}: SeasonSectionProps) {
    const seasonName = `${SEASON_NAMES[season]} ${year}`;

    return (
        <section className="space-y-6 sm:space-y-10">
            {/* Section header */}
            <div className="px-4 sm:px-6 lg:px-8">
                <h2>{seasonName} at a Glance</h2>
                <p className="text-muted-foreground">
                    Explore what&apos;s airing this season
                </p>
            </div>

            {/* Most Popular carousel */}
            {popularAnime.length > 0 && (
                <AnimeCarousel
                    title="Most Popular"
                    subtitle="Top anime by community engagement"
                    anime={popularAnime}
                    viewAllHref={`/season/${slug}?sort=popularity`}
                />
            )}

            {/* Highest Rated carousel */}
            {topRatedAnime.length > 0 && (
                <AnimeCarousel
                    title="Highest Rated"
                    subtitle="Top anime by rating score"
                    anime={topRatedAnime}
                    viewAllHref={`/season/${slug}?sort=rating`}
                />
            )}
        </section>
    );
}
