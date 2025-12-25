import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import {
    ArrowLeft,
    Calendar,
    CalendarDays,
    Clock,
    ExternalLink,
    Film,
    Hash,
    Play,
    TrendingUp,
    Tv,
} from "lucide-react";
import { getAnimeBySlug } from "@/app/actions/anime";
import { getUserAnimeForAnime } from "@/app/actions/user";
import { createClient } from "@/lib/supabase/server";
import { InfoItem } from "@/components/anime/InfoItem";
import { RatingBarSegmented } from "@/components/anime/RatingBar";
import { TrackingButton } from "@/components/tracking";
import { AnimeJsonLd } from "@/components/seo/AnimeJsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    formatDate,
    formatSeason,
    formatStatus,
    getPlatformName,
    getStatusVariant,
} from "@/lib/anime-utils";
import type { AnimeWithRelations } from "@/types/anime";

/**
 * Base URL for the site (used for JSON-LD)
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://streamd.app";

/**
 * Page props with dynamic slug parameter
 */
interface AnimePageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
    params,
}: AnimePageProps): Promise<Metadata> {
    const { slug } = await params;
    const result = await getAnimeBySlug(slug);

    if (!result.success) {
        return {
            title: "Anime Not Found",
        };
    }

    const anime = result.data;
    const title = anime.titles.english || anime.titles.romaji;

    return {
        title: title,
        description:
            anime.synopsis?.slice(0, 160) || `Track ${title} on STREAMD`,
        openGraph: {
            title: `${title} | STREAMD`,
            description:
                anime.synopsis?.slice(0, 160) || `Track ${title} on STREAMD`,
            images: anime.coverImageUrl ? [{ url: anime.coverImageUrl }] : [],
            type: "website",
        },
    };
}

/**
 * Anime detail page
 *
 * Mobile-first, single-column layout displaying:
 * - Banner and cover images
 * - Titles (English, Romaji, Japanese)
 * - Status and rating badges
 * - Info card (format, episodes, duration, season)
 * - Synopsis card
 * - Details card (status, popularity, dates)
 * - Studios card
 * - Streaming links card
 * - External links
 */
