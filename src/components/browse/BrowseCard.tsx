import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Props for the BrowseCard component
 */
interface BrowseCardProps {
  /** Display name */
  name: string;
  /** Link destination */
  href: string;
  /** Count to display (e.g., anime count) */
  count: number;
  /** Unit label for the count (default: "anime") */
  countLabel?: string;
  /** Optional icon component */
  icon?: React.ReactNode;
}

/**
 * BrowseCard component
 *
 * Card for browse index pages (studios, genres, platforms, seasons)
 * Displays name, count, and optional icon with hover effects.
 */
export function BrowseCard({
  name,
  href,
  count,
  countLabel = 'anime',
  icon,
}: BrowseCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full border-0 transition-colors hover:bg-card/80">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Optional icon */}
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-foreground group-hover:text-primary">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {count.toLocaleString()} {count === 1 ? countLabel.replace(/s$/, '') : countLabel}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

