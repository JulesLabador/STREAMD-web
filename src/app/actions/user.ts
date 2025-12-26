"use server";

import { createClient } from "@/lib/supabase/server";
import { trackServerEventAsync } from "@/lib/analytics/plausible";
import type { ActionResult, PaginatedResponse } from "@/types/common";
import type { Anime, AnimeRow } from "@/types/anime";
import { transformAnimeRow } from "@/types/anime";
import type {
    UserProfile,
    UserProfileWithStats,
    UserRow,
    UserAnime,
    UserAnimeRow,
    UserAnimeStatus,
    UserAnimeWithAnime,
    AddToListInput,
    UpdateTrackingInput,
} from "@/types/user";
import { transformUserRow, transformUserAnimeRow } from "@/types/user";

// =============================================
// Profile Actions
// =============================================

/**
 * Fetches a user's public profile by username
 *
 * @param username - The user's unique username
 * @returns User profile with stats or error
 */
export async function getUserProfile(
    username: string
): Promise<ActionResult<UserProfileWithStats>> {
    try {
        if (!username || typeof username !== "string") {
            return {
                success: false,
                error: "Invalid username",
                code: "INVALID_INPUT",
            };
        }

        const supabase = await createClient();

        // Fetch user by username
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .is("deleted_at", null)
            .single();

        if (userError) {
            if (userError.code === "PGRST116") {
                return {
                    success: false,
                    error: "User not found",
                    code: "NOT_FOUND",
                };
            }
            console.error("Error fetching user profile:", userError);
            return { success: false, error: "Failed to fetch user profile" };
        }

        const user = transformUserRow(userData as UserRow);

        // Fetch anime counts by status
        const { data: statusCounts, error: countError } = await supabase
            .from("user_anime")
            .select("status")
            .eq("user_id", user.id)
            .eq("is_private", false);

        if (countError) {
            console.error("Error fetching anime counts:", countError);
            return { success: false, error: "Failed to fetch user stats" };
        }

        // Calculate stats
        const stats = {
            watching: 0,
            completed: 0,
            planning: 0,
            paused: 0,
            dropped: 0,
            totalAnime: 0,
        };

        for (const row of statusCounts || []) {
            stats.totalAnime++;
            switch (row.status) {
                case "WATCHING":
                    stats.watching++;
                    break;
                case "COMPLETED":
                    stats.completed++;
                    break;
                case "PLANNING":
                    stats.planning++;
                    break;
                case "PAUSED":
                    stats.paused++;
                    break;
                case "DROPPED":
                    stats.dropped++;
                    break;
            }
        }

        return {
            success: true,
            data: { ...user, stats },
        };
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return { success: false, error: "Failed to fetch user profile" };
    }
}

/**
 * Fetches the current authenticated user's profile
 *
 * @returns Current user's profile or null if not authenticated
 */
export async function getCurrentUserProfile(): Promise<
    ActionResult<UserProfile | null>
> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: true, data: null };
        }

        // Fetch user profile from users table
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .is("deleted_at", null)
            .single();

        if (userError) {
            if (userError.code === "PGRST116") {
                // User exists in auth but not in users table yet
                return { success: true, data: null };
            }
            console.error("Error fetching current user profile:", userError);
            return { success: false, error: "Failed to fetch user profile" };
        }

        return {
            success: true,
            data: transformUserRow(userData as UserRow),
        };
    } catch (error) {
        console.error("Error fetching current user profile:", error);
        return { success: false, error: "Failed to fetch user profile" };
    }
}

// =============================================
// User Anime List Actions
// =============================================

/**
 * Fetches a user's anime list filtered by status
 *
 * @param userId - The user's ID
 * @param status - Optional status filter
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated list of user's anime with full anime data
 */
export async function getUserAnimeByStatus(
    userId: string,
    status?: UserAnimeStatus,
    page: number = 1,
    pageSize: number = 24
): Promise<ActionResult<PaginatedResponse<UserAnimeWithAnime>>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: "Invalid user ID",
                code: "INVALID_INPUT",
            };
        }

        const validPage = Math.max(1, page);
        const validPageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (validPage - 1) * validPageSize;

        const supabase = await createClient();

        // Build query
        let query = supabase
            .from("user_anime")
            .select(
                `
                *,
                anime:anime_id(*)
            `,
                { count: "exact" }
            )
            .eq("user_id", userId)
            .eq("is_private", false)
            .order("updated_at", { ascending: false })
            .range(offset, offset + validPageSize - 1);

        // Apply status filter if provided
        if (status) {
            query = query.eq("status", status);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error("Error fetching user anime list:", error);
            return { success: false, error: "Failed to fetch anime list" };
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / validPageSize);

        // Transform the data
        const userAnimeList: UserAnimeWithAnime[] = (data || []).map((row) => {
            const userAnime = transformUserAnimeRow(row as UserAnimeRow);
            const anime = transformAnimeRow(row.anime as AnimeRow);
            return { ...userAnime, anime };
        });

        return {
            success: true,
            data: {
                data: userAnimeList,
                pagination: {
                    page: validPage,
                    pageSize: validPageSize,
                    totalCount,
                    totalPages,
                    hasNextPage: validPage < totalPages,
                    hasPreviousPage: validPage > 1,
                },
            },
        };
    } catch (error) {
        console.error("Error fetching user anime list:", error);
        return { success: false, error: "Failed to fetch anime list" };
    }
}

