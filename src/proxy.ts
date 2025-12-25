import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy for Supabase Auth session management
 *
 * This proxy runs on every request and:
 * 1. Refreshes the auth session if it's expired
 * 2. Protects dashboard routes by redirecting unauthenticated users to login
 *
 * The session refresh is crucial for maintaining auth state across
 * server-side rendered pages.
 */
export async function proxy(request: NextRequest) {
    // Create a response that we can modify
    let supabaseResponse = NextResponse.next({
        request,
    });

    // Create Supabase client with cookie handling
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Set cookies on the request for downstream handlers
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

                    // Create new response with updated request
                    supabaseResponse = NextResponse.next({
                        request,
                    });

                    // Set cookies on the response for the browser
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh the session - this is required to keep the session alive
    // IMPORTANT: Do not remove this getUser() call - it refreshes the session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protect dashboard routes - redirect to login if not authenticated
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        // Preserve the intended destination for post-login redirect
        url.searchParams.set("redirectTo", request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

/**
 * Matcher configuration
 *
 * Run proxy on all routes except:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico
 * - Image files (svg, png, jpg, jpeg, gif, webp)
 */
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
