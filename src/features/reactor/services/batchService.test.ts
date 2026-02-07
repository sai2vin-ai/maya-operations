import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BATCH_STEPS, BATCH_STATUSES, getBatchStatusInfo } from './batchService';

// Mock firebase/firestore at the SDK level
const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockRunTransaction = vi.fn();

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
    runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: () => ({ seconds: 1700000000, nanoseconds: 0 }),
    },
}));

vi.mock('firebase/storage', () => ({
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
}));

describe('batchService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

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
            const info = getBatchStatusInfo('UNKNOWN' as unknown as Parameters<typeof getBatchStatusInfo>[0]);
            expect(info.value).toBe('CREATED');
        });
    });

    describe('Batch Workflow Logic', () => {
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

    describe('createBatch - reactor validation', () => {
        it('should reject when reactor does not exist', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });

            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => false,
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                };
                await callback(mockTransaction);
            });

            const { createBatch } = await import('./batchService');

            await expect(
                createBatch(
                    { reactorId: 'nonexistent-reactor', reactorNumber: 'M1' },
                    'user-1',
                    'SUPER_ADMIN'
                )
            ).rejects.toThrow(/does not exist/);
        });

        it('should reject when reactor already has an active batch', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });

            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ status: 'IN_BATCH' }),
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                };
                await callback(mockTransaction);
            });

            const { createBatch } = await import('./batchService');

            await expect(
                createBatch(
                    { reactorId: 'reactor-1', reactorNumber: 'M1' },
                    'user-1',
                    'SUPER_ADMIN'
                )
            ).rejects.toThrow('already has an active batch');
        });

        it('should create batch when reactor exists and is idle', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });

            let batchCreated = false;
            let reactorUpdated = false;
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ status: 'IDLE' }),
                    }),
                    set: vi.fn(() => { batchCreated = true; }),
                    update: vi.fn(() => { reactorUpdated = true; }),
                };
                await callback(mockTransaction);
            });

            const { createBatch } = await import('./batchService');

            const batchId = await createBatch(
                { reactorId: 'reactor-1', reactorNumber: 'M1' },
                'user-1',
                'SUPER_ADMIN'
            );

            expect(batchId).toBeDefined();
            expect(batchCreated).toBe(true);
            expect(reactorUpdated).toBe(true);
        });
    });

    describe('cancelBatch - reactor reset', () => {
        it('should throw when batch not found', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => false,
            });

            const { cancelBatch } = await import('./batchService');

            await expect(
                cancelBatch('nonexistent', 'Test reason', 'user-1', 'SUPER_ADMIN')
            ).rejects.toThrow('Batch not found');
        });

        it('should throw when batch has no reactorId', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'batch-1',
                data: () => ({
                    status: 'IN_PROGRESS',
                    reactorId: undefined,
                    notes: '',
                }),
            });

            const { cancelBatch } = await import('./batchService');

            await expect(
                cancelBatch('batch-1', 'Test reason', 'user-1', 'SUPER_ADMIN')
            ).rejects.toThrow('no associated reactor');
        });

        it('should atomically cancel batch and reset reactor', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'batch-1',
                data: () => ({
                    status: 'IN_PROGRESS',
                    reactorId: 'reactor-1',
                    notes: 'Original notes',
                }),
            });

            const transactionUpdateCalls: Record<string, unknown>[] = [];
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    update: vi.fn((_ref: unknown, data: Record<string, unknown>) => {
                        transactionUpdateCalls.push(data);
                    }),
                };
                await callback(mockTransaction);
            });

            const { cancelBatch } = await import('./batchService');

            await cancelBatch('batch-1', 'Equipment failure', 'user-1', 'SUPER_ADMIN');

            // Should have two transaction.update calls: batch + reactor
            expect(transactionUpdateCalls).toHaveLength(2);

            // First update: batch
            expect(transactionUpdateCalls[0].status).toBe('CANCELLED');
            expect(transactionUpdateCalls[0].notes).toContain('Cancelled: Equipment failure');
            expect(transactionUpdateCalls[0].notes).toContain('Original notes');

            // Second update: reactor reset
            expect(transactionUpdateCalls[1].status).toBe('IDLE');
            expect(transactionUpdateCalls[1].currentBatchId).toBeNull();
        });
    });

    describe('recordOutput - sequential IDs', () => {
        it('should generate sequential output IDs', async () => {
            const existingOutputs = [
                { id: 'batch_1_output_001', materialCategory: 'CB-STD', quantity: 100, unit: 'KG' },
            ];

            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'batch_1',
                data: () => ({
                    status: 'IN_PROGRESS',
                    outputs: existingOutputs,
                }),
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            const { recordOutput } = await import('./batchService');

            await recordOutput('batch_1', {
                materialCategory: 'PO-CRD',
                quantity: 500,
                unit: 'KG',
            }, 'user-1', 'SUPER_ADMIN');

            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            const outputs = updateArgs.outputs as { id: string }[];
            const newOutput = outputs[outputs.length - 1];

            // Second output should be _output_002
            expect(newOutput.id).toBe('batch_1_output_002');
        });

        it('should start with _output_001 for first output', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'batch_1',
                data: () => ({
                    status: 'IN_PROGRESS',
                    outputs: [],
                }),
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            const { recordOutput } = await import('./batchService');

            await recordOutput('batch_1', {
                materialCategory: 'CB-STD',
                quantity: 100,
                unit: 'KG',
            }, 'user-1', 'SUPER_ADMIN');

            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            const outputs = updateArgs.outputs as { id: string }[];
            expect(outputs[0].id).toBe('batch_1_output_001');
        });
    });
});
