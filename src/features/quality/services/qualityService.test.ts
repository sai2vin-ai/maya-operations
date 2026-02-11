import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetDocs, mockGetDoc, mockAddDoc, mockUpdateDoc } = vi.hoisted(() => ({
    mockGetDocs: vi.fn(),
    mockGetDoc: vi.fn(),
    mockAddDoc: vi.fn(),
    mockUpdateDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDocs: mockGetDocs,
    getDoc: mockGetDoc,
    setDoc: vi.fn(),
    updateDoc: mockUpdateDoc,
    addDoc: mockAddDoc,
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
        fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    },
    runTransaction: vi.fn(),
}));
vi.mock('../../../lib/firebase', () => ({ db: {} }));

describe('qualityService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });
    });

    describe('QC_STATUS_CONFIG', () => {
        it('should have all statuses', async () => {
            const { QC_STATUS_CONFIG } = await import('./qualityService');
            expect(QC_STATUS_CONFIG).toHaveProperty('PENDING');
            expect(QC_STATUS_CONFIG).toHaveProperty('PASSED');
            expect(QC_STATUS_CONFIG).toHaveProperty('FAILED');
            expect(QC_STATUS_CONFIG).toHaveProperty('ON_HOLD');
        });
    });

    describe('QC_CHECK_TYPES', () => {
        it('should have all check types', async () => {
            const { QC_CHECK_TYPES } = await import('./qualityService');
            const values = QC_CHECK_TYPES.map((t) => t.value);
            expect(values).toContain('VISUAL');
            expect(values).toContain('MEASUREMENT');
            expect(values).toContain('CHEMICAL');
            expect(values).toContain('PHYSICAL');
        });
    });

    describe('DEFAULT_PARAMETERS', () => {
        it('should have OIL, CARBON, STEEL parameters', async () => {
            const { DEFAULT_PARAMETERS } = await import('./qualityService');
            expect(DEFAULT_PARAMETERS).toHaveProperty('OIL');
            expect(DEFAULT_PARAMETERS).toHaveProperty('CARBON');
            expect(DEFAULT_PARAMETERS).toHaveProperty('STEEL');
            expect(DEFAULT_PARAMETERS.OIL.length).toBeGreaterThan(0);
            expect(DEFAULT_PARAMETERS.CARBON.length).toBeGreaterThan(0);
            expect(DEFAULT_PARAMETERS.STEEL.length).toBeGreaterThan(0);
        });
    });

    describe('createQualityCheck', () => {
        it('should create check with PASSED status when all params pass', async () => {
            mockAddDoc.mockResolvedValue({ id: 'new-check-id' });
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createQualityCheck } = await import('./qualityService');

            const result = await createQualityCheck(
                {
                    batchId: 'batch-1',
                    batchNumber: 'B-001',
                    checkType: 'VISUAL',
                    parameters: [
                        { name: 'Color', expected: 'Dark Brown', actual: 'Dark Brown', passed: true },
                        { name: 'Viscosity', expected: '< 5 cSt', actual: '4 cSt', passed: true },
                    ],
                },
                'inspector-1',
            );

            expect(result).toBe('new-check-id');
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            const checkData = mockAddDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(checkData.status).toBe('PASSED');
            expect(checkData.batchId).toBe('batch-1');
            expect(checkData.inspector).toBe('inspector-1');
        });

        it('should create check with FAILED status when any param fails', async () => {
            mockAddDoc.mockResolvedValue({ id: 'new-check-id' });
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createQualityCheck } = await import('./qualityService');

            await createQualityCheck(
                {
                    batchId: 'batch-1',
                    batchNumber: 'B-001',
                    checkType: 'CHEMICAL',
                    parameters: [
                        { name: 'Color', expected: 'Dark Brown', actual: 'Light Yellow', passed: false },
                        { name: 'Viscosity', expected: '< 5 cSt', actual: '4 cSt', passed: true },
                    ],
                },
                'inspector-1',
            );

            const checkData = mockAddDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(checkData.status).toBe('FAILED');
        });

        it('should create check with PENDING status when no actuals', async () => {
            mockAddDoc.mockResolvedValue({ id: 'new-check-id' });
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createQualityCheck } = await import('./qualityService');

            await createQualityCheck(
                {
                    batchId: 'batch-1',
                    batchNumber: 'B-001',
                    checkType: 'MEASUREMENT',
                    parameters: [
                        { name: 'Color', expected: 'Dark Brown', actual: '', passed: false },
                        { name: 'Viscosity', expected: '< 5 cSt', actual: '', passed: false },
                    ],
                },
                'inspector-1',
            );

            const checkData = mockAddDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(checkData.status).toBe('PENDING');
        });
    });

    describe('updateQualityCheck', () => {
        it('should update only provided fields', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { updateQualityCheck } = await import('./qualityService');

            await updateQualityCheck('check-1', { status: 'ON_HOLD' }, 'user-1');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateData = mockUpdateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(updateData.status).toBe('ON_HOLD');
            expect(updateData.updatedBy).toBe('user-1');
            expect(updateData).not.toHaveProperty('parameters');
        });
    });

    describe('getQualityChecks', () => {
        it('should return checks', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'check-1',
                        data: () => ({
                            checkNumber: 'QC-2026-0001',
                            batchId: 'batch-1',
                            status: 'PASSED',
                        }),
                    },
                    {
                        id: 'check-2',
                        data: () => ({
                            checkNumber: 'QC-2026-0002',
                            batchId: 'batch-2',
                            status: 'FAILED',
                        }),
                    },
                ],
            });

            const { getQualityChecks } = await import('./qualityService');

            const checks = await getQualityChecks();

            expect(checks).toHaveLength(2);
            expect(checks[0].id).toBe('check-1');
            expect(checks[1].id).toBe('check-2');
        });
    });

    describe('getQualityCheckById', () => {
        it('should return null when not found', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => false,
            });

            const { getQualityCheckById } = await import('./qualityService');

            const result = await getQualityCheckById('nonexistent');

            expect(result).toBeNull();
        });
    });
});
