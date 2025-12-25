import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser-side operations
 * Use this in Client Components for authentication and real-time subscriptions
 *
 * This client is designed for use in React components where you need
 * to interact with Supabase Auth (login, logout, OAuth flows).
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    );
}
