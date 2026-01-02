"use server";

import { createClient } from "@/lib/supabase/server";
import { trackServerEventAsync } from "@/lib/analytics/plausible";
import type { ActionResult } from "@/types/common";
import type {
    UserAnime,
    UserAnimeRow,
    AddToListInput,
    UpdateTrackingInput,
} from "@/types/user";
import { transformUserAnimeRow } from "@/types/user";

/**
 * User Server Actions
 *
 * Server actions for user-related mutations and client-invoked functions.
 * Read-only functions (getUserProfile, getUserAnimeByStatus, etc.)
 * have been moved to @/lib/queries/user
 *
 * These functions remain as server actions because they are either:
 * 1. Called from client components (getUserAnimeForAnime from TrackingButton)
 * 2. Mutations that modify data (addAnimeToList, updateAnimeTracking, removeAnimeFromList)
 */

// =============================================
// Client-Invoked Read Functions
// =============================================

/**
 * Gets the current user&apos;s tracking entry for a specific anime
 *
 * This remains a server action because it&apos;s called from the
 * TrackingButton client component.
 *
 * @param animeId - The anime&apos;s ID
 * @returns User&apos;s tracking entry or null if not tracked
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

        // Fetch user&apos;s tracking for this anime
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
 * Anime URL info for analytics tracking
 */
interface AnimeUrlInfo {
    slug: string;
    shortId: string;
}

/**
 * Helper function to get anime slug and short_id by ID for analytics tracking
 *
 * @param supabase - Supabase client instance
 * @param animeId - The anime&apos;s ID
 * @returns Anime URL info or undefined if not found
 */
async function getAnimeUrlInfoById(
    supabase: Awaited<ReturnType<typeof createClient>>,
    animeId: string
): Promise<AnimeUrlInfo | undefined> {
    const { data } = await supabase
        .from("anime")
        .select("slug, short_id")
        .eq("id", animeId)
        .single();

    if (!data?.slug || !data?.short_id) {
        return undefined;
    }

    return { slug: data.slug, shortId: data.short_id };
}

/**
 * Adds an anime to the current user&apos;s list
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

        // Check if anime exists and get slug/short_id for analytics
        const { data: animeData } = await supabase
            .from("anime")
            .select("id, slug, short_id")
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
        trackServerEventAsync(
            "anime_added",
            `https://www.streamdanime.io/anime/${animeData.short_id}/${animeData.slug}`,
            {
                status,
                anime_slug: animeData.slug,
            }
        );

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
 * Updates tracking data for an anime in the current user&apos;s list
 *
 * @param animeId - The anime&apos;s ID
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

        // Get anime URL info for analytics (fire-and-forget)
        const animeInfo = await getAnimeUrlInfoById(supabase, animeId);
        if (animeInfo) {
            trackServerEventAsync(
                "anime_updated",
                `https://www.streamdanime.io/anime/${animeInfo.shortId}/${animeInfo.slug}`,
                {
                    status: input.status,
                    anime_slug: animeInfo.slug,
                }
            );
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
 * Removes an anime from the current user&apos;s list
 *
 * @param animeId - The anime&apos;s ID
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

        // Get anime URL info for analytics before deletion
        const animeInfo = await getAnimeUrlInfoById(supabase, animeId);

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
        if (animeInfo) {
            trackServerEventAsync(
                "anime_removed",
                `https://www.streamdanime.io/anime/${animeInfo.shortId}/${animeInfo.slug}`,
                {
                    anime_slug: animeInfo.slug,
                }
            );
        }

        return { success: true, data: { removed: true } };
    } catch (error) {
        console.error("Error removing anime from list:", error);
        return { success: false, error: "Failed to remove anime" };
    }
}
