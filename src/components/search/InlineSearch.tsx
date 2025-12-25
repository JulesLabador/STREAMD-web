"use client";

import { useState, useRef, useEffect } from "react";
import { SearchProvider } from "./SearchProvider";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import { cn } from "@/lib/utils";

/**
 * Props for InlineSearch
 */
interface InlineSearchProps {
    /** Additional className for the container */
    className?: string;
    /** Placeholder text for the input */
    placeholder?: string;
}

/**
 * InlineSearch - Inline search component for homepage
 *
 * Features:
 * - Full-width search input
 * - Results dropdown appears below input when typing
 * - Full keyboard navigation
 * - Click outside to close results
 *
 * Uses the shared SearchProvider, SearchInput, and SearchResults
 * components for consistent behavior with SearchModal.
 */
export function InlineSearch({
    className,
    placeholder = "Search anime...",
}: InlineSearchProps) {
    const [showResults, setShowResults] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * Handle click outside to close results
     */
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /**
     * Handle close - hide results dropdown
     */
    const handleClose = () => {
        setShowResults(false);
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <SearchProvider onClose={handleClose}>
                {/* Wrapper to detect input focus/changes */}
                <div
                    onFocus={() => setShowResults(true)}
                    onClick={() => setShowResults(true)}
                >
                    <SearchInput placeholder={placeholder} size="lg" />
                </div>

                {/* Results dropdown */}
                {showResults && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border border-border bg-background shadow-lg">
                        <SearchResults
                            maxHeight="350px"
                            showEmptyState={false}
                        />
                    </div>
                )}
            </SearchProvider>
        </div>
    );
}
