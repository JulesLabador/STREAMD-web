"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import { searchAnime } from "@/app/actions/search";
import type { Anime } from "@/types/anime";

/**
 * Search state interface
 */
export interface SearchState {
    /** Current search query */
    query: string;
    /** Search results */
    results: Anime[];
    /** Whether a search is in progress */
    isLoading: boolean;
    /** Error message if search failed */
    error: string | null;
    /** Currently selected result index for keyboard navigation */
    selectedIndex: number;
}

/**
 * Search actions interface
 */
export interface SearchActions {
    /** Update the search query */
    setQuery: (query: string) => void;
    /** Clear all search state */
    clearSearch: () => void;
    /** Navigate to previous result (arrow up) */
    navigateUp: () => void;
    /** Navigate to next result (arrow down) */
    navigateDown: () => void;
    /** Get the currently selected anime */
    getSelectedAnime: () => Anime | null;
    /** Reset selected index to 0 */
    resetSelection: () => void;
}

/**
 * Combined search hook return type
 */
export interface UseSearchReturn extends SearchState, SearchActions {}

/**
 * Core search hook - single source of truth for all search behavior
 *
 * This hook manages:
 * - Search query state
 * - Debounced API calls to Meilisearch
 * - Loading and error states
 * - Keyboard navigation (selected index)
 *
 * Used by both SearchModal and InlineSearch through SearchProvider.
 *
 * @param debounceDelay - Delay in ms before triggering search (default: 150)
 * @returns Search state and actions
 */
export function useSearch(debounceDelay: number = 150): UseSearchReturn {
    // Core state
    const [query, setQueryState] = useState("");
    const [results, setResults] = useState<Anime[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Debounce the query for API calls
    const debouncedQuery = useDebounce(query, debounceDelay);

    /**
     * Perform search when debounced query changes
     */
    useEffect(() => {
        const performSearch = async () => {
            // Don't search for empty queries
            if (!debouncedQuery.trim()) {
                setResults([]);
                setError(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            const result = await searchAnime(debouncedQuery, 10);

            if (result.success) {
                setResults(result.data);
                // Reset selection when results change
                setSelectedIndex(0);
            } else {
                setError(result.error);
                setResults([]);
            }

            setIsLoading(false);
        };

        performSearch();
    }, [debouncedQuery]);

    /**
     * Set the search query
     * Also sets loading state immediately for responsive UI
     */
    const setQuery = useCallback((newQuery: string) => {
        setQueryState(newQuery);
        // Show loading state immediately when user types
        if (newQuery.trim()) {
            setIsLoading(true);
        }
    }, []);

    /**
     * Clear all search state
     */
    const clearSearch = useCallback(() => {
        setQueryState("");
        setResults([]);
        setError(null);
        setIsLoading(false);
        setSelectedIndex(0);
    }, []);

    /**
     * Navigate to previous result (arrow up)
     */
    const navigateUp = useCallback(() => {
        setSelectedIndex((prev) => {
            if (results.length === 0) return 0;
            // Wrap around to bottom if at top
            return prev <= 0 ? results.length - 1 : prev - 1;
        });
    }, [results.length]);

    /**
     * Navigate to next result (arrow down)
     */
    const navigateDown = useCallback(() => {
        setSelectedIndex((prev) => {
            if (results.length === 0) return 0;
            // Wrap around to top if at bottom
            return prev >= results.length - 1 ? 0 : prev + 1;
        });
    }, [results.length]);

    /**
     * Get the currently selected anime
     */
    const getSelectedAnime = useCallback((): Anime | null => {
        if (results.length === 0 || selectedIndex < 0 || selectedIndex >= results.length) {
            return null;
        }
        return results[selectedIndex];
    }, [results, selectedIndex]);

    /**
     * Reset selected index to 0
     */
    const resetSelection = useCallback(() => {
        setSelectedIndex(0);
    }, []);

    return {
        // State
        query,
        results,
        isLoading,
        error,
        selectedIndex,
        // Actions
        setQuery,
        clearSearch,
        navigateUp,
        navigateDown,
        getSelectedAnime,
        resetSelection,
    };
}

