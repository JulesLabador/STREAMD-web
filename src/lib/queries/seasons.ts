/**
 * Season Query Functions
 *
 * Server-side data fetching functions for season-related data.
 * These are NOT server actions - they are regular async functions
 * meant to be called from Server Components only.
 */

import { createClient } from "@/lib/supabase/server";
import type {
    Anime,
    AnimeRow,
    AnimeSeason,
    AnimeWithPlanningCount,
    NextSeasonStats,
    SeasonInfo,
} from "@/types/anime";
import type { ActionResult, PaginatedResponse } from "@/types/common";
import { createSeasonSlug, transformAnimeRow } from "@/types/anime";

// =============================================
// Season Content Types
// =============================================

/**
 * AI-generated SEO content for a season page
 * Stored in the season_content database table
 */
export interface SeasonContent {
    /** Season identifier (WINTER, SPRING, SUMMER, FALL) */
    season: AnimeSeason;
    /** Year */
    year: number;
    /** URL slug (e.g., "winter-2026") */
    slug: string;
    /** SEO meta description (150-160 chars) */
    metaDescription: string | null;
    /** Short intro paragraph for the page */
    introParagraph: string | null;
    /** Full season summary (2-3 paragraphs) */
    fullSummary: string | null;
    /** When the content was generated */
    generatedAt: string | null;
    /** Model used to generate content */
    modelUsed: string | null;
}

/**
 * Database row type for season_content table
 */
interface SeasonContentRow {
    id: string;
    season: string;
    year: number;
    slug: string;
    meta_description: string | null;
    intro_paragraph: string | null;
    full_summary: string | null;
    generated_at: string | null;
    model_used: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Transforms a season_content database row to the domain type
 */
function transformSeasonContentRow(row: SeasonContentRow): SeasonContent {
    return {
        season: row.season as AnimeSeason,
        year: row.year,
        slug: row.slug,
        metaDescription: row.meta_description,
        introParagraph: row.intro_paragraph,
        fullSummary: row.full_summary,
        generatedAt: row.generated_at,
        modelUsed: row.model_used,
    };
}

// =============================================
// Season Content Functions
// =============================================

/**
 * Fetches AI-generated SEO content for a specific season
 *
 * @param slug - Season slug (e.g., "winter-2026")
 * @returns Season content or null if not found
 */
export async function getSeasonContent(
    slug: string
): Promise<ActionResult<SeasonContent | null>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("season_content")
            .select("*")
            .eq("slug", slug)
            .single();

        if (error) {
            // PGRST116 = not found, which is a valid case
            if (error.code === "PGRST116") {
                return { success: true, data: null };
            }
            console.error("Error fetching season content:", error);
            return { success: false, error: "Failed to fetch season content" };
        }

        return {
            success: true,
            data: transformSeasonContentRow(data as SeasonContentRow),
        };
    } catch (error) {
        console.error("Error fetching season content:", error);
        return { success: false, error: "Failed to fetch season content" };
    }
}

/**
 * Fetches AI-generated SEO content for a season by season/year
 *
 * @param season - The anime season
 * @param year - The year
 * @returns Season content or null if not found
 */
export async function getSeasonContentBySeasonYear(
    season: AnimeSeason,
    year: number
): Promise<ActionResult<SeasonContent | null>> {
    const slug = createSeasonSlug(season, year);
    return getSeasonContent(slug);
}

// =============================================
// Season Browse Functions
// =============================================

/**
 * Fetches all unique season/year combinations with anime counts
 * Sorted by year (descending) then season order
 *
 * Uses a raw SQL query with GROUP BY to get accurate counts
 * regardless of the number of anime in the database.
 *
 * @returns List of seasons with anime counts or error
 */
