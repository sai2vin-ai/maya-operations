import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook for virtualized list logic (for custom implementations)
 */
export function useVirtualList<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    overscan: number = 3
) {
    const [scrollTop, setScrollTop] = useState(0);

    const { startIndex, endIndex, visibleItems, totalHeight, offsetY } = useMemo(() => {
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

        return {
            startIndex: start,
            endIndex: end,
            visibleItems: items.slice(start, end + 1),
            totalHeight: items.length * itemHeight,
            offsetY: start * itemHeight,
        };
    }, [scrollTop, itemHeight, containerHeight, items, overscan]);

    const onScroll = useCallback((scrollTop: number) => {
        setScrollTop(scrollTop);
    }, []);

    return {
        startIndex,
        endIndex,
        visibleItems,
        totalHeight,
        offsetY,
        onScroll,
    };
}

/**
 * Infinite scroll hook for loading more data
 */
export function useInfiniteScroll(
    callback: () => void,
    options: {
        threshold?: number;
        hasMore: boolean;
        isLoading: boolean;
    }
) {
    const { threshold = 100, hasMore, isLoading } = options;
    const observerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    callback();
                }
            },
            { rootMargin: `${threshold}px` }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [callback, hasMore, isLoading, threshold]);

    return observerRef;
}