/**
 * Gets the current user's tracking entry for a specific anime
 *
 * @param animeId - The anime's ID
 * @returns User's tracking entry or null if not tracked
 */
export async function getUserAnimeForAnime(
    animeId: string
): Promise<ActionResult<UserAnime | null>> {
    try {
        if (!animeId) {
            return {
                success: false,
                error: "Invalid anime ID",
                code: "INVALID_INPUT",
            };
        }

        const supabase = await createClient();

        // Check if user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: true, data: null };
        }

        // Fetch user's tracking for this anime
        const { data, error } = await supabase
            .from("user_anime")
            .select("*")
            .eq("user_id", user.id)
            .eq("anime_id", animeId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                // Not tracked
                return { success: true, data: null };
            }
            console.error("Error fetching user anime:", error);
            return { success: false, error: "Failed to fetch tracking data" };
        }

        return {
            success: true,
            data: transformUserAnimeRow(data as UserAnimeRow),
        };
    } catch (error) {
        console.error("Error fetching user anime:", error);
        return { success: false, error: "Failed to fetch tracking data" };
    }
}

// =============================================
// Tracking Mutation Actions
// =============================================

/**
 * Helper function to get anime slug by ID for analytics tracking
 *
 * @param supabase - Supabase client instance
 * @param animeId - The anime's ID
 * @returns Anime slug or undefined if not found
 */
async function getAnimeSlugById(
    supabase: Awaited<ReturnType<typeof createClient>>,
    animeId: string
): Promise<string | undefined> {
    const { data } = await supabase
        .from("anime")
        .select("slug")
        .eq("id", animeId)
        .single();

    return data?.slug;
}

/**
 * Adds an anime to the current user's list
 *
 * @param input - Add to list input data
 * @returns Created tracking entry or error
 */
export async function addAnimeToList(
    input: AddToListInput
): Promise<ActionResult<UserAnime>> {
    try {
        const { animeId, status, rating, currentEpisode, notes } = input;

        if (!animeId || !status) {
            return {
                success: false,
                error: "Anime ID and status are required",
                code: "INVALID_INPUT",
            };
        }

        const supabase = await createClient();

        // Check if user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                error: "You must be logged in to track anime",
                code: "UNAUTHORIZED",
            };
        }

        // Check if user exists in users table
        const { data: userExists } = await supabase
            .from("users")
            .select("id")
            .eq("id", user.id)
            .single();

        if (!userExists) {
            return {
                success: false,
                error: "Please complete your profile setup first",
                code: "PROFILE_REQUIRED",
            };
        }

        // Check if anime exists and get slug for analytics
        const { data: animeData } = await supabase
            .from("anime")
            .select("id, slug")
            .eq("id", animeId)
            .single();

        if (!animeData) {
            return {
                success: false,
                error: "Anime not found",
                code: "NOT_FOUND",
            };
        }

        // Prepare insert data
        const insertData: Record<string, unknown> = {
            user_id: user.id,
            anime_id: animeId,
            status,
            current_episode: currentEpisode ?? 0,
        };

        if (rating !== undefined) {
            insertData.rating = rating;
        }

        if (notes !== undefined) {
            insertData.notes = notes;
        }

        // Set started_at if status is WATCHING
        if (status === "WATCHING") {
            insertData.started_at = new Date().toISOString().split("T")[0];
        }

        // Set completed_at if status is COMPLETED
        if (status === "COMPLETED") {
            insertData.completed_at = new Date().toISOString().split("T")[0];
        }

        // Insert tracking entry
        const { data, error } = await supabase
            .from("user_anime")
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error("Error adding anime to list:", error);

            if (error.code === "23505") {
                // Unique constraint violation - already tracked
                return {
                    success: false,
                    error: "This anime is already in your list",
                    code: "ALREADY_EXISTS",
                };
            }
            if (error.code === "22003") {
                // Numeric field overflow
                return {
                    success: false,
                    error: "Invalid rating value",
                    code: "INVALID_INPUT",
                };
            }
            return { success: false, error: "Failed to add anime to list" };
        }

        if (!data) {
            console.error("No data returned after insert");
            return { success: false, error: "Failed to add anime to list" };
        }

        // Track analytics event (fire-and-forget)
        trackServerEventAsync("anime_added", `https://streamd.app/anime/${animeData.slug}`, {
            status,
            anime_slug: animeData.slug,
        });

        return {
            success: true,
            data: transformUserAnimeRow(data as UserAnimeRow),
        };
    } catch (error) {
        console.error("Error adding anime to list:", error);
        return { success: false, error: "Failed to add anime to list" };
    }
}

/**
 * Updates tracking data for an anime in the current user's list
 *
 * @param animeId - The anime's ID
 * @param input - Update data
 * @returns Updated tracking entry or error
 */
