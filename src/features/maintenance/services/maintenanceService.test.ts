import { describe, it, expect } from 'vitest';
import { JOB_STATUS_CONFIG, JOB_PRIORITY_CONFIG, JOB_TYPE_CONFIG } from './maintenanceService';

describe('maintenanceService', () => {
    describe('JOB_STATUS_CONFIG', () => {
        it('should have all required job statuses', () => {
            const statusKeys = Object.keys(JOB_STATUS_CONFIG);
            expect(statusKeys).toContain('OPEN');
            expect(statusKeys).toContain('ASSIGNED');
            expect(statusKeys).toContain('IN_PROGRESS');
            expect(statusKeys).toContain('PENDING_PARTS');
            expect(statusKeys).toContain('COMPLETED');
            expect(statusKeys).toContain('CLOSED');
        });

        it('should have exactly 6 statuses', () => {
            expect(Object.keys(JOB_STATUS_CONFIG)).toHaveLength(6);
        });

        it('should have labels for all statuses', () => {
            Object.values(JOB_STATUS_CONFIG).forEach((config) => {
                expect(config.label).toBeDefined();
                expect(typeof config.label).toBe('string');
                expect(config.label.length).toBeGreaterThan(0);
            });
        });

        it('should have color classes for all statuses', () => {
            Object.values(JOB_STATUS_CONFIG).forEach((config) => {
                expect(config.color).toBeDefined();
                expect(typeof config.color).toBe('string');
                expect(config.color.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            expect(JOB_STATUS_CONFIG.OPEN.label).toBe('Open');
            expect(JOB_STATUS_CONFIG.ASSIGNED.label).toBe('Assigned');
            expect(JOB_STATUS_CONFIG.IN_PROGRESS.label).toBe('In Progress');
            expect(JOB_STATUS_CONFIG.PENDING_PARTS.label).toBe('Pending Parts');
            expect(JOB_STATUS_CONFIG.COMPLETED.label).toBe('Completed');
            expect(JOB_STATUS_CONFIG.CLOSED.label).toBe('Closed');
        });

        it('should have unique labels', () => {
            const labels = Object.values(JOB_STATUS_CONFIG).map((c) => c.label);
            const uniqueLabels = new Set(labels);
            expect(uniqueLabels.size).toBe(labels.length);
        });

        it('should use Tailwind CSS color classes', () => {
            Object.values(JOB_STATUS_CONFIG).forEach((config) => {
                expect(config.color).toMatch(/^bg-\w+-\d+\/\d+\s+text-\w+-\d+$/);
            });
        });
    });

    describe('JOB_PRIORITY_CONFIG', () => {
        it('should have all required priorities', () => {
            const priorityKeys = Object.keys(JOB_PRIORITY_CONFIG);
            expect(priorityKeys).toContain('CRITICAL');
            expect(priorityKeys).toContain('HIGH');
            expect(priorityKeys).toContain('MEDIUM');
            expect(priorityKeys).toContain('LOW');
        });

        it('should have exactly 4 priorities', () => {
            expect(Object.keys(JOB_PRIORITY_CONFIG)).toHaveLength(4);
        });

        it('should have labels for all priorities', () => {
            Object.values(JOB_PRIORITY_CONFIG).forEach((config) => {
                expect(config.label).toBeDefined();
                expect(typeof config.label).toBe('string');
                expect(config.label.length).toBeGreaterThan(0);
            });
        });

        it('should have color classes for all priorities', () => {
            Object.values(JOB_PRIORITY_CONFIG).forEach((config) => {
                expect(config.color).toBeDefined();
                expect(typeof config.color).toBe('string');
                expect(config.color.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            expect(JOB_PRIORITY_CONFIG.CRITICAL.label).toBe('Critical');
            expect(JOB_PRIORITY_CONFIG.HIGH.label).toBe('High');
            expect(JOB_PRIORITY_CONFIG.MEDIUM.label).toBe('Medium');
            expect(JOB_PRIORITY_CONFIG.LOW.label).toBe('Low');
        });

        it('should have unique labels', () => {
            const labels = Object.values(JOB_PRIORITY_CONFIG).map((c) => c.label);
            const uniqueLabels = new Set(labels);
            expect(uniqueLabels.size).toBe(labels.length);
        });

        it('should use red color for CRITICAL priority', () => {
            expect(JOB_PRIORITY_CONFIG.CRITICAL.color).toContain('red');
        });

        it('should use green color for LOW priority', () => {
            expect(JOB_PRIORITY_CONFIG.LOW.color).toContain('green');
        });
    });

    describe('JOB_TYPE_CONFIG', () => {
        it('should have all required job types', () => {
            const typeKeys = Object.keys(JOB_TYPE_CONFIG);
            expect(typeKeys).toContain('BREAKDOWN');
            expect(typeKeys).toContain('PREVENTIVE');
            expect(typeKeys).toContain('CORRECTIVE');
        });

        it('should have exactly 3 job types', () => {
            expect(Object.keys(JOB_TYPE_CONFIG)).toHaveLength(3);
        });

        it('should have labels for all job types', () => {
            Object.values(JOB_TYPE_CONFIG).forEach((config) => {
                expect(config.label).toBeDefined();
                expect(typeof config.label).toBe('string');
                expect(config.label.length).toBeGreaterThan(0);
            });
        });

        it('should have color classes for all job types', () => {
            Object.values(JOB_TYPE_CONFIG).forEach((config) => {
                expect(config.color).toBeDefined();
                expect(typeof config.color).toBe('string');
                expect(config.color.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            expect(JOB_TYPE_CONFIG.BREAKDOWN.label).toBe('Breakdown');
            expect(JOB_TYPE_CONFIG.PREVENTIVE.label).toBe('Preventive');
            expect(JOB_TYPE_CONFIG.CORRECTIVE.label).toBe('Corrective');
        });

        it('should have unique labels', () => {
            const labels = Object.values(JOB_TYPE_CONFIG).map((c) => c.label);
            const uniqueLabels = new Set(labels);
            expect(uniqueLabels.size).toBe(labels.length);
        });

        it('should use red color for BREAKDOWN type', () => {
            expect(JOB_TYPE_CONFIG.BREAKDOWN.color).toContain('red');
        });

        it('should use blue color for PREVENTIVE type', () => {
            expect(JOB_TYPE_CONFIG.PREVENTIVE.color).toContain('blue');
        });

        it('should use yellow color for CORRECTIVE type', () => {
            expect(JOB_TYPE_CONFIG.CORRECTIVE.color).toContain('yellow');
        });
    });
});
