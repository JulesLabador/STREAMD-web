/**
 * Auth Query Functions
 *
 * Server-side data fetching functions for authentication-related data.
 * These are NOT server actions - they are regular async functions
 * meant to be called from Server Components only.
 *
 * For mutations (signOut), use the server action in @/app/actions/auth
 */

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/common";

/**
 * Gets the current authenticated user
 *
 * Returns the user object if authenticated, null otherwise.
 * Use this to check auth state in server components.
 *
 * @returns ActionResult containing the user or null
 */
export async function getCurrentUser(): Promise<
    ActionResult<{ id: string; email: string } | null>
> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            return { success: false, error: error.message };
        }

        if (!user) {
            return { success: true, data: null };
        }

        return {
            success: true,
            data: {
                id: user.id,
                email: user.email ?? "",
            },
        };
    } catch {
        return { success: false, error: "Failed to get current user" };
    }
}

