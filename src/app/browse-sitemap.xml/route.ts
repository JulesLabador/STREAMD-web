import { getServerSideSitemap, ISitemapField } from "next-sitemap";
import { createClient } from "@supabase/supabase-js";

/**
 * Helper to encode URL for XML sitemap
 * Replaces & with &amp; for valid XML
 */
function encodeUrlForXml(url: string): string {
    return url.replace(/&/g, "&amp;");
}

/**
 * Valid anime seasons for sitemap generation
 */
const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;

/**
 * Valid anime formats for sitemap generation
 */
const FORMATS = ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"] as const;

/**
 * Valid anime statuses for sitemap generation
 */
const STATUSES = ["RELEASING", "FINISHED", "NOT_YET_RELEASED"] as const;

/**
 * Server-side sitemap generation specifically for browse pages
 * This generates sitemap entries for all browse page filter combinations
 * including clean URLs and query parameter variations
 *
 * Separated from the main sitemap to:
 * 1. Keep sitemaps organized by content type
 * 2. Allow for more comprehensive browse page coverage
 * 3. Avoid hitting sitemap size limits
 */
export async function GET() {
    const siteUrl = process.env.SITE_URL || "https://www.streamdanime.io";

    // Create a Supabase client for server-side data fetching
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    );

    const fields: ISitemapField[] = [];
    const now = new Date().toISOString();
    const currentYear = new Date().getFullYear();

    try {
        // Fetch all genre slugs
        const { data: genreData } = await supabase
            .from("genres")
            .select("slug, name")
            .order("name", { ascending: true });

        // Fetch all unique years from anime data
        const { data: yearData } = await supabase
            .from("anime")
            .select("season_year")
            .not("season_year", "is", null);

        // Get unique years
        const yearSet = new Set<number>();
        if (yearData) {
            for (const row of yearData) {
                if (row.season_year) {
                    yearSet.add(row.season_year);
                }
            }
        }
        const allYears = Array.from(yearSet).sort((a, b) => b - a);

        // ============================================================
        // BASE BROWSE PAGE
        // ============================================================
        fields.push({
            loc: `${siteUrl}/browse`,
            lastmod: now,
            changefreq: "daily",
            priority: 0.9,
        });

        // ============================================================
        // CLEAN URL GENRE PAGES: /browse/genre/{slug}
        // These are the primary SEO-friendly URLs for genre browsing
        // ============================================================
        if (genreData) {
            for (const genre of genreData) {
                fields.push({
                    loc: `${siteUrl}/browse/genre/${genre.slug}`,
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.85,
                });
            }
        }

        // ============================================================
        // CLEAN URL YEAR PAGES: /browse/year/{year}
        // Include ALL years in the database for comprehensive coverage
        // ============================================================
        for (const year of allYears) {
            const isRecent = year >= currentYear - 2;
            const isVeryOld = year < 1990;

            fields.push({
                loc: `${siteUrl}/browse/year/${year}`,
                lastmod: now,
                changefreq: isRecent ? "daily" : "weekly",
                priority: isRecent ? 0.9 : isVeryOld ? 0.5 : 0.7,
            });
        }

        // ============================================================
        // QUERY PARAM GENRE PAGES: /browse?genres={slug}
        // For backwards compatibility and alternative access
        // ============================================================
        if (genreData) {
            for (const genre of genreData) {
                fields.push({
                    loc: `${siteUrl}/browse?genres=${genre.slug}`,
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.8,
                });
            }
        }

        // ============================================================
        // QUERY PARAM YEAR PAGES: /browse?years={year}
        // Include ALL years for comprehensive coverage
        // ============================================================
        for (const year of allYears) {
            const isRecent = year >= currentYear - 2;
            const isVeryOld = year < 1990;

            fields.push({
                loc: `${siteUrl}/browse?years=${year}`,
                lastmod: now,
                changefreq: isRecent ? "daily" : "weekly",
                priority: isRecent ? 0.85 : isVeryOld ? 0.45 : 0.65,
            });
        }

        // ============================================================
        // SEASON PAGES: /browse?seasons={season}
        // ============================================================
        for (const season of SEASONS) {
            fields.push({
                loc: `${siteUrl}/browse?seasons=${season}`,
                lastmod: now,
                changefreq: "weekly",
                priority: 0.7,
            });
        }

        // ============================================================
        // FORMAT PAGES: /browse?formats={format}
        // ============================================================
        for (const format of FORMATS) {
            fields.push({
                loc: `${siteUrl}/browse?formats=${format}`,
                lastmod: now,
                changefreq: "weekly",
                priority: 0.7,
            });
        }

        // ============================================================
        // STATUS PAGES: /browse?statuses={status}
        // ============================================================
        for (const status of STATUSES) {
            fields.push({
                loc: `${siteUrl}/browse?statuses=${status}`,
                lastmod: now,
                changefreq: status === "RELEASING" ? "daily" : "weekly",
                priority: status === "RELEASING" ? 0.8 : 0.65,
            });
        }

        // ============================================================
        // GENRE + YEAR COMBINATIONS
        // All genres × recent 5 years for high-value landing pages
        // ============================================================
        const recentYears = allYears.slice(0, 5);

        if (genreData) {
            for (const genre of genreData) {
                for (const year of recentYears) {
                    fields.push({
                        loc: encodeUrlForXml(
                            `${siteUrl}/browse?genres=${genre.slug}&years=${year}`
                        ),
                        lastmod: now,
                        changefreq: "weekly",
                        priority: 0.75,
                    });
                }
            }
        }

        // ============================================================
        // SEASON + YEAR COMBINATIONS
        // All seasons × recent 5 years (e.g., "Winter 2024 Anime")
        // ============================================================
        for (const season of SEASONS) {
            for (const year of recentYears) {
                fields.push({
                    loc: encodeUrlForXml(
                        `${siteUrl}/browse?seasons=${season}&years=${year}`
                    ),
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.75,
                });
            }
        }

        // ============================================================
        // FORMAT + YEAR COMBINATIONS
        // All formats × recent 5 years (e.g., "2024 Anime Movies")
        // ============================================================
        for (const format of FORMATS) {
            for (const year of recentYears) {
                fields.push({
                    loc: encodeUrlForXml(
                        `${siteUrl}/browse?formats=${format}&years=${year}`
                    ),
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.7,
                });
            }
        }

        // ============================================================
        // GENRE + FORMAT COMBINATIONS
        // Top genres × all formats (e.g., "Action Movies")
        // ============================================================
        const topGenres = genreData?.slice(0, 15) || [];

        for (const genre of topGenres) {
            for (const format of FORMATS) {
                fields.push({
                    loc: encodeUrlForXml(
                        `${siteUrl}/browse?genres=${genre.slug}&formats=${format}`
                    ),
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.7,
                });
            }
        }

        // ============================================================
        // GENRE + STATUS COMBINATIONS
        // Top genres × key statuses (e.g., "Currently Airing Action")
        // ============================================================
        for (const genre of topGenres) {
            for (const status of STATUSES) {
                fields.push({
                    loc: encodeUrlForXml(
                        `${siteUrl}/browse?genres=${genre.slug}&statuses=${status}`
                    ),
                    lastmod: now,
                    changefreq: status === "RELEASING" ? "daily" : "weekly",
                    priority: status === "RELEASING" ? 0.75 : 0.65,
                });
            }
        }

        // ============================================================
        // TRIPLE COMBINATIONS (High-value specific pages)
        // Top 10 genres × recent 3 years × TV format
        // ============================================================
        const top10Genres = genreData?.slice(0, 10) || [];
        const last3Years = allYears.slice(0, 3);

        for (const genre of top10Genres) {
            for (const year of last3Years) {
                // Genre + Year + TV
                fields.push({
                    loc: encodeUrlForXml(
                        `${siteUrl}/browse?genres=${genre.slug}&years=${year}&formats=TV`
                    ),
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.7,
                });

                // Genre + Year + MOVIE
                fields.push({
                    loc: encodeUrlForXml(
                        `${siteUrl}/browse?genres=${genre.slug}&years=${year}&formats=MOVIE`
                    ),
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.7,
                });
            }
        }

        // ============================================================
        // SEASON + YEAR + STATUS (Current season tracking)
        // All seasons × current year × RELEASING status
        // ============================================================
        for (const season of SEASONS) {
            fields.push({
                loc: encodeUrlForXml(
                    `${siteUrl}/browse?seasons=${season}&years=${currentYear}&statuses=RELEASING`
                ),
                lastmod: now,
                changefreq: "daily",
                priority: 0.8,
            });
        }
    } catch (error) {
        console.error("Error generating browse sitemap:", error);
    }

    return getServerSideSitemap(fields);
}
