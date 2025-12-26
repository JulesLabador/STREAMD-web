"use client";

import Script from "next/script";
import { createContext, useContext, useCallback, useMemo } from "react";

/**
 * Custom event names for Plausible tracking
 * These must match the goals configured in Plausible dashboard
 */
export type PlausibleEventName = "search" | "search_click";

/**
 * Event properties that can be passed with custom events
 * Properties are used for filtering in Plausible dashboard
 */
export interface PlausibleEventProps {
    /** Length of search query */
    query_length?: number;
    /** Number of search results returned */
    result_count?: number;
    /** Anime slug for tracking specific anime interactions */
    anime_slug?: string;
}

/**
 * Plausible global type declaration
 * Extends the window object to include Plausible's tracking function
 */
declare global {
    interface Window {
        plausible?: (
            event: string,
            options?: { props?: PlausibleEventProps }
        ) => void;
    }
}

/**
 * Context type for Plausible analytics
 */
interface PlausibleContextType {
    /** Track a custom event with optional properties */
    trackEvent: (
        event: PlausibleEventName,
        props?: PlausibleEventProps
    ) => void;
}

const PlausibleContext = createContext<PlausibleContextType | null>(null);

/**
 * Hook to access Plausible tracking functions
 *
 * @returns Plausible context with trackEvent function
 * @throws Error if used outside of PlausibleProvider
 *
 * @example
 * ```tsx
 * const { trackEvent } = usePlausible();
 * trackEvent("search", { query_length: 5, result_count: 10 });
 * ```
 */
export function usePlausible(): PlausibleContextType {
    const context = useContext(PlausibleContext);

    if (!context) {
        throw new Error("usePlausible must be used within a PlausibleProvider");
    }

    return context;
}

/**
 * Props for PlausibleProvider component
 */
interface PlausibleProviderProps {
    children: React.ReactNode;
}

/**
 * PlausibleProvider - Analytics provider component
 *
 * Loads the Plausible analytics script and provides a context
 * for tracking custom events throughout the application.
 *
 * Features:
 * - Automatic page view tracking via Plausible script
 * - Custom event tracking via trackEvent function
 * - Type-safe event names and properties
 * - Graceful handling when script hasn't loaded
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <PlausibleProvider>
 *   {children}
 * </PlausibleProvider>
 * ```
 */
export function PlausibleProvider({ children }: PlausibleProviderProps) {
    const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

    /**
     * Track a custom event with Plausible
     * Safely handles cases where the script hasn't loaded yet
     */
    const trackEvent = useCallback(
        (event: PlausibleEventName, props?: PlausibleEventProps) => {
            // Skip tracking if domain isn't configured (development)
            if (!domain) {
                console.debug(
                    "[Plausible] Skipping event (no domain):",
                    event,
                    props
                );
                return;
            }

            // Use Plausible's global function if available
            if (typeof window !== "undefined" && window.plausible) {
                window.plausible(event, props ? { props } : undefined);
            } else {
                console.debug(
                    "[Plausible] Script not loaded, skipping:",
                    event
                );
            }
        },
        [domain]
    );

    const value = useMemo(() => ({ trackEvent }), [trackEvent]);

    return (
        <PlausibleContext.Provider value={value}>
            {/* Load Plausible script only if domain is configured */}
            {domain && (
                <Script
                    defer
                    data-domain={domain}
                    src="https://plausible.io/js/script.js"
                    strategy="afterInteractive"
                />
            )}
            {children}
        </PlausibleContext.Provider>
    );
}
