"use client";

import { useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { SearchProvider } from "./SearchProvider";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/**
 * Props for SearchModal
 */
interface SearchModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when open state changes */
    onOpenChange: (open: boolean) => void;
}

/**
 * SearchModal - Command palette style search modal
 *
 * Features:
 * - Opens with CMD+K (or Ctrl+K on Windows/Linux)
 * - Full keyboard navigation (arrow keys, enter, escape)
 * - Closes on backdrop click or escape
 * - Auto-focuses search input on open
 *
 * Uses the shared SearchProvider, SearchInput, and SearchResults
 * components for consistent behavior with InlineSearch.
 */
export function SearchModal({ open, onOpenChange }: SearchModalProps) {
    /**
     * Handle closing the modal
     */
    const handleClose = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    /**
     * Global keyboard listener for CMD+K
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // CMD+K (Mac) or Ctrl+K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                onOpenChange(!open);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-lg p-0 gap-0 overflow-hidden"
                showCloseButton={false}
            >
                {/* Accessible title (visually hidden) */}
                <VisuallyHidden asChild>
                    <DialogTitle>Search anime</DialogTitle>
                </VisuallyHidden>

                <SearchProvider onClose={handleClose}>
                    {/* Search input */}
                    <div className="border-b border-border p-3">
                        <SearchInput
                            autoFocus
                            placeholder="Search anime..."
                            size="lg"
                        />
                    </div>

                    {/* Results */}
                    <SearchResults
                        maxHeight="400px"
                        showEmptyState={true}
                    />

                    {/* Keyboard hints footer */}
                    <div className="border-t border-border px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">
                                    ↑↓
                                </kbd>
                                <span>Navigate</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">
                                    ↵
                                </kbd>
                                <span>Select</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">
                                    esc
                                </kbd>
                                <span>Close</span>
                            </span>
                        </div>
                    </div>
                </SearchProvider>
            </DialogContent>
        </Dialog>
    );
}