export async function updateAnimeTracking(
    animeId: string,
    input: UpdateTrackingInput
): Promise<ActionResult<UserAnime>> {
    try {
        if (!animeId) {
            return {
                success: false,
                error: "Anime ID is required",
                code: "INVALID_INPUT",
            };
        }

        const supabase = await createClient();

        // Check if user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                error: "You must be logged in to update tracking",
                code: "UNAUTHORIZED",
            };
        }

        // Build update data
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (input.status !== undefined) {
            updateData.status = input.status;

            // Auto-set dates based on status changes
            if (input.status === "WATCHING" && input.startedAt === undefined) {
                updateData.started_at = new Date().toISOString().split("T")[0];
            }

            if (
                input.status === "COMPLETED" &&
                input.completedAt === undefined
            ) {
                updateData.completed_at = new Date()
                    .toISOString()
                    .split("T")[0];
            }
        }

        if (input.currentEpisode !== undefined) {
            updateData.current_episode = input.currentEpisode;
        }

        if (input.rating !== undefined) {
            updateData.rating = input.rating;
        }

        if (input.notes !== undefined) {
            updateData.notes = input.notes;
        }

        if (input.startedAt !== undefined) {
            updateData.started_at = input.startedAt;
        }

        if (input.completedAt !== undefined) {
            updateData.completed_at = input.completedAt;
        }

        // Update tracking entry
        const { data, error } = await supabase
            .from("user_anime")
            .update(updateData)
            .eq("user_id", user.id)
            .eq("anime_id", animeId)
            .select()
            .single();

        if (error) {
            console.error("Error updating anime tracking:", error);

            if (error.code === "PGRST116") {
                return {
                    success: false,
                    error: "Anime not found in your list",
                    code: "NOT_FOUND",
                };
            }
            if (error.code === "22003") {
                // Numeric field overflow
                return {
                    success: false,
                    error: "Invalid rating value",
                    code: "INVALID_INPUT",
                };
            }
            return { success: false, error: "Failed to update tracking" };
        }

        if (!data) {
            console.error("No data returned after update");
            return { success: false, error: "Failed to update tracking" };
        }

        // Get anime slug for analytics (fire-and-forget)
        const animeSlug = await getAnimeSlugById(supabase, animeId);
        if (animeSlug) {
            trackServerEventAsync("anime_updated", `https://streamd.app/anime/${animeSlug}`, {
                status: input.status,
                anime_slug: animeSlug,
            });
        }

        return {
            success: true,
            data: transformUserAnimeRow(data as UserAnimeRow),
        };
    } catch (error) {
        console.error("Error updating anime tracking:", error);
        return { success: false, error: "Failed to update tracking" };
    }
}

/**
 * Removes an anime from the current user's list
 *
 * @param animeId - The anime's ID
 * @returns Success or error
 */
export async function removeAnimeFromList(
    animeId: string
): Promise<ActionResult<{ removed: true }>> {
    try {
        if (!animeId) {
            return {
                success: false,
                error: "Anime ID is required",
                code: "INVALID_INPUT",
            };
        }

        const supabase = await createClient();

        // Check if user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                error: "You must be logged in to remove anime",
                code: "UNAUTHORIZED",
            };
        }

        // Get anime slug for analytics before deletion
        const animeSlug = await getAnimeSlugById(supabase, animeId);

        // Delete tracking entry
        const { error } = await supabase
            .from("user_anime")
            .delete()
            .eq("user_id", user.id)
            .eq("anime_id", animeId);

        if (error) {
            console.error("Error removing anime from list:", error);
            return { success: false, error: "Failed to remove anime" };
        }

        // Track analytics event (fire-and-forget)
        if (animeSlug) {
            trackServerEventAsync("anime_removed", `https://streamd.app/anime/${animeSlug}`, {
                anime_slug: animeSlug,
            });
        }

        return { success: true, data: { removed: true } };
    } catch (error) {
        console.error("Error removing anime from list:", error);
        return { success: false, error: "Failed to remove anime" };
    }
}

// =============================================
// Helper Actions
// =============================================

/**
 * Gets all anime in the current user's list (for quick lookups)
 * Returns a map of animeId -> status
 *
 * @returns Map of anime IDs to their tracking status
 */
export async function getUserAnimeMap(): Promise<
    ActionResult<Record<string, UserAnimeStatus>>
> {
    try {
        const supabase = await createClient();

        // Check if user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: true, data: {} };
        }

        // Fetch all user's anime (just IDs and status)
        const { data, error } = await supabase
            .from("user_anime")
            .select("anime_id, status")
            .eq("user_id", user.id);

        if (error) {
            console.error("Error fetching user anime map:", error);
            return { success: false, error: "Failed to fetch tracking data" };
        }

        // Build map
        const animeMap: Record<string, UserAnimeStatus> = {};
        for (const row of data || []) {
            animeMap[row.anime_id] = row.status as UserAnimeStatus;
        }

        return { success: true, data: animeMap };
    } catch (error) {
        console.error("Error fetching user anime map:", error);
        return { success: false, error: "Failed to fetch tracking data" };
    }
}
