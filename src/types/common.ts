/**
 * Common types shared across the application
 */

/**
 * Standard action result type for Server Actions
 * Provides consistent error handling pattern across all data operations
 *
 * @example Success case
 * ```ts
 * return { success: true, data: anime };
 * ```
 *
 * @example Error case
 * ```ts
 * return { success: false, error: 'Anime not found', code: 'NOT_FOUND' };
 * ```
 */
export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

/**
 * Paginated response wrapper for list endpoints
 * Includes data array and pagination metadata
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
    page?: number;
    pageSize?: number;
}

/**
 * Sort parameters for list queries
 */
export interface SortParams<T extends string = string> {
    sortBy?: T;
    sortOrder?: "asc" | "desc";
}