export async function getSeasons(): Promise<ActionResult<SeasonInfo[]>> {
    try {
        const supabase = await createClient();

        // Use raw SQL to get accurate counts with GROUP BY
        // This avoids the default row limit issue with regular selects
        const { data, error } = await supabase.rpc("get_season_counts");

        if (error) {
            // If the RPC function doesn&apos;t exist, fall back to manual counting
            // with pagination to ensure we get all rows
            console.warn(
                "RPC get_season_counts not found, using fallback method:",
                error.message
            );
            return await getSeasonsWithPagination();
        }

        const seasonOrder: Record<AnimeSeason, number> = {
            WINTER: 0,
            SPRING: 1,
            SUMMER: 2,
            FALL: 3,
        };

        // Transform RPC results to SeasonInfo
        const seasons: SeasonInfo[] = (data || [])
            .filter(
                (row: { season: string | null; season_year: number | null }) =>
                    row.season && row.season_year
            )
            .map(
                (row: {
                    season: string;
                    season_year: number;
                    anime_count: number;
                }) => ({
                    season: row.season as AnimeSeason,
                    year: row.season_year,
                    slug: createSeasonSlug(
                        row.season as AnimeSeason,
                        row.season_year
                    ),
                    animeCount: row.anime_count,
                })
            )
            .sort((a: SeasonInfo, b: SeasonInfo) => {
                if (a.year !== b.year) return b.year - a.year;
                return seasonOrder[b.season] - seasonOrder[a.season];
            });

        return { success: true, data: seasons };
    } catch (error) {
        console.error("Error fetching seasons:", error);
        return { success: false, error: "Failed to fetch seasons" };
    }
}

/**
 * Fallback function to get seasons with pagination
 * Used when the RPC function is not available
 *
 * Fetches all anime in batches to avoid the default row limit,
 * then counts them in memory.
 *
 * @returns List of seasons with anime counts or error
 */
async function getSeasonsWithPagination(): Promise<ActionResult<SeasonInfo[]>> {
    try {
        const supabase = await createClient();
        const pageSize = 1000;
        let page = 0;
        let hasMore = true;
        const allRows: Array<{
            season: string | null;
            season_year: number | null;
        }> = [];

        // Fetch all rows in batches
        while (hasMore) {
            const { data, error } = await supabase
                .from("anime")
                .select("season, season_year")
                .not("season", "is", null)
                .not("season_year", "is", null)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.error("Error fetching seasons page:", error);
                return { success: false, error: "Failed to fetch seasons" };
            }

            if (data && data.length > 0) {
                allRows.push(...data);
                hasMore = data.length === pageSize;
                page++;
            } else {
                hasMore = false;
            }
        }

        // Group by season/year and count
        const seasonMap = new Map<string, SeasonInfo>();
        const seasonOrder: Record<AnimeSeason, number> = {
            WINTER: 0,
            SPRING: 1,
            SUMMER: 2,
            FALL: 3,
        };

        for (const row of allRows) {
            if (!row.season || !row.season_year) continue;

            const key = `${row.season}-${row.season_year}`;
            const existing = seasonMap.get(key);

            if (existing) {
                existing.animeCount++;
            } else {
                seasonMap.set(key, {
                    season: row.season as AnimeSeason,
                    year: row.season_year,
                    slug: createSeasonSlug(
                        row.season as AnimeSeason,
                        row.season_year
                    ),
                    animeCount: 1,
                });
            }
        }

        // Convert to array and sort by year (desc) then season order
        const seasons = Array.from(seasonMap.values()).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return seasonOrder[b.season] - seasonOrder[a.season];
        });

        return { success: true, data: seasons };
    } catch (error) {
        console.error("Error fetching seasons with pagination:", error);
        return { success: false, error: "Failed to fetch seasons" };
    }
}

/**
 * Fetches anime for a specific season/year
 *
 * @param season - The anime season
 * @param year - The year
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated anime list or error
 */
export async function getAnimeBySeason(
    season: AnimeSeason,
    year: number,
    page: number = 1,
    pageSize: number = 24
): Promise<
    ActionResult<{ seasonInfo: SeasonInfo; anime: PaginatedResponse<Anime> }>
