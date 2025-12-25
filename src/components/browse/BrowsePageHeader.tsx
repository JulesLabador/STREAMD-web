import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    /** Back link URL (optional) */
    backHref?: string;
    /** Back link text (default: "Back") */
    backText?: string;
}

/**
 * BrowsePageHeader component
 *
 * Consistent header for browse pages with:
 * - Optional back navigation
 * - Page title
 * - Optional description
 * - Optional count display
 */
export function BrowsePageHeader({
    title,
    description,
    count,
    countLabel = "anime",
    backHref,
    backText = "Back",
}: BrowsePageHeaderProps) {
    return (
        <div className="mb-8 space-y-4">
            {/* Back navigation */}
            {backHref && (
                <Button variant="ghost" size="sm" asChild className="-ml-2">
                    <Link href={backHref}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {backText}
                    </Link>
                </Button>
            )}

            {/* Title and description */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 text-muted-foreground">{description}</p>
                )}
            </div>

            {/* Count display */}
            {count !== undefined && (
                <p className="text-sm text-muted-foreground">
                    {count.toLocaleString()}{" "}
                    {count === 1 ? countLabel.replace(/s$/, "") : countLabel}
                </p>
            )}
        </div>
    );
}
