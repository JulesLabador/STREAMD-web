import { getServerSideSitemap, ISitemapField } from "next-sitemap";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side sitemap generation for dynamic routes
 * This generates sitemap entries for all anime, genres, studios, seasons, and platforms
 * at request time, ensuring all database content is indexed
 */
export async function GET() {
    const siteUrl = process.env.SITE_URL || "https://www.streamdanime.io";

    // Create a Supabase client for server-side data fetching
    // Using service role or anon key for read-only operations
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    );

    const fields: ISitemapField[] = [];
    const now = new Date().toISOString();

    try {
        // Fetch all anime slugs
        const { data: animeData } = await supabase
            .from("anime")
            .select("slug, updated_at")
            .order("popularity", { ascending: true });

        if (animeData) {
            for (const anime of animeData) {
                fields.push({
                    loc: `${siteUrl}/anime/${anime.slug}`,
                    lastmod: anime.updated_at || now,
                    changefreq: "weekly",
                    priority: 0.7,
                });
            }
        }

        // Fetch all genre slugs
        const { data: genreData } = await supabase
            .from("genres")
            .select("slug")
            .order("name", { ascending: true });

        if (genreData) {
            for (const genre of genreData) {
                fields.push({
                    loc: `${siteUrl}/genre/${genre.slug}`,
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.8,
                });
            }
        }

        // Fetch all studio slugs
        const { data: studioData } = await supabase
            .from("studios")
            .select("slug")
            .order("name", { ascending: true });

        if (studioData) {
            for (const studio of studioData) {
                fields.push({
                    loc: `${siteUrl}/studio/${studio.slug}`,
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.8,
                });
            }
        }

        // Fetch all unique season/year combinations
        const { data: seasonData } = await supabase
            .from("anime")
            .select("season, season_year")
            .not("season", "is", null)
            .not("season_year", "is", null);

        if (seasonData) {
            // Get unique season/year combinations
            const seasonSet = new Set<string>();
            for (const row of seasonData) {
                if (row.season && row.season_year) {
                    const slug = `${row.season.toLowerCase()}-${
                        row.season_year
                    }`;
                    seasonSet.add(slug);
                }
            }

            for (const seasonSlug of seasonSet) {
                fields.push({
                    loc: `${siteUrl}/season/${seasonSlug}`,
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.8,
                });
            }
        }

        // Fetch all unique streaming platforms
        const { data: platformData } = await supabase
            .from("streaming_links")
            .select("platform");

        if (platformData) {
            // Get unique platforms
            const platformSet = new Set<string>();
            for (const row of platformData) {
                if (row.platform) {
                    // Convert platform enum to slug (e.g., CRUNCHYROLL -> crunchyroll)
                    platformSet.add(row.platform.toLowerCase());
                }
            }

            for (const platformSlug of platformSet) {
                fields.push({
                    loc: `${siteUrl}/platforms/${platformSlug}`,
                    lastmod: now,
                    changefreq: "weekly",
                    priority: 0.8,
                });
            }
        }
    } catch (error) {
        console.error("Error generating server sitemap:", error);
    }

    return getServerSideSitemap(fields);
}
