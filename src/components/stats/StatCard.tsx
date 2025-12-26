import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Props for the StatCard component
 */
interface StatCardProps {
    /** The main statistic value to display */
    value: string | number;
    /** Label describing the statistic */
    label: string;
    /** Lucide icon component to display */
    icon: LucideIcon;
    /** Optional subtitle or additional context */
    subtitle?: string;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * StatCard component
 *
 * Displays a large statistic with an icon for dashboard headers.
 * Designed for quick glanceability with prominent numbers.
 */
export function StatCard({
    value,
    label,
    icon: Icon,
    subtitle,
    className,
}: StatCardProps) {
    return (
        <Card className={cn("relative overflow-hidden", className)}>
            <CardContent className="p-6">
                {/* Icon in top right, subtle */}
                <div className="absolute right-4 top-4 text-muted-foreground/20">
                    <Icon className="h-12 w-12" strokeWidth={1.5} />
                </div>

                {/* Main content */}
                <div className="relative space-y-1">
                    {/* Big number */}
                    <p className="text-4xl font-bold tracking-tight tabular-nums">
                        {value}
                    </p>

                    {/* Label */}
                    <p className="text-sm font-medium text-muted-foreground">
                        {label}
                    </p>

                    {/* Optional subtitle */}
                    {subtitle && (
                        <p className="text-xs text-muted-foreground/70">
                            {subtitle}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Formats minutes into a human-readable duration string
 *
 * @param minutes - Total minutes to format
 * @returns Formatted string like "14d 6h" or "2h 30m"
 */
export function formatWatchTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
        if (remainingHours > 0) {
            return `${days}d ${remainingHours}h`;
        }
        return `${days}d`;
    }

    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${hours}h`;
}

