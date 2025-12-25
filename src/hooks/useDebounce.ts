"use client";

import { useState, useEffect } from "react";

/**
 * Debounces a value by delaying updates until after a specified delay
 *
 * Useful for search inputs where you want to wait for the user to stop
 * typing before triggering an API call.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 150ms for search)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 150);
 *
 * useEffect(() => {
 *   // This runs 150ms after the user stops typing
 *   searchAnime(debouncedQuery);
 * }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up a timer to update the debounced value
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if value changes before delay completes
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
