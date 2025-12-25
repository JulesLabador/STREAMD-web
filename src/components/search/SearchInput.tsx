"use client";

import { useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useSearchContext } from "./SearchProvider";
import { Input } from "@/components/ui/input";
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
        <div className={cn("relative", className)}>
            {/* Input field using shadcn Input */}
            <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    size === "lg"
                        ? "h-12 pl-11 pr-10 text-base"
                        : "h-10 pl-9 pr-9 text-sm"
                )}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
            />

            {/* Loading indicator */}
            {isLoading && (
                <Loader2
                    className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground",
                        size === "lg" ? "h-5 w-5" : "h-4 w-4"
                    )}
                />
            )}
        </div>
    );
}
