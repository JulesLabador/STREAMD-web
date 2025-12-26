import { createClient } from "@/lib/supabase/server";
import { trackServerEventAsync } from "@/lib/analytics/plausible";
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
 * 4. Track signup/login event with Plausible
 * 5. Redirect to dashboard (success) or login (error)
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
        const { data, error } = await supabase.auth.exchangeCodeForSession(
            code
        );

        if (!error && data.user) {
            // Determine if this is a new signup or returning login
            // New users have created_at very close to current time (within 10 seconds)
            const createdAt = new Date(data.user.created_at).getTime();
            const now = Date.now();
            const isNewUser = now - createdAt < 10000; // 10 seconds

            // Track the appropriate event (fire-and-forget)
            const eventName = isNewUser ? "signup" : "login";
            trackServerEventAsync(eventName, request.url, {
                provider: data.user.app_metadata.provider || "google",
            });

            // Successful authentication - redirect to intended destination
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Authentication failed - redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth`);
}
