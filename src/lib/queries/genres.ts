/**
 * Genre Query Functions
 *
 * Server-side data fetching functions for genre-related data.
 * These are NOT server actions - they are regular async functions
 * meant to be called from Server Components only.
 */

import { createClient } from "@/lib/supabase/server";
import type { Anime, AnimeRow, GenreWithCount } from "@/types/anime";
import type { ActionResult, PaginatedResponse } from "@/types/common";
import { transformAnimeRow } from "@/types/anime";

// =============================================
// Genre Browse Functions
// =============================================

/**
 * Fetches all genres with their anime counts
 * Sorted alphabetically by name
 *
 * @returns List of genres with anime counts or error
 */
export async function getGenres(): Promise<ActionResult<GenreWithCount[]>> {
    try {
        const supabase = await createClient();

        // Fetch genres with anime count via junction table
        const { data, error } = await supabase
            .from("genres")
            .select(
                `
        id,
        name,
        slug,
        anime_genres(count)
      `
            )
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching genres:", error);
            return { success: false, error: "Failed to fetch genres" };
        }

        // Transform to GenreWithCount
        const genres: GenreWithCount[] = (data || []).map((genre) => ({
            id: genre.id,
            name: genre.name,
            slug: genre.slug,
            animeCount:
                (genre.anime_genres as Array<{ count: number }>)?.[0]?.count ||
                0,
        }));

        // Filter out genres with no anime
        const genresWithAnime = genres.filter((g) => g.animeCount > 0);

        return { success: true, data: genresWithAnime };
    } catch (error) {
        console.error("Error fetching genres:", error);
        return { success: false, error: "Failed to fetch genres" };
    }
}

/**
 * Fetches a genre by slug with paginated anime list
 *
 * @param slug - Genre slug
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Genre with paginated anime or error
 */
export async function getGenreBySlug(
    slug: string,
    page: number = 1,
    pageSize: number = 24
): Promise<
    ActionResult<{
        genre: { id: string; name: string; slug: string };
        anime: PaginatedResponse<Anime>;
    }>
> {
    try {
        if (!slug || typeof slug !== "string") {
            return {
                success: false,
                error: "Invalid slug",
                code: "INVALID_INPUT",
            };
        }

        const validPage = Math.max(1, page);
        const validPageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (validPage - 1) * validPageSize;

        const supabase = await createClient();

        // First, get the genre
        const { data: genreData, error: genreError } = await supabase
            .from("genres")
            .select("id, name, slug")
            .eq("slug", slug)
            .single();

        if (genreError) {
            if (genreError.code === "PGRST116") {
                return {
                    success: false,
                    error: "Genre not found",
                    code: "NOT_FOUND",
                };
            }
            console.error("Error fetching genre:", genreError);
            return { success: false, error: "Failed to fetch genre" };
        }

        // Get total count of anime for this genre
        const { count: totalCount, error: countError } = await supabase
            .from("anime_genres")
            .select("*", { count: "exact", head: true })
            .eq("genre_id", genreData.id);

        if (countError) {
            console.error("Error counting anime:", countError);
            return { success: false, error: "Failed to count anime" };
        }

        // Fetch paginated anime for this genre
        // Get anime IDs first, then fetch anime data
        const { data: animeIds, error: idsError } = await supabase
            .from("anime_genres")
            .select("anime_id")
            .eq("genre_id", genreData.id)
            .range(offset, offset + validPageSize - 1);

        if (idsError) {
            console.error("Error fetching anime IDs:", idsError);
            return { success: false, error: "Failed to fetch anime" };
        }

        const total = totalCount || 0;
        const totalPages = Math.ceil(total / validPageSize);

        // Fetch anime data by IDs
        const ids = (animeIds || []).map((row) => row.anime_id);

        if (ids.length === 0) {
            return {
                success: true,
                data: {
                    genre: genreData,
                    anime: {
                        data: [],
                        pagination: {
                            page: validPage,
                            pageSize: validPageSize,
                            totalCount: total,
                            totalPages,
                            hasNextPage: false,
                            hasPreviousPage: validPage > 1,
                        },
                    },
                },
            };
        }

        const { data: animeData, error: animeError } = await supabase
            .from("anime")
            .select("*")
            .in("id", ids)
            .order("popularity", { ascending: true });

        if (animeError) {
            console.error("Error fetching anime:", animeError);
            return { success: false, error: "Failed to fetch anime" };
        }

        // Transform anime data
        const animeList = (animeData as AnimeRow[]).map(transformAnimeRow);

        return {
            success: true,
            data: {
                genre: genreData,
                anime: {
                    data: animeList,
                    pagination: {
                        page: validPage,
                        pageSize: validPageSize,
                        totalCount: total,
                        totalPages,
                        hasNextPage: validPage < totalPages,
                        hasPreviousPage: validPage > 1,
                    },
                },
            },
        };
    } catch (error) {
        console.error("Error fetching genre by slug:", error);
        return { success: false, error: "Failed to fetch genre" };
    }
}

