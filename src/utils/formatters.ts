import type { Timestamp } from 'firebase/firestore';

type TimestampLike = Timestamp | Date | { toDate: () => Date } | string | number | null | undefined;

/**
 * Format a timestamp to a localized date string
 */
export function formatDate(
    timestamp: TimestampLike,
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }
): string {
    const date = toDate(timestamp);
    if (!date) return '-';
    return date.toLocaleDateString('en-IN', options);
}

/**
 * Format a timestamp to a localized time string
 */
export function formatTime(
    timestamp: TimestampLike,
    options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
    }
): string {
    const date = toDate(timestamp);
    if (!date) return '-';
    return date.toLocaleTimeString('en-IN', options);
}

/**
 * Format a timestamp to a localized date and time string
 */
export function formatDateTime(
    timestamp: TimestampLike,
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }
): string {
    const date = toDate(timestamp);
    if (!date) return '-';
    return date.toLocaleString('en-IN', options);
}

/**
 * Format a timestamp to a short date/time string (e.g., "28 Jan, 14:30")
 */
export function formatShortDateTime(timestamp: TimestampLike): string {
    const date = toDate(timestamp);
    if (!date) return '-';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format a timestamp for display in forms (YYYY-MM-DD)
 */
export function formatDateForInput(timestamp: TimestampLike): string {
    const date = toDate(timestamp);
    if (!date) return '';
    return date.toISOString().split('T')[0];
}

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeTime(timestamp: TimestampLike): string {
    const date = toDate(timestamp);
    if (!date) return '-';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

/**
 * Convert various timestamp types to a Date object
 */
export function toDate(timestamp: TimestampLike): Date | null {
    if (!timestamp) return null;

    // Already a Date
    if (timestamp instanceof Date) return timestamp;

    // Firestore Timestamp with toDate method
    if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }

    // String or number
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
    }

    return null;
}

/**
 * Format a number with commas
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Format a weight value with unit
 */
export function formatWeight(value: number | null | undefined, unit: 'KG' | 'TONS' = 'KG'): string {
    if (value === null || value === undefined) return '-';
    return `${formatNumber(value, 2)} ${unit}`;
}

/**
 * Format currency (INR)
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
    if (value === null || value === undefined) return '-';
    return `${formatNumber(value, decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3)}...`;
}
