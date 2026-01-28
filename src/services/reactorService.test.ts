import { describe, it, expect } from 'vitest';
import { REACTOR_STATUSES, getReactorStatusInfo } from '../services/reactorService';

describe('reactorService', () => {
    describe('REACTOR_STATUSES', () => {
        it('should have all required statuses', () => {
            const statusValues = REACTOR_STATUSES.map(s => s.value);
            expect(statusValues).toContain('IDLE');
            expect(statusValues).toContain('IN_BATCH');
            expect(statusValues).toContain('MAINTENANCE');
            expect(statusValues).toContain('OFFLINE');
        });

        it('should have labels and colors for all statuses', () => {
            REACTOR_STATUSES.forEach((status) => {
                expect(status.label).toBeTruthy();
                expect(status.color).toBeTruthy();
            });
        });
    });

    describe('getReactorStatusInfo', () => {
        it('should return correct info for IDLE', () => {
            const info = getReactorStatusInfo('IDLE');
            expect(info.value).toBe('IDLE');
            expect(info.label).toBe('Idle');
            expect(info.color).toBe('gray');
        });

        it('should return correct info for IN_BATCH', () => {
            const info = getReactorStatusInfo('IN_BATCH');
            expect(info.value).toBe('IN_BATCH');
            expect(info.label).toBe('In Batch');
            expect(info.color).toBe('green');
        });

        it('should return correct info for MAINTENANCE', () => {
            const info = getReactorStatusInfo('MAINTENANCE');
            expect(info.color).toBe('yellow');
        });

        it('should return default for unknown status', () => {
            const info = getReactorStatusInfo('UNKNOWN' as any);
            expect(info.value).toBe('IDLE');
        });
    });
});
