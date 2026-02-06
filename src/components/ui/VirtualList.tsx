import { useRef, useState, useCallback, useMemo, memo } from 'react';

interface VirtualListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    overscan?: number;
    className?: string;
}

/**
 * Virtualized list component for efficient rendering of large lists.
 * Only renders visible items plus a small buffer for smooth scrolling.
 */
function VirtualListInner<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 3,
    className = '',
}: VirtualListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Calculate visible range
    const { startIndex, endIndex, offsetY } = useMemo(() => {
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

        return {
            startIndex: start,
            endIndex: end,
            offsetY: start * itemHeight,
        };
    }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

    // Total height for scroll
    const totalHeight = items.length * itemHeight;

    // Visible items
    const visibleItems = useMemo(
        () => items.slice(startIndex, endIndex + 1),
        [items, startIndex, endIndex]
    );

    return (
        <div
            ref={containerRef}
            className={`overflow-auto ${className}`}
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        transform: `translateY(${offsetY}px)`,
                    }}
                >
                    {visibleItems.map((item, i) => (
                        <div
                            key={startIndex + i}
                            style={{ height: itemHeight }}
                        >
                            {renderItem(item, startIndex + i)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
