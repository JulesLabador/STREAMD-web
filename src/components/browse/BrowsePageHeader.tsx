import { BackButton } from "@/components/ui/back-button";

/**
 * Props for the BrowsePageHeader component
 */
interface BrowsePageHeaderProps {
    /** Main title of the page */
    title: string;
    /** Optional description text */
    description?: string;
    /** Total count to display (e.g., "24 anime") */
    count?: number;
    /** Unit label for the count (default: "anime") */
    countLabel?: string;
    /** Whether to show back navigation (default: true) */
    showBack?: boolean;
    /** Back button text (default: "Back") */
    backText?: string;
}

/**
 * BrowsePageHeader component
 *
 * Consistent header for browse pages with:
 * - Optional back navigation (uses browser history)
 * - Page title
 * - Optional description
 * - Optional count display
 */
export function BrowsePageHeader({
    title,
    description,
    count,
    countLabel = "anime",
    showBack = true,
    backText = "Back",
}: BrowsePageHeaderProps) {
    return (
        <div className="mb-8 space-y-4">
            {/* Back navigation - uses browser history for proper navigation */}
            {showBack && <BackButton text={backText} className="-ml-2" />}

            {/* Title and description */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 text-muted-foreground">{description}</p>
                )}
            </div>
        </div>
    );
}