export default async function AnimePage({ params }: AnimePageProps) {
    const { slug } = await params;
    const result = await getAnimeBySlug(slug);

    // Handle not found
    if (!result.success) {
        if (result.code === "NOT_FOUND") {
            notFound();
        }
        // For other errors, show error state
        return (
            <div className="min-h-screen p-4">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-foreground">
                            Something went wrong
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {result.error}
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/">Go back home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const anime: AnimeWithRelations = result.data;
    const displayTitle = anime.titles.english || anime.titles.romaji;
    const animeUrl = `${SITE_URL}/anime/${anime.slug}`;

    // Check if user is authenticated and fetch their tracking data
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const isAuthenticated = !!user;

    // Fetch user's tracking for this anime (if authenticated)
    const trackingResult = isAuthenticated
        ? await getUserAnimeForAnime(anime.id)
        : null;
    const initialTracking = trackingResult?.success
        ? trackingResult.data
        : null;

    return (
        <>
            {/* JSON-LD Structured Data for SEO */}
            <AnimeJsonLd anime={anime} url={animeUrl} />

            <div className="min-h-screen">
                {/* Banner image - full width, max 40vh */}
                {anime.bannerImageUrl && (
                    <div className="relative h-[30vh] w-full overflow-hidden sm:h-[35vh] md:h-[40vh]">
                        <Image
                            src={anime.bannerImageUrl}
                            alt={`${displayTitle} banner`}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
                    </div>
                )}

                {/* Main container - mobile first padding */}
                <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
                    {/* Back button */}
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="mb-6 -ml-2 h-10"
                    >
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Browse
                        </Link>
                    </Button>

                    {/* Content sections with consistent spacing */}
                    <div className="space-y-6">
                        {/* ===== HERO SECTION (NO CARD) ===== */}
                        <section className="space-y-4">
                            {/* Cover image - full width on mobile */}
                            <div className="relative mx-auto aspect-3/4 w-full max-w-[280px] overflow-hidden rounded-xl bg-muted shadow-lg sm:max-w-[320px]">
                                {anime.coverImageUrl ? (
                                    <Image
                                        src={anime.coverImageUrl}
                                        alt={displayTitle}
                                        fill
                                        className="object-cover"
                                        priority
                                        sizes="(max-width: 640px) 280px, 320px"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-secondary">
                                        <span className="text-6xl">🎬</span>
                                    </div>
                                )}
                            </div>

                            {/* Titles - centered on mobile */}
                            <div className="text-center">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    {displayTitle}
                                </h1>

                                {/* Alternative titles */}
                                {anime.titles.english &&
                                    anime.titles.romaji !==
                                        anime.titles.english && (
                                        <p className="mt-1 text-base text-muted-foreground">
                                            {anime.titles.romaji}
                                        </p>
                                    )}
                                {anime.titles.japanese && (
                                    <p className="mt-1 text-sm text-muted-foreground/70">
                                        {anime.titles.japanese}
                                    </p>
                                )}
                            </div>

                            {/* Status badge - centered */}
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <Badge variant={getStatusVariant(anime.status)}>
                                    {formatStatus(anime.status)}
                                </Badge>
                                <Badge variant="outline">{anime.format}</Badge>
                            </div>

                            {/* Rating bar - Segmented blocks display */}
                            {anime.averageRating !== null && (
                                <div className="pt-2">
                                    <RatingBarSegmented
                                        rating={anime.averageRating}
                                    />
                                </div>
                            )}

                            {/* Tracking button */}
                            <div className="flex justify-center pt-2">
                                <TrackingButton
                                    animeId={anime.id}
                                    animeTitle={displayTitle}
                                    episodeCount={anime.episodeCount}
                                    isAuthenticated={isAuthenticated}
                                    initialTracking={initialTracking}
                                />
                            </div>
                        </section>

                        {/* ===== INFO CARD ===== */}
                        <Card className="border-0">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {/* Format */}
                                    <InfoItem
                                        icon={
                                            anime.format === "MOVIE" ? Film : Tv
                                        }
                                        label="Format"
                                        value={anime.format}
                                    />

                                    {/* Episodes */}
                                    <InfoItem
                                        icon={Hash}
                                        label="Episodes"
                                        value={
                                            anime.episodeCount?.toString() ||
                                            "TBA"
                                        }
                                    />

                                    {/* Duration */}
                                    <InfoItem
                                        icon={Clock}
                                        label="Duration"
                                        value={
                                            anime.episodeDuration
                                                ? `${anime.episodeDuration} min`
                                                : "TBA"
                                        }
                                    />

                                    {/* Season */}
                                    <InfoItem
                                        icon={Calendar}
                                        label="Season"
                                        value={formatSeason(
                                            anime.season,
                                            anime.seasonYear
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* ===== SYNOPSIS CARD ===== */}
                        {anime.synopsis && (
                            <Card className="border-0">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">
                                        Synopsis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                                        {anime.synopsis}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* ===== DETAILS CARD ===== */}
                        <Card className="border-0">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {/* Status */}
                                    <InfoItem
                                        icon={Play}
                                        label="Status"
                                        value={formatStatus(anime.status)}
                                    />

                                    {/* Popularity */}
                                    <InfoItem
                                        icon={TrendingUp}
                                        label="Popularity"
                                        value={`#${anime.popularity.toLocaleString()}`}
                                    />

                                    {/* Start Date */}
                                    <InfoItem
                                        icon={CalendarDays}
                                        label="Start Date"
                                        value={formatDate(anime.startDate)}
                                    />

                                    {/* End Date */}
                                    <InfoItem
                                        icon={CalendarDays}
                                        label="End Date"
                                        value={
                                            anime.status === "RELEASING"
                                                ? "Ongoing"
                                                : formatDate(anime.endDate)
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* ===== STUDIOS CARD ===== */}
                        {anime.studios.length > 0 && (
                            <Card className="border-0">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">
                                        Studios
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {anime.studios.map((studio) => (
                                            <Badge
                                                key={studio.id}
                                                variant="secondary"
                                            >
                                                {studio.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* ===== STREAMING LINKS CARD ===== */}
                        {anime.streamingLinks.length > 0 && (
                            <Card className="border-0">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">
                                        Where to Watch
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {anime.streamingLinks.map((link) => (
                                            <Button
                                                key={link.id}
                                                variant="secondary"
                                                size="sm"
                                                asChild
                                            >
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="gap-2"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    {getPlatformName(
                                                        link.platform
                                                    )}
                                                </a>
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* ===== EXTERNAL LINKS (NO CARD) ===== */}
                        {(anime.malId || anime.anilistId || anime.kitsuId) && (
                            <section className="pt-2">
                                <p className="mb-3 text-sm text-muted-foreground">
                                    External Links
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {anime.malId && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={`https://myanimelist.net/anime/${anime.malId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                MyAnimeList
                                            </a>
                                        </Button>
                                    )}
                                    {anime.anilistId && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={`https://anilist.co/anime/${anime.anilistId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                AniList
                                            </a>
                                        </Button>
                                    )}
                                    {anime.kitsuId && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={`https://kitsu.io/anime/${anime.kitsuId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Kitsu
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
