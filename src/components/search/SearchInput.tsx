"use client";

import { useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useSearchContext } from "./SearchProvider";
import { cn } from "@/lib/utils";

/**
 * Props for SearchInput
 */
interface SearchInputProps {
    /** Whether to auto-focus the input on mount */
    autoFocus?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Additional className for the container */
    className?: string;
    /** Size variant */
    size?: "default" | "lg";
}

/**
 * SearchInput - Shared search input component
 *
 * Consumes search state from SearchProvider context.
 * Displays a search icon and loading indicator.
 *
 * Used by both SearchModal and InlineSearch.
 */
export function SearchInput({
    autoFocus = false,
    placeholder = "Search anime...",
    className,
    size = "default",
}: SearchInputProps) {
    const { query, setQuery, isLoading } = useSearchContext();
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus on mount if requested
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            // Small delay to ensure modal animation completes
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    return (
        <div className={cn("flex items-center", className)}>
            {/* Search icon */}
            <Search
                className={cn(
                    "absolute text-muted-foreground pointer-events-none",
                    size === "lg" ? "left-3 h-5 w-5" : "left-3 h-4 w-4"
                )}
            />

            {/* Input field */}
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full rounded-lg border border-input bg-background text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                    "transition-colors",
                    size === "lg"
                        ? "h-12 pl-12 pr-10 text-base"
                        : "h-10 pl-10 pr-9 text-sm"
                )}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
            />

            {/* Loading indicator */}
            {isLoading && (
                <Loader2
                    className={cn(
                        "absolute right-3 animate-spin text-muted-foreground",
                        size === "lg" ? "h-5 w-5" : "h-4 w-4"
                    )}
                />
            )}
        </div>
    );
}
