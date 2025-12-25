import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for server-side operations
 * Use this in Server Components, Server Actions, and Route Handlers
 *
 * This client automatically handles cookie-based session management
 * for authentication state persistence across requests.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        );
                    } catch {
                        // Called from Server Component - ignore
                        // The `setAll` method is called from a Server Component
                        // which cannot set cookies. This can be safely ignored
                        // as the session will be refreshed by middleware.
                    }
                },
            },
        },
    );
}
