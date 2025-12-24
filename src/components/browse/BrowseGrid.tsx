/**
 * Props for the BrowseGrid component
 */
interface BrowseGridProps {
  /** Grid items */
  children: React.ReactNode;
  /** Optional empty state message */
  emptyMessage?: string;
  /** Whether the grid is empty */
  isEmpty?: boolean;
}

/**
 * BrowseGrid component
 *
 * Responsive grid layout for browse index pages.
 * Adjusts columns based on viewport:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 3-4 columns
 */
export function BrowseGrid({
  children,
  emptyMessage = 'No items found',
  isEmpty = false,
}: BrowseGridProps) {
  // Empty state
  if (isEmpty) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}