> {
    try {
        const validSeasons: AnimeSeason[] = [
            "WINTER",
            "SPRING",
            "SUMMER",
            "FALL",
        ];
        if (!validSeasons.includes(season)) {
            return {
                success: false,
                error: "Invalid season",
                code: "INVALID_INPUT",
            };
        }

        const validPage = Math.max(1, page);
        const validPageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (validPage - 1) * validPageSize;

        const supabase = await createClient();

        // Fetch anime with count
        const { data, error, count } = await supabase
            .from("anime")
            .select("*", { count: "exact" })
            .eq("season", season)
            .eq("season_year", year)
            .order("popularity", { ascending: true })
            .range(offset, offset + validPageSize - 1);

        if (error) {
            console.error("Error fetching anime by season:", error);
            return { success: false, error: "Failed to fetch anime" };
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / validPageSize);

        const animeList = (data as AnimeRow[]).map(transformAnimeRow);

        return {
            success: true,
            data: {
                seasonInfo: {
                    season,
                    year,
                    slug: createSeasonSlug(season, year),
                    animeCount: totalCount,
                },
                anime: {
                    data: animeList,
                    pagination: {
                        page: validPage,
                        pageSize: validPageSize,
                        totalCount,
                        totalPages,
                        hasNextPage: validPage < totalPages,
                        hasPreviousPage: validPage > 1,
                    },
                },
            },
        };
    } catch (error) {
        console.error("Error fetching anime by season:", error);
        return { success: false, error: "Failed to fetch anime" };
    }
}

// =============================================
// Home Page / Season Hub Functions
// =============================================

/**
 * Sort options for current season anime
 */
export type SeasonAnimeSortBy = "popularity" | "rating";

/**
 * Statistics for the current anime season
 * Used for the home page hero section
 */
export interface CurrentSeasonStats {
    /** Current season name */
    season: AnimeSeason;
    /** Current year */
    year: number;
    /** Total anime count for the season */
    totalAnime: number;
    /** Count of currently airing anime */
    airingCount: number;
    /** Count of new anime (not sequels) */
    newAnimeCount: number;
    /** Season slug for linking */
    slug: string;
}

/**
 * Determines the current anime season based on the current date
 *
 * @returns Object with current season and year
 */
function getCurrentSeasonInfo(): { season: AnimeSeason; year: number } {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let season: AnimeSeason;
    if (currentMonth >= 1 && currentMonth <= 3) {
        season = "WINTER";
    } else if (currentMonth >= 4 && currentMonth <= 6) {
        season = "SPRING";
    } else if (currentMonth >= 7 && currentMonth <= 9) {
        season = "SUMMER";
    } else {
        season = "FALL";
    }

    return { season, year: currentYear };
}

/**
 * Fetches anime for the current season with sorting options
 * Used for "This Season at a Glance" carousels
 *
 * @param sortBy - Sort by popularity or rating
 * @param limit - Maximum number of anime to return (default: 12)
 * @returns List of anime for the current season
 */
export async function getCurrentSeasonAnime(
    sortBy: SeasonAnimeSortBy = "popularity",
    limit: number = 12
): Promise<ActionResult<Anime[]>> {
    try {
        const validLimit = Math.min(50, Math.max(1, limit));
        const { season, year } = getCurrentSeasonInfo();

        const supabase = await createClient();

        // Build query based on sort option
        let query = supabase
            .from("anime")
            .select("*")
            .eq("season", season)
            .eq("season_year", year);

        // Apply sorting
        if (sortBy === "rating") {
            // Sort by rating descending, filter out null ratings
            query = query
                .not("average_rating", "is", null)
                .order("average_rating", { ascending: false });
        } else {
            // Sort by popularity ascending (lower = more popular)
            query = query.order("popularity", { ascending: true });
        }

        // Apply limit
        query = query.limit(validLimit);

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching current season anime:", error);
            return {
                success: false,
                error: "Failed to fetch current season anime",
            };
        }

        // Transform database rows to domain types
        const animeList = (data as AnimeRow[]).map(transformAnimeRow);

        return { success: true, data: animeList };
    } catch (error) {
        console.error("Error fetching current season anime:", error);
        return {
            success: false,
            error: "Failed to fetch current season anime",
        };
    }
}

