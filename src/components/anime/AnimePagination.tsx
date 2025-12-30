import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

/**
 * Props for the AnimePagination component
 */
interface AnimePaginationProps {
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Base path for pagination links (e.g., "/browse", "/genre/action") */
    basePath: string;
    /** Optional search params to preserve in pagination links */
    searchParams?: Record<string, string | string[] | undefined>;
    /** Number of page links to show on each side of current page */
    siblingCount?: number;
}

/**
 * Builds a URL with the given page number and search params
 * @param basePath - Base path for the URL
 * @param page - Page number to include
 * @param searchParams - Additional search params to preserve
 * @returns Complete URL string
 */
function buildPageUrl(
    basePath: string,
    page: number,
    searchParams?: Record<string, string | string[] | undefined>
): string {
    const params = new URLSearchParams();

    // Add existing search params (except page)
    if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
            if (key === "page") return; // Skip page, we'll add it below
            if (value === undefined) return;
            if (Array.isArray(value)) {
                value.forEach((v) => params.append(key, v));
            } else {
                params.set(key, value);
            }
        });
    }

    // Add page param (only if not page 1)
    if (page > 1) {
        params.set("page", page.toString());
    }

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Generates an array of page numbers to display
 * Shows first page, last page, current page, and siblings with ellipsis
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param siblingCount - Number of siblings on each side
 * @returns Array of page numbers and "ellipsis" markers
 */
function generatePaginationRange(
    currentPage: number,
    totalPages: number,
    siblingCount: number
): (number | "ellipsis")[] {
    // Total items we want to show (first + last + current + siblings + 2 ellipsis)
    const totalPageNumbers = siblingCount * 2 + 5;

    // If total pages is less than what we want to show, show all pages
    if (totalPages <= totalPageNumbers) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    // Case 1: No left ellipsis, show right ellipsis
    if (!showLeftEllipsis && showRightEllipsis) {
        const leftItemCount = 3 + 2 * siblingCount;
        const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, "ellipsis", totalPages];
    }

    // Case 2: Show left ellipsis, no right ellipsis
    if (showLeftEllipsis && !showRightEllipsis) {
        const rightItemCount = 3 + 2 * siblingCount;
        const rightRange = Array.from(
            { length: rightItemCount },
            (_, i) => totalPages - rightItemCount + i + 1
        );
        return [1, "ellipsis", ...rightRange];
    }

    // Case 3: Show both ellipsis
    const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
    );
    return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
}

/**
 * AnimePagination component
 *
 * A reusable pagination component for anime list pages.
 * Works with server-side pagination using URL search params.
 *
 * Features:
 * - Shows page numbers with ellipsis for large page counts
 * - Preserves existing search params when navigating
 * - Responsive design (icons only on mobile, text on desktop)
 * - Accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * <AnimePagination
 *   currentPage={3}
 *   totalPages={10}
 *   basePath="/browse"
 *   searchParams={{ genres: "action", years: "2024" }}
 * />
 * ```
 */
export function AnimePagination({
    currentPage,
    totalPages,
    basePath,
    searchParams,
    siblingCount = 1,
}: AnimePaginationProps) {
    // Don&apos;t render if only one page
    if (totalPages <= 1) {
        return null;
    }

    const paginationRange = generatePaginationRange(
        currentPage,
        totalPages,
        siblingCount
    );

    const hasPreviousPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;

    return (
        <Pagination className="mt-8">
            <PaginationContent>
                {/* Previous button */}
                <PaginationItem>
                    {hasPreviousPage ? (
                        <PaginationPrevious
                            href={buildPageUrl(
                                basePath,
                                currentPage - 1,
                                searchParams
                            )}
                        />
                    ) : (
                        <PaginationPrevious
                            className="pointer-events-none opacity-50"
                            aria-disabled="true"
                        />
                    )}
                </PaginationItem>

                {/* Page numbers */}
                {paginationRange.map((pageNumber, index) => {
                    if (pageNumber === "ellipsis") {
                        return (
                            <PaginationItem key={`ellipsis-${index}`}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        );
                    }

                    return (
                        <PaginationItem key={pageNumber}>
                            <PaginationLink
                                href={buildPageUrl(
                                    basePath,
                                    pageNumber,
                                    searchParams
                                )}
                                isActive={pageNumber === currentPage}
                            >
                                {pageNumber}
                            </PaginationLink>
                        </PaginationItem>
                    );
                })}

                {/* Next button */}
                <PaginationItem>
                    {hasNextPage ? (
                        <PaginationNext
                            href={buildPageUrl(
                                basePath,
                                currentPage + 1,
                                searchParams
                            )}
                        />
                    ) : (
                        <PaginationNext
                            className="pointer-events-none opacity-50"
                            aria-disabled="true"
                        />
                    )}
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}

