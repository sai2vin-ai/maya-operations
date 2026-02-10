import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

// Helper to create an array of numbers [1, 2, ..., n]
function makeItems(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
}

describe('usePagination', () => {
    it('returns first page of items with default page size', () => {
        const items = makeItems(50);
        const { result } = renderHook(() => usePagination(items));

        expect(result.current.pageItems).toEqual(makeItems(20));
        expect(result.current.currentPage).toBe(1);
        expect(result.current.pageSize).toBe(20);
    });

    it('calculates totalPages correctly', () => {
        // 50 items / 20 per page = 3 pages (20+20+10)
        const { result: r1 } = renderHook(() => usePagination(makeItems(50)));
        expect(r1.current.totalPages).toBe(3);

        // 40 items / 20 per page = exactly 2 pages
        const { result: r2 } = renderHook(() => usePagination(makeItems(40)));
        expect(r2.current.totalPages).toBe(2);

        // 1 item / 20 per page = 1 page
        const { result: r3 } = renderHook(() => usePagination(makeItems(1)));
        expect(r3.current.totalPages).toBe(1);
    });

    it('returns totalItems count', () => {
        const items = makeItems(37);
        const { result } = renderHook(() => usePagination(items));

        expect(result.current.totalItems).toBe(37);
    });

    it('hasNextPage is true when more pages exist', () => {
        const items = makeItems(50); // 3 pages
        const { result } = renderHook(() => usePagination(items));

        expect(result.current.hasNextPage).toBe(true);
    });

    it('hasPrevPage is false on first page', () => {
        const items = makeItems(50);
        const { result } = renderHook(() => usePagination(items));

        expect(result.current.currentPage).toBe(1);
        expect(result.current.hasPrevPage).toBe(false);
    });

    it('nextPage advances to next page', () => {
        const items = makeItems(50);
        const { result } = renderHook(() => usePagination(items));

        act(() => {
            result.current.nextPage();
        });

        expect(result.current.currentPage).toBe(2);
        expect(result.current.pageItems).toEqual(Array.from({ length: 20 }, (_, i) => i + 21));
        expect(result.current.hasPrevPage).toBe(true);
    });

    it('prevPage goes to previous page', () => {
        const items = makeItems(50);
        const { result } = renderHook(() => usePagination(items));

        // Go to page 2 first
        act(() => {
            result.current.nextPage();
        });
        expect(result.current.currentPage).toBe(2);

        // Then go back
        act(() => {
            result.current.prevPage();
        });
        expect(result.current.currentPage).toBe(1);
        expect(result.current.pageItems).toEqual(makeItems(20));
    });

    it('prevPage does not go below page 1', () => {
        const items = makeItems(50);
        const { result } = renderHook(() => usePagination(items));

        expect(result.current.currentPage).toBe(1);

        act(() => {
            result.current.prevPage();
        });

        expect(result.current.currentPage).toBe(1);
    });

    it('nextPage does not go beyond totalPages', () => {
        const items = makeItems(50); // 3 pages
        const { result } = renderHook(() => usePagination(items));

        // Navigate to last page
        act(() => {
            result.current.goToPage(3);
        });
        expect(result.current.currentPage).toBe(3);
        expect(result.current.hasNextPage).toBe(false);

        // Try to go beyond
        act(() => {
            result.current.nextPage();
        });
        expect(result.current.currentPage).toBe(3);
    });

    it('goToPage navigates to specific page', () => {
        const items = makeItems(100); // 5 pages with default size 20
        const { result } = renderHook(() => usePagination(items));

        act(() => {
            result.current.goToPage(3);
        });

        expect(result.current.currentPage).toBe(3);
        expect(result.current.pageItems).toEqual(Array.from({ length: 20 }, (_, i) => i + 41));
    });

    it('goToPage clamps to valid range', () => {
        const items = makeItems(50); // 3 pages
        const { result } = renderHook(() => usePagination(items));

        // Clamp above totalPages
        act(() => {
            result.current.goToPage(100);
        });
        expect(result.current.currentPage).toBe(3);

        // Clamp below 1
        act(() => {
            result.current.goToPage(0);
        });
        expect(result.current.currentPage).toBe(1);

        act(() => {
            result.current.goToPage(-5);
        });
        expect(result.current.currentPage).toBe(1);
    });

    it('resetPage returns to page 1', () => {
        const items = makeItems(50);
        const { result } = renderHook(() => usePagination(items));

        // Go to page 3
        act(() => {
            result.current.goToPage(3);
        });
        expect(result.current.currentPage).toBe(3);

        // Reset
        act(() => {
            result.current.resetPage();
        });
        expect(result.current.currentPage).toBe(1);
        expect(result.current.pageItems).toEqual(makeItems(20));
    });

    it('custom pageSize works', () => {
        const items = makeItems(25);
        const { result } = renderHook(() => usePagination(items, { pageSize: 10 }));

        expect(result.current.pageSize).toBe(10);
        expect(result.current.totalPages).toBe(3); // ceil(25/10)
        expect(result.current.pageItems).toEqual(makeItems(10));

        // Second page should have items 11-20
        act(() => {
            result.current.nextPage();
        });
        expect(result.current.pageItems).toEqual(Array.from({ length: 10 }, (_, i) => i + 11));

        // Third page should have items 21-25
        act(() => {
            result.current.nextPage();
        });
        expect(result.current.pageItems).toEqual(Array.from({ length: 5 }, (_, i) => i + 21));
    });

    it('custom initialPage works', () => {
        const items = makeItems(50);
        const { result } = renderHook(() => usePagination(items, { initialPage: 2 }));

        expect(result.current.currentPage).toBe(2);
        expect(result.current.pageItems).toEqual(Array.from({ length: 20 }, (_, i) => i + 21));
        expect(result.current.hasPrevPage).toBe(true);
    });

    it('empty array returns empty pageItems with totalPages=1', () => {
        const { result } = renderHook(() => usePagination([]));

        expect(result.current.pageItems).toEqual([]);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.totalItems).toBe(0);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPrevPage).toBe(false);
    });

    it('single item returns correct results', () => {
        const { result } = renderHook(() => usePagination(['only-item']));

        expect(result.current.pageItems).toEqual(['only-item']);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.totalItems).toBe(1);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPrevPage).toBe(false);
    });

    it('clamps current page when items shrink', () => {
        let items = makeItems(50); // 3 pages
        const { result, rerender } = renderHook(({ items: hookItems }) => usePagination(hookItems), {
            initialProps: { items },
        });

        // Navigate to page 3
        act(() => {
            result.current.goToPage(3);
        });
        expect(result.current.currentPage).toBe(3);

        // Shrink to 30 items (2 pages) - page 3 no longer exists
        items = makeItems(30);
        rerender({ items });

        expect(result.current.currentPage).toBe(2);
        expect(result.current.totalPages).toBe(2);
    });
});