/**
 * Fetches statistics for the current anime season
 * Used for the home page hero section seasonal context banner
 *
 * @returns Current season statistics
 */
export async function getSeasonalStats(): Promise<
    ActionResult<CurrentSeasonStats>
> {
    try {
        const { season, year } = getCurrentSeasonInfo();
        const supabase = await createClient();

        // Fetch all anime for current season
        const { data, error } = await supabase
            .from("anime")
            .select("id, status, titles")
            .eq("season", season)
            .eq("season_year", year);

        if (error) {
            console.error("Error fetching seasonal stats:", error);
            return { success: false, error: "Failed to fetch seasonal stats" };
        }

        const animeList = data || [];
        const totalAnime = animeList.length;

        // Count currently airing anime
        const airingCount = animeList.filter(
            (a) => a.status === "RELEASING"
        ).length;

        // Count new anime (not sequels) - check for sequel patterns in titles
        const sequelPatterns =
            /season\s*\d|part\s*\d|\d+(st|nd|rd|th)\s*season|cour\s*\d|ii|iii|iv|2nd|3rd|4th/i;

        const newAnimeCount = animeList.filter((a) => {
            const titles = a.titles as {
                english?: string;
                romaji?: string;
            };
            const titleToCheck = titles?.english || titles?.romaji || "";
            return !sequelPatterns.test(titleToCheck);
        }).length;

        return {
            success: true,
            data: {
                season,
                year,
                totalAnime,
                airingCount,
                newAnimeCount,
                slug: createSeasonSlug(season, year),
            },
        };
    } catch (error) {
        console.error("Error fetching seasonal stats:", error);
        return { success: false, error: "Failed to fetch seasonal stats" };
    }
}

// =============================================
// Upcoming Anime Functions
// =============================================

/**
 * Fetches anime that are currently releasing or not yet released
 * Sorted by start date (ascending) to show soonest first
 *
 * @param limit - Maximum number of anime to return (default: 12)
 * @returns List of upcoming/releasing anime or error
 */
export async function getUpcomingAnime(
    limit: number = 12
): Promise<ActionResult<Anime[]>> {
    try {
        const validLimit = Math.min(50, Math.max(1, limit));

        const supabase = await createClient();

        // Fetch anime with status RELEASING or NOT_YET_RELEASED
        // Sort by start_date ascending (soonest first), then by popularity
        const { data, error } = await supabase
            .from("anime")
            .select("*")
            .in("status", ["RELEASING", "NOT_YET_RELEASED"])
            .order("start_date", { ascending: true, nullsFirst: false })
            .order("popularity", { ascending: true })
            .limit(validLimit);

        if (error) {
            console.error("Error fetching upcoming anime:", error);
            return { success: false, error: "Failed to fetch upcoming anime" };
        }

        // Transform database rows to domain types
        const animeList = (data as AnimeRow[]).map(transformAnimeRow);

        return { success: true, data: animeList };
    } catch (error) {
        console.error("Error fetching upcoming anime:", error);
        return { success: false, error: "Failed to fetch upcoming anime" };
    }
}

/**
 * Gets anime counts for current and upcoming seasons
 * Used for the upcoming page hero section
 *
 * Uses the get_season_counts RPC function for accurate counts.
 *
 * @returns Object with current season info and next seasons info
 */
export async function getUpcomingSeasonStats(): Promise<
    ActionResult<{
        currentSeason: SeasonInfo | null;
        nextSeasons: SeasonInfo[];
    }>
