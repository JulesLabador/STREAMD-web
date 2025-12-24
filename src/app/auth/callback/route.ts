import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth callback route handler
 *
 * This route handles the redirect from OAuth providers (Google).
 * It exchanges the authorization code for a session and redirects
 * the user to the dashboard or back to login on error.
 *
 * Flow:
 * 1. User authorizes with Google
 * 2. Supabase redirects to this route with a code
 * 3. We exchange the code for a session
 * 4. Redirect to dashboard (success) or login (error)
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);

    // Get the authorization code from the URL
    const code = searchParams.get("code");

    // Get the redirect destination (defaults to dashboard)
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createClient();

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Successful authentication - redirect to intended destination
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Authentication failed - redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth`);
}
