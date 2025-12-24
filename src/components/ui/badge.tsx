import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge component variants using class-variance-authority
 *
 * Includes standard shadcn variants plus anime tracking status variants:
 * - watching: Green - currently watching anime
 * - completed: Purple - finished anime
 * - planned: Gray - plan to watch
 * - onHold: Amber - paused/on hold
 * - dropped: Red (muted) - dropped anime
 */
const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-sm font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
    {
        variants: {
            variant: {
                // Standard shadcn variants
                default:
                    "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
                destructive:
                    "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                outline:
                    "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",

                // Anime tracking status variants
                // Each uses a subtle background with matching text and border
                watching:
                    "border-status-watching/30 bg-status-watching/15 text-status-watching [a&]:hover:bg-status-watching/25",
                completed:
                    "border-status-completed/30 bg-status-completed/15 text-status-completed [a&]:hover:bg-status-completed/25",
                planned:
                    "border-status-planned/30 bg-status-planned/15 text-status-planned [a&]:hover:bg-status-planned/25",
                onHold: "border-status-on-hold/30 bg-status-on-hold/15 text-status-on-hold [a&]:hover:bg-status-on-hold/25",
                dropped:
                    "border-status-dropped/30 bg-status-dropped/15 text-status-dropped [a&]:hover:bg-status-dropped/25",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

/**
 * Anime tracking status type
 * Maps to badge variants for consistent status display
 */
export type AnimeStatus =
    | "watching"
    | "completed"
    | "planned"
    | "onHold"
    | "dropped";

/**
 * Badge component for displaying labels, tags, and status indicators
 *
 * @example Standard usage
 * ```tsx
 * <Badge>New</Badge>
 * <Badge variant="secondary">Draft</Badge>
 * ```
 *
 * @example Anime tracking status
 * ```tsx
 * <Badge variant="watching">Watching</Badge>
 * <Badge variant="completed">Completed</Badge>
 * <Badge variant="planned">Plan to Watch</Badge>
 * <Badge variant="onHold">On Hold</Badge>
 * <Badge variant="dropped">Dropped</Badge>
 * ```
 *
 * @example As link
 * ```tsx
 * <Badge asChild variant="watching">
 *   <a href="/anime/list?status=watching">Watching</a>
 * </Badge>
 * ```
 */
function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "span";

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
