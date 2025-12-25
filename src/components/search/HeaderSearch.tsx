"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchModal } from "./SearchModal";

/**
 * HeaderSearch - Search trigger button and modal for the header
 *
 * This is a client component that can be used within the server-rendered Header.
 * It manages the open state of the search modal and renders:
 * - A search trigger button with keyboard shortcut hint
 * - The SearchModal component
 */
export function HeaderSearch() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Search trigger button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                className="relative h-9 w-9 p-0 sm:w-auto sm:px-3 sm:pr-12"
            >
                <Search className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline-flex text-muted-foreground">
                    Search...
                </span>
                {/* Keyboard shortcut hint */}
                <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            {/* Search modal */}
            <SearchModal open={open} onOpenChange={setOpen} />
        </>
    );
}