> {
    try {
        const supabase = await createClient();

        // Get current date info
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Determine current season
        let currentSeasonName: AnimeSeason;
        if (currentMonth >= 1 && currentMonth <= 3) {
            currentSeasonName = "WINTER";
        } else if (currentMonth >= 4 && currentMonth <= 6) {
            currentSeasonName = "SPRING";
        } else if (currentMonth >= 7 && currentMonth <= 9) {
            currentSeasonName = "SUMMER";
        } else {
            currentSeasonName = "FALL";
        }

        // Use RPC function to get accurate counts
        const { data, error } = await supabase.rpc("get_season_counts");

        if (error) {
            console.error("Error fetching season stats:", error);
            return { success: false, error: "Failed to fetch season stats" };
        }

        const seasonOrder: Record<AnimeSeason, number> = {
            WINTER: 0,
            SPRING: 1,
            SUMMER: 2,
            FALL: 3,
        };

        // Transform RPC results to SeasonInfo and filter to current/future years
        const seasonMap = new Map<string, SeasonInfo>();

        for (const row of data || []) {
            if (!row.season || !row.season_year) continue;
            // Only include current and future years
            if (row.season_year < currentYear) continue;

            const key = `${row.season}-${row.season_year}`;
            seasonMap.set(key, {
                season: row.season as AnimeSeason,
                year: row.season_year,
                slug: createSeasonSlug(
                    row.season as AnimeSeason,
                    row.season_year
                ),
                animeCount: row.anime_count,
            });
        }

        // Convert to array and sort chronologically
        const allSeasons = Array.from(seasonMap.values()).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return seasonOrder[a.season] - seasonOrder[b.season];
        });

        // Find current season
        const currentSeasonKey = `${currentSeasonName}-${currentYear}`;
        const currentSeason = seasonMap.get(currentSeasonKey) || null;

        // Get next seasons (up to 3 future seasons after current)
        const currentSeasonIndex = allSeasons.findIndex(
            (s) => s.season === currentSeasonName && s.year === currentYear
        );

        let nextSeasons: SeasonInfo[] = [];
        if (currentSeasonIndex !== -1) {
            nextSeasons = allSeasons.slice(
                currentSeasonIndex + 1,
                currentSeasonIndex + 4
            );
        } else {
            // If current season not found, get all future seasons
            nextSeasons = allSeasons
                .filter((s) => {
                    if (s.year > currentYear) return true;
                    if (s.year === currentYear) {
                        return (
                            seasonOrder[s.season] >
                            seasonOrder[currentSeasonName]
                        );
                    }
                    return false;
                })
                .slice(0, 3);
        }

        return {
            success: true,
            data: {
                currentSeason,
                nextSeasons,
            },
        };
    } catch (error) {
        console.error("Error fetching upcoming season stats:", error);
        return { success: false, error: "Failed to fetch season stats" };
    }
}

/**
 * Gets detailed statistics for the next upcoming season
 * Includes user planning counts, format breakdown, and most anticipated anime
 *
 * @param limit - Maximum number of most anticipated anime to return (default: 6)
 * @returns Next season stats with most anticipated anime
 */
