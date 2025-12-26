"use client";

import {
    createContext,
    useContext,
    useCallback,
    useRef,
    useEffect,
    type ReactNode,
    type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useSearch, type UseSearchReturn } from "@/hooks/useSearch";
import { usePlausible } from "@/components/analytics";
import type { Anime } from "@/types/anime";

/**
 * Search context value interface
 * Extends UseSearchReturn with additional navigation callbacks
 */
interface SearchContextValue extends UseSearchReturn {
    /** Called when an anime is selected (click or enter) */
    onSelect: (anime: Anime) => void;
    /** Called when search should be closed (escape) */
    onClose: () => void;
    /** Handle keyboard events for navigation */
    handleKeyDown: (e: KeyboardEvent) => void;
    /** Ref for the container element (for keyboard event handling) */
    containerRef: React.RefObject<HTMLDivElement | null>;
}

// Create context with undefined default
const SearchContext = createContext<SearchContextValue | undefined>(undefined);

/**
 * Props for SearchProvider
 */
interface SearchProviderProps {
    children: ReactNode;
    /** Custom handler when anime is selected (default: navigate to anime page) */
    onSelect?: (anime: Anime) => void;
    /** Custom handler when search is closed */
    onClose?: () => void;
    /** Whether to auto-focus the search input */
    autoFocus?: boolean;
}

/**
 * SearchProvider - Context provider for the unified search system
 *
 * Wraps the useSearch hook and provides:
 * - Search state and actions to all children
 * - Keyboard navigation (arrow up/down, enter, escape)
 * - Navigation to anime pages on selection
 * - Analytics tracking for search interactions
 *
 * Used by both SearchModal and InlineSearch to share the same
 * search behavior and state management.
 *
 * @example
 * ```tsx
 * <SearchProvider onClose={() => setOpen(false)}>
 *   <SearchInput />
 *   <SearchResults />
 * </SearchProvider>
 * ```
 */
export function SearchProvider({
    children,
    onSelect: customOnSelect,
    onClose: customOnClose,
}: SearchProviderProps) {
    const router = useRouter();
    const search = useSearch();
    const containerRef = useRef<HTMLDivElement>(null);
    const { trackEvent } = usePlausible();

    // Track whether we've already tracked this search query
    const lastTrackedQuery = useRef<string>("");

    /**
     * Track search event when results are loaded
     * Only tracks once per unique query to avoid duplicate events
     */
    useEffect(() => {
        // Only track if we have a query and results have loaded (not loading)
        if (
            search.query.trim() &&
            !search.isLoading &&
            search.query !== lastTrackedQuery.current
        ) {
            // Track the search event
            trackEvent("search", {
                query_length: search.query.length,
                result_count: search.results.length,
            });
            lastTrackedQuery.current = search.query;
        }
    }, [search.query, search.isLoading, search.results.length, trackEvent]);

    /**
     * Handle anime selection
     * Navigates to the anime page and clears search
     */
    const onSelect = useCallback(
        (anime: Anime) => {
            // Track search result click
            trackEvent("search_click", {
                anime_slug: anime.slug,
                query_length: search.query.length,
            });

            // Call custom handler if provided
            if (customOnSelect) {
                customOnSelect(anime);
            }

            // Navigate to anime page
            router.push(`/anime/${anime.slug}`);

            // Clear search state
            search.clearSearch();

            // Reset tracked query so new searches are tracked
            lastTrackedQuery.current = "";

            // Close search (if handler provided)
            if (customOnClose) {
                customOnClose();
            }
        },
        [router, search, customOnSelect, customOnClose, trackEvent],
    );

    /**
     * Handle search close
     * Clears search and calls custom close handler
     */
    const onClose = useCallback(() => {
        search.clearSearch();
        // Reset tracked query so new searches are tracked
        lastTrackedQuery.current = "";
        if (customOnClose) {
            customOnClose();
        }
    }, [search, customOnClose]);

    /**
     * Handle keyboard events for navigation
     * - Arrow Up: Navigate to previous result
     * - Arrow Down: Navigate to next result
     * - Enter: Select current result
     * - Escape: Close search
     */
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    search.navigateUp();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    search.navigateDown();
                    break;
                case "Enter":
                    e.preventDefault();
                    const selectedAnime = search.getSelectedAnime();
                    if (selectedAnime) {
                        onSelect(selectedAnime);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    onClose();
                    break;
            }
        },
        [search, onSelect, onClose],
    );

    // Reset selection when results change
    useEffect(() => {
        search.resetSelection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search.results]);

    const value: SearchContextValue = {
        ...search,
        onSelect,
        onClose,
        handleKeyDown,
        containerRef,
    };

    return (
        <SearchContext.Provider value={value}>
            <div ref={containerRef} onKeyDown={handleKeyDown}>
                {children}
            </div>
        </SearchContext.Provider>
    );
}

/**
 * Hook to access search context
 *
 * Must be used within a SearchProvider.
 *
 * @returns Search context value
 * @throws Error if used outside SearchProvider
 */
export function useSearchContext(): SearchContextValue {
    const context = useContext(SearchContext);

    if (context === undefined) {
        throw new Error("useSearchContext must be used within a SearchProvider");
    }

    return context;
}
