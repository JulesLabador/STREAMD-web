import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Size variants for the Spinner component
 */
type SpinnerSize = "sm" | "md" | "lg" | "xl";

/**
 * Props for the Spinner component
 */
interface SpinnerProps {
    /** Size of the spinner */
    size?: SpinnerSize;
    /** Optional label text displayed below the spinner */
    label?: string;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Size configuration mapping
 */
const sizeClasses: Record<SpinnerSize, string> = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
};

/**
 * Label size configuration mapping
 */
const labelSizeClasses: Record<SpinnerSize, string> = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
};

/**
 * Spinner component
 *
 * A simple animated loading spinner using Lucide&apos;s Loader2 icon.
 * Supports multiple size variants and an optional label.
 *
 * @example
 * ```tsx
 * <Spinner size="md" label="Loading..." />
 * ```
 */
export function Spinner({ size = "md", label, className }: SpinnerProps) {
    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <Loader2
                className={cn(
                    "animate-spin text-muted-foreground",
                    sizeClasses[size]
                )}
            />
            {label && (
                <span
                    className={cn(
                        "text-muted-foreground",
                        labelSizeClasses[size]
                    )}
                >
                    {label}
                </span>
            )}
        </div>
    );
}

/**
 * PageLoadingSpinner component
 *
 * A centered, full-page spinner for use in loading.tsx files.
 * Takes up minimum height and centers the spinner both horizontally and vertically.
 */
export function PageLoadingSpinner({ label }: { label?: string }) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner size="lg" label={label} />
        </div>
    );
}

