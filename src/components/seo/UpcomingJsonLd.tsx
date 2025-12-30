import type { Anime, SeasonInfo } from "@/types/anime";

/**
 * Props for the UpcomingJsonLd component
 */
interface UpcomingJsonLdProps {
    /** List of upcoming/airing anime */
    anime: Anime[];
    /** Current season info */
    currentSeason: SeasonInfo | null;
    /** Next seasons info */
    nextSeasons: SeasonInfo[];
    /** Base URL of the site */
    siteUrl: string;
}

/**
 * Season configuration for display names
 */
const SEASON_NAMES: Record<string, string> = {
    WINTER: "Winter",
    SPRING: "Spring",
    SUMMER: "Summer",
    FALL: "Fall",
};

/**
 * Generates JSON-LD structured data for the upcoming anime page
 *
 * Uses ItemList schema to represent the collection of upcoming anime,
 * which helps search engines understand the page structure and
 * potentially display rich results.
 */
export function UpcomingJsonLd({
    anime,
    currentSeason,
    nextSeasons,
    siteUrl,
}: UpcomingJsonLdProps) {
    const currentYear = new Date().getFullYear();

    // Build the main ItemList schema for upcoming anime
    const itemListSchema = buildItemListSchema(anime, siteUrl);

    // Build the WebPage schema with breadcrumbs
    const webPageSchema = buildWebPageSchema(
        currentSeason,
        nextSeasons,
        siteUrl,
        currentYear
    );

    // Combine schemas into an array
    const schemas = [itemListSchema, webPageSchema];

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />
    );
}

/**
 * Builds ItemList schema for the anime collection
 * This helps search engines understand the list structure
 */
function buildItemListSchema(
    anime: Anime[],
    siteUrl: string
): Record<string, unknown> {
    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Upcoming Anime",
        description: "List of upcoming and currently airing anime series",
        numberOfItems: anime.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
    };

    // Add list items with position
    if (anime.length > 0) {
        schema.itemListElement = anime.map((item, index) => {
            const displayTitle = item.titles.english || item.titles.romaji;
            const isMovie = item.format === "MOVIE";

            const listItem: Record<string, unknown> = {
                "@type": "ListItem",
                position: index + 1,
                item: {
                    "@type": isMovie ? "Movie" : "TVSeries",
                    name: displayTitle,
                    url: `${siteUrl}/anime/${item.slug}`,
                },
            };

            // Add image if available
            if (item.coverImageUrl) {
                (listItem.item as Record<string, unknown>).image =
                    item.coverImageUrl;
            }

            // Add description if available
            if (item.synopsis) {
                (listItem.item as Record<string, unknown>).description =
                    item.synopsis.slice(0, 200) +
                    (item.synopsis.length > 200 ? "..." : "");
            }

            // Add date published for upcoming items
            if (item.startDate) {
                (listItem.item as Record<string, unknown>).datePublished =
                    item.startDate;
            }

            // Add rating if available
            if (item.averageRating !== null) {
                (listItem.item as Record<string, unknown>).aggregateRating = {
                    "@type": "AggregateRating",
                    ratingValue: item.averageRating,
                    bestRating: 10,
                    worstRating: 0,
                };
            }

            return listItem;
        });
    }

    return schema;
}

/**
 * Builds WebPage schema with navigation elements
 * Helps search engines understand page context and navigation
 */
function buildWebPageSchema(
    currentSeason: SeasonInfo | null,
    nextSeasons: SeasonInfo[],
    siteUrl: string,
    currentYear: number
): Record<string, unknown> {
    const seasonName = currentSeason
        ? `${SEASON_NAMES[currentSeason.season]} ${currentSeason.year}`
        : `${currentYear}`;

    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Upcoming Anime ${currentYear} - New Releases & Schedule`,
        description: `Discover upcoming anime for ${seasonName} and beyond. Browse new anime releases, airing schedules, and plan your watchlist.`,
        url: `${siteUrl}/upcoming`,
        isPartOf: {
            "@type": "WebSite",
            name: "STREAMD",
            url: siteUrl,
        },
    };

    // Add breadcrumb navigation
    schema.breadcrumb = {
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: siteUrl,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Upcoming Anime",
                item: `${siteUrl}/upcoming`,
            },
        ],
    };

    // Add related links (seasons)
    const relatedLinks: Array<Record<string, unknown>> = [];

    if (currentSeason) {
        relatedLinks.push({
            "@type": "WebPage",
            name: `${SEASON_NAMES[currentSeason.season]} ${
                currentSeason.year
            } Anime`,
            url: `${siteUrl}/season/${currentSeason.slug}`,
        });
    }

    for (const season of nextSeasons) {
        relatedLinks.push({
            "@type": "WebPage",
            name: `${SEASON_NAMES[season.season]} ${season.year} Anime`,
            url: `${siteUrl}/season/${season.slug}`,
        });
    }

    if (relatedLinks.length > 0) {
        schema.relatedLink = relatedLinks;
    }

    // Add main entity (the list)
    schema.mainEntity = {
        "@type": "ItemList",
        name: "Upcoming Anime List",
        url: `${siteUrl}/upcoming`,
    };

    return schema;
}
