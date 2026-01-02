"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Auth Server Actions
 *
 * Server actions for authentication mutations.
 * Read-only auth functions (getCurrentUser) have been moved to @/lib/queries/auth
 */

/**
 * Signs out the current user
 *
 * Clears the user session and redirects to the home page.
 * This is a server action that can be called from client components.
 */
export async function signOut(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
}
