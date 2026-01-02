import type { Anime, SeasonInfo } from "@/types/anime";
import type { SeasonContent } from "@/lib/queries/seasons";

/**
 * Props for the SeasonJsonLd component
 */
interface SeasonJsonLdProps {
    /** Season information */
    seasonInfo: SeasonInfo;
    /** AI-generated SEO content (optional) */
    content: SeasonContent | null;
    /** Top anime for the season (by popularity) */
    topAnime: Anime[];
    /** Base URL of the site */
    siteUrl: string;
}

/**
 * Season configuration for display names and date ranges
 */
const SEASON_CONFIG: Record<
    string,
    { name: string; months: string; startMonth: number }
> = {
    WINTER: { name: "Winter", months: "January - March", startMonth: 1 },
    SPRING: { name: "Spring", months: "April - June", startMonth: 4 },
    SUMMER: { name: "Summer", months: "July - September", startMonth: 7 },
    FALL: { name: "Fall", months: "October - December", startMonth: 10 },
};

/**
 * Generates JSON-LD structured data for anime season pages
 *
 * Uses CollectionPage schema with ItemList to represent the season&apos;s anime.
 * This helps search engines understand the page structure and potentially
 * display rich results for queries like "anime winter 2026".
 *
 * @see https://schema.org/CollectionPage
 * @see https://schema.org/ItemList
 */
export function SeasonJsonLd({
    seasonInfo,
    content,
    topAnime,
    siteUrl,
}: SeasonJsonLdProps) {
    const config = SEASON_CONFIG[seasonInfo.season];
    const seasonName = `${config.name} ${seasonInfo.year}`;
    const pageUrl = `${siteUrl}/season/${seasonInfo.slug}`;

    // Build description from AI content or fallback
    const description =
        content?.metaDescription ||
        `Browse ${seasonInfo.animeCount} anime from ${seasonName} (${config.months}). Discover popular titles and track your favorites.`;

    // Build the CollectionPage schema
    const collectionPageSchema = buildCollectionPageSchema(
        seasonName,
        description,
        pageUrl,
        siteUrl,
        seasonInfo,
        config
    );

    // Build the ItemList schema for top anime
    const itemListSchema = buildItemListSchema(
        seasonName,
        topAnime,
        siteUrl,
        seasonInfo.animeCount
    );

    // Build BreadcrumbList schema
    const breadcrumbSchema = buildBreadcrumbSchema(seasonName, pageUrl, siteUrl);

    // Combine all schemas
    const schemas = [collectionPageSchema, itemListSchema, breadcrumbSchema];

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />
    );
}

/**
 * Builds CollectionPage schema for the season page
 */
function buildCollectionPageSchema(
    seasonName: string,
    description: string,
    pageUrl: string,
    siteUrl: string,
    seasonInfo: SeasonInfo,
    config: { name: string; months: string; startMonth: number }
): Record<string, unknown> {
    // Calculate temporal coverage dates
    const startDate = new Date(seasonInfo.year, config.startMonth - 1, 1);
    const endMonth = config.startMonth + 2;
    const endYear =
        endMonth > 12 ? seasonInfo.year + 1 : seasonInfo.year;
    const endDate = new Date(
        endYear,
        (endMonth - 1) % 12,
        endMonth === 3 ? 31 : endMonth === 6 ? 30 : endMonth === 9 ? 30 : 31
    );

    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${seasonName} Anime`,
        description,
        url: pageUrl,
        isPartOf: {
            "@type": "WebSite",
            name: "STREAMD",
            url: siteUrl,
        },
        about: {
            "@type": "Thing",
            name: `${seasonName} Anime Season`,
            description: `Anime that aired during ${config.name} ${seasonInfo.year} (${config.months})`,
        },
        temporalCoverage: `${startDate.toISOString().split("T")[0]}/${endDate.toISOString().split("T")[0]}`,
        numberOfItems: seasonInfo.animeCount,
        inLanguage: "en",
        keywords: [
            `${seasonName.toLowerCase()} anime`,
            `anime ${seasonInfo.year}`,
            `${config.name.toLowerCase()} ${seasonInfo.year} anime`,
            `new anime ${config.months.split(" - ")[0].toLowerCase()} ${seasonInfo.year}`,
            "anime season",
            "anime schedule",
        ].join(", "),
    };
}

/**
 * Builds ItemList schema for the top anime in the season
 */
function buildItemListSchema(
    seasonName: string,
    topAnime: Anime[],
    siteUrl: string,
    totalCount: number
): Record<string, unknown> {
    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${seasonName} Anime`,
        description: `Top anime from ${seasonName} by popularity`,
        numberOfItems: totalCount,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
    };

    // Add list items for top anime (limit to 10 for structured data)
    if (topAnime.length > 0) {
        schema.itemListElement = topAnime.slice(0, 10).map((anime, index) => {
            const displayTitle = anime.titles.english || anime.titles.romaji;
            const isMovie = anime.format === "MOVIE";
            const animeUrl = `${siteUrl}/anime/${anime.shortId || anime.slug}`;

            const listItem: Record<string, unknown> = {
                "@type": "ListItem",
                position: index + 1,
                item: {
                    "@type": isMovie ? "Movie" : "TVSeries",
                    name: displayTitle,
                    url: animeUrl,
                },
            };

            // Add image if available
            if (anime.coverImageUrl) {
                (listItem.item as Record<string, unknown>).image =
                    anime.coverImageUrl;
            }

            // Add description if available
            if (anime.synopsis) {
                (listItem.item as Record<string, unknown>).description =
                    anime.synopsis.slice(0, 200) +
                    (anime.synopsis.length > 200 ? "..." : "");
            }

            // Add date published
            if (anime.startDate) {
                (listItem.item as Record<string, unknown>).datePublished =
                    anime.startDate;
            }

            // Add rating if available
            if (anime.averageRating !== null) {
                (listItem.item as Record<string, unknown>).aggregateRating = {
                    "@type": "AggregateRating",
                    ratingValue: anime.averageRating,
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
 * Builds BreadcrumbList schema for navigation
 */
function buildBreadcrumbSchema(
    seasonName: string,
    pageUrl: string,
    siteUrl: string
): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
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
                name: "Seasons",
                item: `${siteUrl}/season`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: `${seasonName} Anime`,
                item: pageUrl,
            },
        ],
    };
}

