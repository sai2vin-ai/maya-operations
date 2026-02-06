import { useState, useMemo, useCallback } from 'react';

interface PaginationOptions {
    /** Items per page (default: 20) */
    pageSize?: number;
    /** Initial page (default: 1) */
    initialPage?: number;
}

interface PaginationResult<T> {
    /** Current page items */
    pageItems: T[];
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Total number of items */
    totalItems: number;
    /** Items per page */
    pageSize: number;
    /** Whether there's a next page */
    hasNextPage: boolean;
    /** Whether there's a previous page */
    hasPrevPage: boolean;
    /** Go to next page */
    nextPage: () => void;
    /** Go to previous page */
    prevPage: () => void;
    /** Go to a specific page */
    goToPage: (page: number) => void;
    /** Reset to first page */
    resetPage: () => void;
}

/**
 * Hook for client-side pagination of a list of items.
 * Use this to paginate data that's already loaded in memory.
 */
export function usePagination<T>(
    items: T[],
    options: PaginationOptions = {}
): PaginationResult<T> {
    const { pageSize = 20, initialPage = 1 } = options;
    const [currentPage, setCurrentPage] = useState(initialPage);

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Clamp current page if items change
    const safePage = Math.min(currentPage, totalPages);

    const pageItems = useMemo(() => {
        const startIndex = (safePage - 1) * pageSize;
        return items.slice(startIndex, startIndex + pageSize);
    }, [items, safePage, pageSize]);

    const hasNextPage = safePage < totalPages;
    const hasPrevPage = safePage > 1;

    const nextPage = useCallback(() => {
        setCurrentPage(p => Math.min(p + 1, totalPages));
    }, [totalPages]);

    const prevPage = useCallback(() => {
        setCurrentPage(p => Math.max(p - 1, 1));
    }, []);

    const goToPage = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    const resetPage = useCallback(() => {
        setCurrentPage(1);
    }, []);

    return {
        pageItems,
        currentPage: safePage,
        totalPages,
        totalItems,
        pageSize,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        goToPage,
        resetPage,
    };
}
