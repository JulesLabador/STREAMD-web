import type { ComponentType } from "react";

/**
 * Props for the InfoItem component
 */
interface InfoItemProps {
    /** Lucide icon component to display */
    icon: ComponentType<{ className?: string }>;
    /** Label text shown above the value */
    label: string;
    /** The main value to display */
    value: string;
}

/**
 * Info item component for displaying labeled data with an icon
 * Used in anime detail pages to show metadata like format, episodes, duration, etc.
 *
 * @example
 * <InfoItem icon={Tv} label="Format" value="TV" />
 */
export function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
    return (
        <div className="flex items-center gap-3">
            {/* Icon container with primary background */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            {/* Text content */}
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium truncate">{value}</p>
            </div>
        </div>
    );
}

