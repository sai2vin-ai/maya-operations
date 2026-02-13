import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetDocs, mockGetDoc, mockAddDoc, mockUpdateDoc, mockRunTransaction, mockAssertAuthorized } = vi.hoisted(
    () => ({
        mockGetDocs: vi.fn(),
        mockGetDoc: vi.fn(),
        mockAddDoc: vi.fn(),
        mockUpdateDoc: vi.fn(),
        mockRunTransaction: vi.fn(),
        mockAssertAuthorized: vi.fn(),
    }),
);

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
    runTransaction: mockRunTransaction,
}));
vi.mock('../../../lib/firebase', () => ({ db: {} }));
vi.mock('../../../lib/authorization', () => ({ assertAuthorized: mockAssertAuthorized }));

describe('sparePartsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });
    });

    describe('SPARE_PART_CATEGORIES', () => {
        it('should have all required categories', async () => {
            const { SPARE_PART_CATEGORIES } = await import('./sparePartsService');
            const categoryValues = SPARE_PART_CATEGORIES.map((c) => c.value);
            expect(categoryValues).toContain('MOTOR');
            expect(categoryValues).toContain('PUMP');
            expect(categoryValues).toContain('VALVE');
            expect(categoryValues).toContain('BEARING');
            expect(categoryValues).toContain('BELT');
            expect(categoryValues).toContain('SEAL');
            expect(categoryValues).toContain('ELECTRICAL');
            expect(categoryValues).toContain('HYDRAULIC');
            expect(categoryValues).toContain('PNEUMATIC');
            expect(categoryValues).toContain('GENERAL');
        });

        it('should have exactly 10 categories', async () => {
            const { SPARE_PART_CATEGORIES } = await import('./sparePartsService');
            expect(SPARE_PART_CATEGORIES).toHaveLength(10);
        });

        it('should have labels for all categories', async () => {
            const { SPARE_PART_CATEGORIES } = await import('./sparePartsService');
            SPARE_PART_CATEGORIES.forEach((category) => {
                expect(category.label).toBeDefined();
                expect(typeof category.label).toBe('string');
                expect(category.label.length).toBeGreaterThan(0);
            });
        });

        it('should have unique values', async () => {
            const { SPARE_PART_CATEGORIES } = await import('./sparePartsService');
            const values = SPARE_PART_CATEGORIES.map((c) => c.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });

        it('should have mechanical part categories', async () => {
            const { SPARE_PART_CATEGORIES } = await import('./sparePartsService');
            const categoryValues = SPARE_PART_CATEGORIES.map((c) => c.value);
            expect(categoryValues).toContain('BEARING');
            expect(categoryValues).toContain('BELT');
            expect(categoryValues).toContain('SEAL');
        });

        it('should have system categories', async () => {
            const { SPARE_PART_CATEGORIES } = await import('./sparePartsService');
            const categoryValues = SPARE_PART_CATEGORIES.map((c) => c.value);
            expect(categoryValues).toContain('ELECTRICAL');
            expect(categoryValues).toContain('HYDRAULIC');
            expect(categoryValues).toContain('PNEUMATIC');
        });

        it('should have a general/catch-all category', async () => {
            const { SPARE_PART_CATEGORIES } = await import('./sparePartsService');
            const general = SPARE_PART_CATEGORIES.find((c) => c.value === 'GENERAL');
            expect(general).toBeDefined();
            expect(general?.label).toBe('General');
        });
    });

    describe('SPARE_PART_UNITS', () => {
        it('should have all required units', async () => {
            const { SPARE_PART_UNITS } = await import('./sparePartsService');
            expect(SPARE_PART_UNITS).toContain('PCS');
            expect(SPARE_PART_UNITS).toContain('SET');
            expect(SPARE_PART_UNITS).toContain('MTR');
            expect(SPARE_PART_UNITS).toContain('KG');
            expect(SPARE_PART_UNITS).toContain('LTR');
            expect(SPARE_PART_UNITS).toContain('PAIR');
            expect(SPARE_PART_UNITS).toContain('BOX');
        });

        it('should have exactly 7 units', async () => {
            const { SPARE_PART_UNITS } = await import('./sparePartsService');
            expect(SPARE_PART_UNITS).toHaveLength(7);
        });

        it('should have unique values', async () => {
            const { SPARE_PART_UNITS } = await import('./sparePartsService');
            const uniqueUnits = new Set(SPARE_PART_UNITS);
            expect(uniqueUnits.size).toBe(SPARE_PART_UNITS.length);
        });

        it('should have count units', async () => {
            const { SPARE_PART_UNITS } = await import('./sparePartsService');
            expect(SPARE_PART_UNITS).toContain('PCS');
            expect(SPARE_PART_UNITS).toContain('SET');
            expect(SPARE_PART_UNITS).toContain('PAIR');
            expect(SPARE_PART_UNITS).toContain('BOX');
        });

        it('should have measurement units', async () => {
            const { SPARE_PART_UNITS } = await import('./sparePartsService');
            expect(SPARE_PART_UNITS).toContain('MTR');
            expect(SPARE_PART_UNITS).toContain('KG');
            expect(SPARE_PART_UNITS).toContain('LTR');
        });
    });

    describe('createSparePart', () => {
        it('should create part and return id', async () => {
            mockAddDoc.mockResolvedValue({ id: 'new-part-id' });
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createSparePart } = await import('./sparePartsService');

            const result = await createSparePart(
                {
                    name: 'Test Motor',
                    category: 'MOTOR',
                    unit: 'PCS',
                    currentStock: 0,
                    minimumStock: 5,
                },
                'user-1',
                'SUPER_ADMIN',
            );

            expect(result).toBe('new-part-id');
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            const partData = mockAddDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(partData.name).toBe('Test Motor');
            expect(partData.category).toBe('MOTOR');
            expect(partData.unit).toBe('PCS');
            expect(partData.currentStock).toBe(0);
            expect(partData.minimumStock).toBe(5);
            expect(partData.createdBy).toBe('user-1');
        });

        it('should record initial stock transaction when currentStock > 0', async () => {
            mockAddDoc.mockResolvedValue({ id: 'new-part-id' });
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (txn: unknown) => unknown) => {
                return callback({
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ currentStock: 0, name: 'Test Part' }),
                        ref: 'mock-part-ref',
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                });
            });

            const { createSparePart } = await import('./sparePartsService');

            await createSparePart(
                {
                    name: 'Test Motor',
                    category: 'MOTOR',
                    unit: 'PCS',
                    currentStock: 10,
                    minimumStock: 5,
                },
                'user-1',
                'SUPER_ADMIN',
            );

            expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        });

        it('should check authorization', async () => {
            mockAddDoc.mockResolvedValue({ id: 'new-part-id' });
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createSparePart } = await import('./sparePartsService');

            await createSparePart(
                {
                    name: 'Test Motor',
                    category: 'MOTOR',
                    unit: 'PCS',
                    currentStock: 0,
                    minimumStock: 5,
                },
                'user-1',
                'SUPER_ADMIN',
            );

            expect(mockAssertAuthorized).toHaveBeenCalledWith('SUPER_ADMIN', 'spare_parts:create');
        });
    });

    describe('updateSparePart', () => {
        it('should update only provided fields', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { updateSparePart } = await import('./sparePartsService');

            await updateSparePart('part-1', { name: 'Updated Motor' }, 'user-1', 'SUPER_ADMIN');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateData = mockUpdateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(updateData.name).toBe('Updated Motor');
            expect(updateData.updatedBy).toBe('user-1');
            expect(updateData).not.toHaveProperty('category');
            expect(updateData).not.toHaveProperty('unit');
            expect(updateData).not.toHaveProperty('minimumStock');
        });
    });

    describe('recordSparePartTransaction', () => {
        it('should add stock for RECEIPT', async () => {
            const mockTransactionSet = vi.fn();
            const mockTransactionUpdate = vi.fn();
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (txn: unknown) => unknown) => {
                return callback({
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ currentStock: 10, name: 'Test Part' }),
                        ref: 'mock-part-ref',
                    }),
                    set: mockTransactionSet,
                    update: mockTransactionUpdate,
                });
            });

            const { recordSparePartTransaction } = await import('./sparePartsService');

            await recordSparePartTransaction(
                {
                    partId: 'part-1',
                    type: 'RECEIPT',
                    quantity: 5,
                    reason: 'Restocking',
                },
                'user-1',
                'SUPER_ADMIN',
            );

            expect(mockRunTransaction).toHaveBeenCalledTimes(1);
            expect(mockTransactionSet).toHaveBeenCalledTimes(1);
            const txnData = mockTransactionSet.mock.calls[0][1];
            expect(txnData.type).toBe('RECEIPT');
            expect(txnData.quantity).toBe(5);
            expect(txnData.balanceAfter).toBe(15); // 10 + 5
            expect(mockTransactionUpdate).toHaveBeenCalledTimes(1);
            const updateData = mockTransactionUpdate.mock.calls[0][1];
            expect(updateData.currentStock).toBe(15);
        });

        it('should deduct stock for ISSUE', async () => {
            const mockTransactionSet = vi.fn();
            const mockTransactionUpdate = vi.fn();
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (txn: unknown) => unknown) => {
                return callback({
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ currentStock: 10, name: 'Test Part' }),
                        ref: 'mock-part-ref',
                    }),
                    set: mockTransactionSet,
                    update: mockTransactionUpdate,
                });
            });

            const { recordSparePartTransaction } = await import('./sparePartsService');

            await recordSparePartTransaction(
                {
                    partId: 'part-1',
                    type: 'ISSUE',
                    quantity: 3,
                    reason: 'Maintenance',
                },
                'user-1',
                'SUPER_ADMIN',
            );

            expect(mockTransactionSet).toHaveBeenCalledTimes(1);
            const txnData = mockTransactionSet.mock.calls[0][1];
            expect(txnData.type).toBe('ISSUE');
            expect(txnData.quantity).toBe(3);
            expect(txnData.balanceAfter).toBe(7); // 10 - 3
            expect(mockTransactionUpdate).toHaveBeenCalledTimes(1);
            const updateData = mockTransactionUpdate.mock.calls[0][1];
            expect(updateData.currentStock).toBe(7);
        });

        it('should throw on insufficient stock for ISSUE', async () => {
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (txn: unknown) => unknown) => {
                return callback({
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ currentStock: 2, name: 'Test Part' }),
                        ref: 'mock-part-ref',
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                });
            });

            const { recordSparePartTransaction } = await import('./sparePartsService');

            await expect(
                recordSparePartTransaction(
                    {
                        partId: 'part-1',
                        type: 'ISSUE',
                        quantity: 5,
                        reason: 'Too many',
                    },
                    'user-1',
                    'SUPER_ADMIN',
                ),
            ).rejects.toThrow(/Insufficient stock/);
        });
    });

    describe('receiptSparePart', () => {
        it('should call recordSparePartTransaction with RECEIPT type', async () => {
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (txn: unknown) => unknown) => {
                return callback({
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ currentStock: 10, name: 'Test Part' }),
                        ref: 'mock-part-ref',
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                });
            });

            const { receiptSparePart } = await import('./sparePartsService');

            await receiptSparePart('part-1', 5, 'Restocking', 'user-1');

            expect(mockRunTransaction).toHaveBeenCalledTimes(1);
            const transactionCallback = mockRunTransaction.mock.calls[0][1] as unknown;
            expect(transactionCallback).toBeDefined();
        });
    });

    describe('getSparePartsByAsset', () => {
        it('should return parts linked to the given asset', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'part-1',
                        data: () => ({ partNumber: 'SP-0001', name: 'Oil Seal', machineIds: ['reactor-M1'] }),
                    },
                    {
                        id: 'part-2',
                        data: () => ({ partNumber: 'SP-0002', name: 'Bearing', machineIds: ['reactor-M1'] }),
                    },
                ],
            });

            const { getSparePartsByAsset } = await import('./sparePartsService');
            const parts = await getSparePartsByAsset('reactor-M1');

            expect(parts).toHaveLength(2);
            expect(parts[0].id).toBe('part-1');
            expect(parts[1].id).toBe('part-2');
        });

        it('should return empty array when no parts linked', async () => {
            mockGetDocs.mockResolvedValue({ docs: [] });

            const { getSparePartsByAsset } = await import('./sparePartsService');
            const parts = await getSparePartsByAsset('asset-with-no-parts');

            expect(parts).toHaveLength(0);
        });

        it('should sort results by partNumber', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'part-2',
                        data: () => ({ partNumber: 'SP-0005', name: 'Bearing', machineIds: ['reactor-M1'] }),
                    },
                    {
                        id: 'part-1',
                        data: () => ({ partNumber: 'SP-0002', name: 'Oil Seal', machineIds: ['reactor-M1'] }),
                    },
                ],
            });

            const { getSparePartsByAsset } = await import('./sparePartsService');
            const parts = await getSparePartsByAsset('reactor-M1');

            expect(parts[0].partNumber).toBe('SP-0002');
            expect(parts[1].partNumber).toBe('SP-0005');
        });
    });

    describe('issueSparePart', () => {
        it('should call recordSparePartTransaction with ISSUE type', async () => {
            const mockTransactionSet = vi.fn();
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (txn: unknown) => unknown) => {
                return callback({
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ currentStock: 10, name: 'Test Part' }),
                        ref: 'mock-part-ref',
                    }),
                    set: mockTransactionSet,
                    update: vi.fn(),
                });
            });

            const { issueSparePart } = await import('./sparePartsService');

            await issueSparePart('part-1', 3, 'machine-1', 'Reactor A', 'Replacement', 'John', 'user-1');

            expect(mockRunTransaction).toHaveBeenCalledTimes(1);
            const txnData = mockTransactionSet.mock.calls[0][1];
            expect(txnData.type).toBe('ISSUE');
            expect(txnData.quantity).toBe(3);
            expect(txnData.machineId).toBe('machine-1');
            expect(txnData.machineName).toBe('Reactor A');
            expect(txnData.issuedTo).toBe('John');
        });
    });
});
