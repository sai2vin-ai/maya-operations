import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    formatDate,
    formatTime,
    formatDateTime,
    formatShortDateTime,
    formatDateForInput,
    formatRelativeTime,
    toDate,
    formatNumber,
    formatWeight,
    formatCurrency,
    formatPercentage,
    truncate,
} from './formatters';

describe('formatters utilities', () => {
    describe('toDate', () => {
        it('should handle null and undefined', () => {
            expect(toDate(null)).toBe(null);
            expect(toDate(undefined)).toBe(null);
        });

        it('should return Date objects as-is', () => {
            const date = new Date('2024-01-15T10:30:00');
            expect(toDate(date)).toBe(date);
        });

        it('should convert Firestore Timestamp-like objects', () => {
            const mockTimestamp = {
                toDate: () => new Date('2024-01-15T10:30:00'),
            };
            const result = toDate(mockTimestamp);
            expect(result?.getFullYear()).toBe(2024);
            expect(result?.getMonth()).toBe(0); // January
            expect(result?.getDate()).toBe(15);
        });

        it('should convert valid date strings', () => {
            const result = toDate('2024-01-15T10:30:00');
            expect(result?.getFullYear()).toBe(2024);
        });

        it('should convert timestamps (numbers)', () => {
            const timestamp = new Date('2024-01-15T10:30:00').getTime();
            const result = toDate(timestamp);
            expect(result?.getFullYear()).toBe(2024);
        });

        it('should return null for invalid strings', () => {
            expect(toDate('invalid-date')).toBe(null);
        });
    });

    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2024-01-15T10:30:00');
            const result = formatDate(date);
            expect(result).toContain('15');
            expect(result).toContain('2024');
        });

        it('should return dash for null', () => {
            expect(formatDate(null)).toBe('-');
            expect(formatDate(undefined)).toBe('-');
        });

        it('should accept custom options', () => {
            const date = new Date('2024-01-15T10:30:00');
            const result = formatDate(date, { weekday: 'long' });
            expect(result.toLowerCase()).toContain('monday');
        });
    });

    describe('formatTime', () => {
        it('should format time correctly', () => {
            const date = new Date('2024-01-15T14:30:00');
            const result = formatTime(date);
            // Should contain hour and minute
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });

        it('should return dash for null', () => {
            expect(formatTime(null)).toBe('-');
        });
    });

    describe('formatDateTime', () => {
        it('should format date and time', () => {
            const date = new Date('2024-01-15T14:30:00');
            const result = formatDateTime(date);
            expect(result).toContain('15');
            expect(result).toContain('2024');
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });

        it('should return dash for null', () => {
            expect(formatDateTime(null)).toBe('-');
        });
    });

    describe('formatShortDateTime', () => {
        it('should format short date and time', () => {
            const date = new Date('2024-01-15T14:30:00');
            const result = formatShortDateTime(date);
            expect(result).toContain('15');
        });

        it('should return dash for null', () => {
            expect(formatShortDateTime(null)).toBe('-');
        });
    });

    describe('formatDateForInput', () => {
        it('should format date as YYYY-MM-DD', () => {
            const date = new Date('2024-01-15T10:30:00');
            const result = formatDateForInput(date);
            expect(result).toBe('2024-01-15');
        });

        it('should return empty string for null', () => {
            expect(formatDateForInput(null)).toBe('');
        });
    });

    describe('formatRelativeTime', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-15T12:00:00'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return "just now" for recent times', () => {
            const date = new Date('2024-01-15T11:59:30');
            expect(formatRelativeTime(date)).toBe('just now');
        });

        it('should return minutes ago', () => {
            const date = new Date('2024-01-15T11:55:00');
            expect(formatRelativeTime(date)).toBe('5 minutes ago');
        });

        it('should return singular minute', () => {
            const date = new Date('2024-01-15T11:59:00');
            expect(formatRelativeTime(date)).toBe('1 minute ago');
        });

        it('should return hours ago', () => {
            const date = new Date('2024-01-15T09:00:00');
            expect(formatRelativeTime(date)).toBe('3 hours ago');
        });

        it('should return singular hour', () => {
            const date = new Date('2024-01-15T11:00:00');
            expect(formatRelativeTime(date)).toBe('1 hour ago');
        });

        it('should return yesterday', () => {
            const date = new Date('2024-01-14T12:00:00');
            expect(formatRelativeTime(date)).toBe('yesterday');
        });

        it('should return days ago', () => {
            const date = new Date('2024-01-12T12:00:00');
            expect(formatRelativeTime(date)).toBe('3 days ago');
        });

        it('should return weeks ago', () => {
            const date = new Date('2024-01-01T12:00:00');
            expect(formatRelativeTime(date)).toBe('2 weeks ago');
        });

        it('should return months ago', () => {
            const date = new Date('2023-11-15T12:00:00');
            expect(formatRelativeTime(date)).toBe('2 months ago');
        });

        it('should return years ago', () => {
            const date = new Date('2022-01-15T12:00:00');
            expect(formatRelativeTime(date)).toBe('2 years ago');
        });

        it('should return dash for null', () => {
            expect(formatRelativeTime(null)).toBe('-');
        });
    });

    describe('formatNumber', () => {
        it('should format numbers with Indian locale', () => {
            expect(formatNumber(1000000)).toMatch(/10,00,000|1,000,000/);
        });

        it('should handle decimals', () => {
            const result = formatNumber(1234.567, 2);
            expect(result).toContain('234');
            expect(result).toContain('.57'); // Rounded
        });

        it('should return dash for null/undefined', () => {
            expect(formatNumber(null)).toBe('-');
            expect(formatNumber(undefined)).toBe('-');
        });

        it('should handle zero', () => {
            expect(formatNumber(0)).toBe('0');
        });
    });

    describe('formatWeight', () => {
        it('should format weight with KG unit', () => {
            const result = formatWeight(1500);
            expect(result).toContain('1,500');
            expect(result).toContain('KG');
        });

        it('should format weight with TONS unit', () => {
            const result = formatWeight(10.5, 'TONS');
            expect(result).toContain('10');
            expect(result).toContain('TONS');
        });

        it('should return dash for null', () => {
            expect(formatWeight(null)).toBe('-');
        });
    });

    describe('formatCurrency', () => {
        it('should format currency in INR', () => {
            const result = formatCurrency(10000);
            expect(result.includes('10,000') || result.includes('10000')).toBe(true);
            expect(result).toMatch(/₹|INR/);
        });

        it('should handle decimals', () => {
            const result = formatCurrency(1234.56);
            expect(result.includes('1,234') || result.includes('1234')).toBe(true);
        });

        it('should return dash for null', () => {
            expect(formatCurrency(null)).toBe('-');
        });
    });

    describe('formatPercentage', () => {
        it('should format percentage', () => {
            expect(formatPercentage(75)).toBe('75.0%');
            expect(formatPercentage(75, 0)).toBe('75%');
        });

        it('should handle decimals', () => {
            expect(formatPercentage(33.333, 2)).toContain('33.33');
        });

        it('should return dash for null', () => {
            expect(formatPercentage(null)).toBe('-');
        });
    });

    describe('truncate', () => {
        it('should truncate long text', () => {
            const result = truncate('This is a very long text that should be truncated', 20);
            expect(result.length).toBe(20);
            expect(result.endsWith('...')).toBe(true);
        });

        it('should not truncate short text', () => {
            expect(truncate('Short', 20)).toBe('Short');
        });

        it('should handle exact length', () => {
            expect(truncate('Exactly20Character', 20)).toBe('Exactly20Character');
        });

        it('should return empty string for null/undefined', () => {
            expect(truncate(null, 20)).toBe('');
            expect(truncate(undefined, 20)).toBe('');
        });

        it('should handle empty string', () => {
            expect(truncate('', 20)).toBe('');
        });
    });
});
