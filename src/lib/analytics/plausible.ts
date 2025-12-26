import { headers } from "next/headers";

/**
 * Server-side event names for Plausible tracking
 * These must match the goals configured in Plausible dashboard
 */
export type PlausibleServerEventName =
    | "signup"
    | "login"
    | "anime_added"
    | "anime_updated"
    | "anime_removed";

/**
 * Event properties for server-side tracking
 */
export interface PlausibleServerEventProps {
    /** OAuth provider used (google, etc.) */
    provider?: string;
    /** Anime tracking status */
    status?: string;
    /** Anime slug for filtering */
    anime_slug?: string;
}

/**
 * Plausible Events API endpoint
 */
const PLAUSIBLE_API_URL = "https://plausible.io/api/event";

/**
 * Track a server-side event with Plausible
 *
 * Uses the Plausible Events API to track events that occur on the server,
 * such as user signups, logins, and anime list mutations.
 *
 * @param event - The event name to track
 * @param url - The URL where the event occurred
 * @param props - Optional properties for the event
 *
 * @example
 * ```ts
 * // In a server action or route handler
 * await trackServerEvent("signup", request.url, { provider: "google" });
 * ```
 */
export async function trackServerEvent(
    event: PlausibleServerEventName,
    url: string,
    props?: PlausibleServerEventProps
): Promise<void> {
    const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

    // Skip tracking if domain isn't configured
    if (!domain) {
        console.debug(
            "[Plausible Server] Skipping event (no domain):",
            event,
            props
        );
        return;
    }

    try {
        // Get request headers for accurate tracking
        const headersList = await headers();
        const userAgent = headersList.get("user-agent") || "";
        const forwardedFor = headersList.get("x-forwarded-for") || "";

        // Build the request body
        const body = {
            name: event,
            url,
            domain,
            ...(props && Object.keys(props).length > 0 && { props }),
        };

        // Send event to Plausible
        const response = await fetch(PLAUSIBLE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": userAgent,
                ...(forwardedFor && { "X-Forwarded-For": forwardedFor }),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error(
                "[Plausible Server] Failed to track event:",
                event,
                response.status,
                await response.text()
            );
        }
    } catch (error) {
        // Don't throw - analytics should never break the app
        console.error("[Plausible Server] Error tracking event:", event, error);
    }
}

/**
 * Track a server-side event without awaiting (fire-and-forget)
 *
 * Use this when you don't want to delay the response waiting for analytics.
 * The event will be sent in the background.
 *
 * @param event - The event name to track
 * @param url - The URL where the event occurred
 * @param props - Optional properties for the event
 */
export function trackServerEventAsync(
    event: PlausibleServerEventName,
    url: string,
    props?: PlausibleServerEventProps
): void {
    // Fire and forget - don't await
    trackServerEvent(event, url, props).catch(() => {
        // Silently ignore errors in fire-and-forget mode
    });
}
