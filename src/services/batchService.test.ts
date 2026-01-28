import { describe, it, expect } from 'vitest';
import { BATCH_STEPS, BATCH_STATUSES, getBatchStatusInfo } from '../services/batchService';

describe('batchService', () => {
    describe('BATCH_STEPS', () => {
        it('should have exactly 14 steps', () => {
            expect(BATCH_STEPS).toHaveLength(14);
        });

        it('should have sequential step numbers', () => {
            BATCH_STEPS.forEach((step, index) => {
                expect(step.stepNumber).toBe(index + 1);
            });
        });

        it('should have step names for all steps', () => {
            BATCH_STEPS.forEach((step) => {
                expect(step.stepName).toBeTruthy();
                expect(typeof step.stepName).toBe('string');
            });
        });

        it('should require photos for appropriate steps', () => {
            const photoRequiredSteps = BATCH_STEPS.filter(s => s.requiresPhoto);
            // Steps 1-8, 10-13 require photos; steps 9 and 14 do not
            expect(photoRequiredSteps.map(s => s.stepNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13]);
        });

        it('should have correct temperature thresholds', () => {
            const ventingStep = BATCH_STEPS.find(s => s.stepNumber === 10) as any;
            const carbonStep = BATCH_STEPS.find(s => s.stepNumber === 11) as any;
            expect(ventingStep?.tempThreshold).toBe(200);
            expect(carbonStep?.tempThreshold).toBe(70);
        });
    });

    describe('BATCH_STATUSES', () => {
        it('should have all required statuses', () => {
            const statusValues = BATCH_STATUSES.map(s => s.value);
            expect(statusValues).toContain('CREATED');
            expect(statusValues).toContain('IN_PROGRESS');
            expect(statusValues).toContain('COOLING');
            expect(statusValues).toContain('COMPLETED');
            expect(statusValues).toContain('CANCELLED');
        });

        it('should have labels and colors for all statuses', () => {
            BATCH_STATUSES.forEach((status) => {
                expect(status.label).toBeTruthy();
                expect(status.color).toBeTruthy();
            });
        });
    });

    describe('getBatchStatusInfo', () => {
        it('should return correct info for IN_PROGRESS', () => {
            const info = getBatchStatusInfo('IN_PROGRESS');
            expect(info.value).toBe('IN_PROGRESS');
            expect(info.label).toBe('In Progress');
            expect(info.color).toBe('green');
        });

        it('should return correct info for COMPLETED', () => {
            const info = getBatchStatusInfo('COMPLETED');
            expect(info.value).toBe('COMPLETED');
            expect(info.label).toBe('Completed');
        });

        it('should return default for unknown status', () => {
            const info = getBatchStatusInfo('UNKNOWN' as any);
            expect(info.value).toBe('CREATED');
        });
    });
});
