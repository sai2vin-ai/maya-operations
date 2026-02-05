import { describe, it, expect } from 'vitest';
import { BATCH_STEPS, BATCH_STATUSES, getBatchStatusInfo } from './batchService';

describe('batchService', () => {
    describe('BATCH_STEPS', () => {
        it('should have exactly 14 steps', () => {
            expect(BATCH_STEPS).toHaveLength(14);
        });

        it('should have sequential step numbers starting from 1', () => {
            BATCH_STEPS.forEach((step, index) => {
                expect(step.stepNumber).toBe(index + 1);
            });
        });

        it('should have step names for all steps', () => {
            BATCH_STEPS.forEach(step => {
                expect(step.stepName).toBeTruthy();
                expect(typeof step.stepName).toBe('string');
            });
        });

        it('should have descriptions for all steps', () => {
            BATCH_STEPS.forEach(step => {
                expect(step.description).toBeTruthy();
                expect(typeof step.description).toBe('string');
            });
        });

        it('should have correct step names in order', () => {
            const expectedStepNames = [
                'CLEANING',
                'INSPECTION',
                'LOADING',
                'SEALING',
                'OIL_SEAL_LEVEL',
                'WATER_SEAL_LEVEL',
                'PRE_HEATING',
                'PYROLYSIS',
                'COOLING',
                'VENTING',
                'CARBON_DISCHARGE',
                'STEEL_DISCHARGE',
                'OIL_TRANSFER',
                'COMPLETE',
            ];
            BATCH_STEPS.forEach((step, index) => {
                expect(step.stepName).toBe(expectedStepNames[index]);
            });
        });

        it('should require photos for appropriate steps', () => {
            const photoRequiredSteps = BATCH_STEPS.filter(s => s.requiresPhoto);
            // Steps 1-8, 10-13 require photos; steps 9 and 14 do not
            expect(photoRequiredSteps.map(s => s.stepNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13]);
        });

        it('should not require photos for cooling and complete steps', () => {
            const coolingStep = BATCH_STEPS.find(s => s.stepNumber === 9);
            const completeStep = BATCH_STEPS.find(s => s.stepNumber === 14);
            expect(coolingStep?.requiresPhoto).toBe(false);
            expect(completeStep?.requiresPhoto).toBe(false);
        });

        it('should have correct temperature thresholds for safety-critical steps', () => {
            const ventingStep = BATCH_STEPS.find(s => s.stepNumber === 10) as { tempThreshold?: number };
            const carbonStep = BATCH_STEPS.find(s => s.stepNumber === 11) as { tempThreshold?: number };
            expect(ventingStep?.tempThreshold).toBe(200);
            expect(carbonStep?.tempThreshold).toBe(70);
        });

        it('should allow abort for early steps (1-6)', () => {
            BATCH_STEPS.slice(0, 6).forEach(step => {
                expect(step.canAbort).toBe(true);
            });
        });

        it('should only allow emergency abort for heating/pyrolysis steps (7-8)', () => {
            const preHeatingStep = BATCH_STEPS.find(s => s.stepNumber === 7);
            const pyrolysisStep = BATCH_STEPS.find(s => s.stepNumber === 8);
            expect(preHeatingStep?.canAbort).toBe('emergency');
            expect(pyrolysisStep?.canAbort).toBe('emergency');
        });

        it('should not allow abort for post-pyrolysis steps (9-14)', () => {
            BATCH_STEPS.slice(8).forEach(step => {
                expect(step.canAbort).toBe(false);
            });
        });

        it('should have unique step names', () => {
            const stepNames = BATCH_STEPS.map(s => s.stepName);
            const uniqueNames = new Set(stepNames);
            expect(uniqueNames.size).toBe(stepNames.length);
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

        it('should have exactly 5 statuses', () => {
            expect(BATCH_STATUSES).toHaveLength(5);
        });

        it('should have labels and colors for all statuses', () => {
            BATCH_STATUSES.forEach(status => {
                expect(status.label).toBeTruthy();
                expect(status.color).toBeTruthy();
                expect(typeof status.label).toBe('string');
                expect(typeof status.color).toBe('string');
            });
        });

        it('should have correct colors for each status', () => {
            const created = BATCH_STATUSES.find(s => s.value === 'CREATED');
            expect(created?.color).toBe('blue');

            const inProgress = BATCH_STATUSES.find(s => s.value === 'IN_PROGRESS');
            expect(inProgress?.color).toBe('green');

            const cooling = BATCH_STATUSES.find(s => s.value === 'COOLING');
            expect(cooling?.color).toBe('yellow');

            const completed = BATCH_STATUSES.find(s => s.value === 'COMPLETED');
            expect(completed?.color).toBe('gray');

            const cancelled = BATCH_STATUSES.find(s => s.value === 'CANCELLED');
            expect(cancelled?.color).toBe('red');
        });

        it('should have unique values', () => {
            const values = BATCH_STATUSES.map(s => s.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
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
            expect(info.color).toBe('gray');
        });

        it('should return correct info for COOLING', () => {
            const info = getBatchStatusInfo('COOLING');
            expect(info.value).toBe('COOLING');
            expect(info.label).toBe('Cooling');
            expect(info.color).toBe('yellow');
        });

        it('should return correct info for CANCELLED', () => {
            const info = getBatchStatusInfo('CANCELLED');
            expect(info.value).toBe('CANCELLED');
            expect(info.label).toBe('Cancelled');
            expect(info.color).toBe('red');
        });

        it('should return default (CREATED) for unknown status', () => {
            // Test with invalid value
            const info = getBatchStatusInfo('UNKNOWN' as unknown as Parameters<typeof getBatchStatusInfo>[0]);
            expect(info.value).toBe('CREATED');
        });
    });

    describe('Batch Workflow Logic', () => {
        // Test status determination logic
        const determineStatus = (stepNumber: number): string => {
            if (stepNumber >= 9 && stepNumber < 14) {
                return 'COOLING';
            } else if (stepNumber === 14) {
                return 'COMPLETED';
            }
            return 'IN_PROGRESS';
        };

        it('should be IN_PROGRESS for steps 1-8', () => {
            for (let step = 1; step <= 8; step++) {
                expect(determineStatus(step)).toBe('IN_PROGRESS');
            }
        });

        it('should be COOLING for steps 9-13', () => {
            for (let step = 9; step <= 13; step++) {
                expect(determineStatus(step)).toBe('COOLING');
            }
        });

        it('should be COMPLETED for step 14', () => {
            expect(determineStatus(14)).toBe('COMPLETED');
        });
    });

    describe('Unit Conversion Logic', () => {
        // Test unit conversion used in recordOutput
        const convertToKg = (quantity: number, unit: 'KG' | 'TONS') => {
            return unit === 'TONS' ? quantity * 1000 : quantity;
        };

        it('should convert TONS to KG correctly', () => {
            expect(convertToKg(1, 'TONS')).toBe(1000);
            expect(convertToKg(0.5, 'TONS')).toBe(500);
            expect(convertToKg(2.5, 'TONS')).toBe(2500);
        });

        it('should keep KG as is', () => {
            expect(convertToKg(500, 'KG')).toBe(500);
            expect(convertToKg(1000, 'KG')).toBe(1000);
        });
    });
});