export async function getNextSeasonStats(
    limit: number = 6
): Promise<ActionResult<NextSeasonStats>> {
    try {
        const validLimit = Math.min(12, Math.max(1, limit));
        const supabase = await createClient();

        // Get current date info to determine next season
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Determine current and next season
        const seasonOrder: AnimeSeason[] = [
            "WINTER",
            "SPRING",
            "SUMMER",
            "FALL",
        ];
        let currentSeasonIndex: number;

        if (currentMonth >= 1 && currentMonth <= 3) {
            currentSeasonIndex = 0; // WINTER
        } else if (currentMonth >= 4 && currentMonth <= 6) {
            currentSeasonIndex = 1; // SPRING
        } else if (currentMonth >= 7 && currentMonth <= 9) {
            currentSeasonIndex = 2; // SUMMER
        } else {
            currentSeasonIndex = 3; // FALL
        }

        // Calculate next season
        const nextSeasonIndex = (currentSeasonIndex + 1) % 4;
        const nextSeason = seasonOrder[nextSeasonIndex];
        const nextYear = nextSeasonIndex === 0 ? currentYear + 1 : currentYear;

        // Calculate season start date and days until start
        const seasonStartMonths: Record<AnimeSeason, number> = {
            WINTER: 0, // January
            SPRING: 3, // April
            SUMMER: 6, // July
            FALL: 9, // October
        };
        const startDate = new Date(nextYear, seasonStartMonths[nextSeason], 1);
        const daysUntilStart = Math.max(
            0,
            Math.ceil(
                (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
        );

        // Fetch anime for next season
        const { data: animeData, error: animeError } = await supabase
            .from("anime")
            .select("*")
            .eq("season", nextSeason)
            .eq("season_year", nextYear);

        if (animeError) {
            console.error("Error fetching next season anime:", animeError);
            return {
                success: false,
                error: "Failed to fetch next season data",
            };
        }

        const animeCount = animeData?.length || 0;

        // Get anime IDs for this season
        const animeIds = (animeData || []).map((a) => a.id);

        // Calculate format breakdown
        const formatBreakdown: Record<string, number> = {};
        for (const anime of animeData || []) {
            const format = anime.format || "UNKNOWN";
            formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
        }

        // Count sequels vs new series (based on title patterns)
        // A sequel typically has "Season", "Part", "2nd", "3rd", etc. in the title
        let sequelCount = 0;
        let newSeriesCount = 0;
        const sequelPatterns =
            /season\s*\d|part\s*\d|\d+(st|nd|rd|th)\s*season|cour\s*\d|ii|iii|iv|2nd|3rd|4th/i;

        for (const anime of animeData || []) {
            const titles = anime.titles as {
                english?: string;
                romaji?: string;
            };
            const titleToCheck = titles?.english || titles?.romaji || "";
            if (sequelPatterns.test(titleToCheck)) {
                sequelCount++;
            } else {
                newSeriesCount++;
            }
        }

        // Calculate average popularity
        const totalPopularity = (animeData || []).reduce(
            (sum, a) => sum + (a.popularity || 0),
            0
        );
        const avgPopularity =
            animeCount > 0 ? Math.round(totalPopularity / animeCount) : 0;

        // Fetch planning counts for these anime from user_anime table
        const planningCounts = new Map<string, number>();
        let totalUsersPlanning = 0;
        let totalPlanningEntries = 0;

        if (animeIds.length > 0) {
            // Get count of users with PLANNING status for each anime
            const { data: planningData, error: planningError } = await supabase
                .from("user_anime")
                .select("anime_id, user_id")
                .in("anime_id", animeIds)
                .eq("status", "PLANNING")
                .eq("is_private", false);

            if (!planningError && planningData) {
                // Total planning entries
                totalPlanningEntries = planningData.length;

                // Count planning entries per anime
                for (const entry of planningData) {
                    const current = planningCounts.get(entry.anime_id) || 0;
                    planningCounts.set(entry.anime_id, current + 1);
                }

                // Count unique users planning any anime in this season
                const uniqueUsers = new Set(planningData.map((e) => e.user_id));
                totalUsersPlanning = uniqueUsers.size;
            }
        }

        // Transform anime and add planning counts
        const animeWithCounts: AnimeWithPlanningCount[] = (
            animeData as AnimeRow[]
        )
            .map((row) => ({
                ...transformAnimeRow(row),
                planningCount: planningCounts.get(row.id) || 0,
            }))
            // Sort by planning count (desc), then by popularity (asc)
            .sort((a, b) => {
                if (b.planningCount !== a.planningCount) {
                    return b.planningCount - a.planningCount;
                }
                return a.popularity - b.popularity;
            })
            .slice(0, validLimit);

        return {
            success: true,
            data: {
                season: {
                    season: nextSeason,
                    year: nextYear,
                    slug: createSeasonSlug(nextSeason, nextYear),
                    animeCount,
                },
                usersPlanning: totalUsersPlanning,
                totalPlanningEntries,
                mostAnticipated: animeWithCounts,
                daysUntilStart,
                startDate: startDate.toISOString(),
                formatBreakdown,
                sequelCount,
                newSeriesCount,
                avgPopularity,
            },
        };
    } catch (error) {
        console.error("Error fetching next season stats:", error);
        return { success: false, error: "Failed to fetch next season stats" };
    }
}
