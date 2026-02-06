/**
 * Performance monitoring and optimization utilities
 */

// Performance metrics storage
interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
}

const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 100;

/**
 * Measure the execution time of an async function
 */
export async function measureAsync<T>(
    name: string,
    fn: () => Promise<T>
): Promise<T> {
    const start = performance.now();
    try {
        return await fn();
    } finally {
        const duration = performance.now() - start;
        recordMetric(name, duration);
    }
}

/**
 * Measure the execution time of a sync function
 */
export function measureSync<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
        return fn();
    } finally {
        const duration = performance.now() - start;
        recordMetric(name, duration);
    }
}

/**
 * Record a performance metric
 */
function recordMetric(name: string, duration: number): void {
    metrics.push({
        name,
        duration,
        timestamp: Date.now(),
    });

    // Keep only the last N metrics
    if (metrics.length > MAX_METRICS) {
        metrics.shift();
    }

    // Log slow operations in development
    if (import.meta.env.DEV && duration > 100) {
        console.warn(`[Performance] Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
}

/**
 * Get performance metrics
 */
export function getMetrics(): PerformanceMetric[] {
    return [...metrics];
}

/**
 * Clear performance metrics
 */
export function clearMetrics(): void {
    metrics.length = 0;
}

/**
 * Get average duration for a metric
 */
export function getAverageDuration(name: string): number | null {
    const matchingMetrics = metrics.filter((m) => m.name === name);
    if (matchingMetrics.length === 0) return null;

    const total = matchingMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / matchingMetrics.length;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Create a memoized function with LRU cache
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
    fn: T,
    maxSize: number = 50
): T {
    const cache = new Map<string, ReturnType<T>>();
    const keyOrder: string[] = [];

    return ((...args: Parameters<T>): ReturnType<T> => {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key) as ReturnType<T>;
        }

        const result = fn(...args) as ReturnType<T>;

        // Add to cache
        cache.set(key, result);
        keyOrder.push(key);

        // Evict oldest entry if cache is full
        if (keyOrder.length > maxSize) {
            const oldestKey = keyOrder.shift()!;
            cache.delete(oldestKey);
        }

        return result;
    }) as T;
}

/**
 * Report Web Vitals metrics
 */
export function reportWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Report Core Web Vitals
    if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        try {
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
                const lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
                recordMetric('LCP', lcp);
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch {
            // LCP not supported
        }

        // First Input Delay (FID)
        try {
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach((entry) => {
                    const fidEntry = entry as PerformanceEntry & { processingStart: number };
                    recordMetric('FID', fidEntry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ type: 'first-input', buffered: true });
        } catch {
            // FID not supported
        }

        // Cumulative Layout Shift (CLS)
        try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach((entry) => {
                    const clsEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
                    if (!clsEntry.hadRecentInput) {
                        clsValue += clsEntry.value;
                    }
                });
                recordMetric('CLS', clsValue);
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch {
            // CLS not supported
        }
    }

    // Navigation timing
    window.addEventListener('load', () => {
        setTimeout(() => {
            const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigationEntry) {
                recordMetric('TTFB', navigationEntry.responseStart);
                recordMetric('DOM_LOAD', navigationEntry.domContentLoadedEventEnd);
                recordMetric('PAGE_LOAD', navigationEntry.loadEventEnd);
            }
        }, 0);
    });
}

/**
 * Image lazy loading utility
 */
export function createLazyImageObserver(
    onIntersect: (img: HTMLImageElement) => void
): IntersectionObserver | null {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        return null;
    }

    return new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    onIntersect(img);
                    observer.unobserve(img);
                }
            });
        },
        {
            rootMargin: '50px 0px',
            threshold: 0.01,
        }
    );
}
