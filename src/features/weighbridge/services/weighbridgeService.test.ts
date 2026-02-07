import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WeighbridgeEntryType, WeighbridgeEntryStatus } from '../types';

// Mock firebase/firestore at the SDK level
const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    addDoc: (...args: unknown[]) => mockAddDoc(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: () => ({ seconds: 1700000000, nanoseconds: 0 }),
        fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    },
}));

// Mock inventory service for recordSecondWeightAndComplete
vi.mock('../../inventory/services/inventoryService', () => ({
    recordTransaction: vi.fn().mockResolvedValue('txn-1'),
}));

describe('weighbridgeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('WeighbridgeEntryType', () => {
        it('should support RM_IN type for raw materials', () => {
            const rmIn: WeighbridgeEntryType = 'RM_IN';
            expect(rmIn).toBe('RM_IN');
        });

        it('should support FG_OUT type for finished goods', () => {
            const fgOut: WeighbridgeEntryType = 'FG_OUT';
            expect(fgOut).toBe('FG_OUT');
        });
    });

    describe('WeighbridgeEntryStatus', () => {
        it('should support PENDING status', () => {
            const status: WeighbridgeEntryStatus = 'PENDING';
            expect(status).toBe('PENDING');
        });

        it('should support FIRST_WEIGHT status', () => {
            const status: WeighbridgeEntryStatus = 'FIRST_WEIGHT';
            expect(status).toBe('FIRST_WEIGHT');
        });

        it('should support COMPLETED status', () => {
            const status: WeighbridgeEntryStatus = 'COMPLETED';
            expect(status).toBe('COMPLETED');
        });

        it('should support CANCELLED status', () => {
            const status: WeighbridgeEntryStatus = 'CANCELLED';
            expect(status).toBe('CANCELLED');
        });
    });

    describe('Net Weight Calculation Logic', () => {
        const calculateNetWeight = (gross: number, tare: number) => Math.abs(gross - tare);

        it('should calculate net weight correctly', () => {
            expect(calculateNetWeight(5000, 2000)).toBe(3000);
            expect(calculateNetWeight(10000, 3500)).toBe(6500);
        });

        it('should handle zero tare weight', () => {
            expect(calculateNetWeight(5000, 0)).toBe(5000);
        });

        it('should handle equal gross and tare weights', () => {
            expect(calculateNetWeight(2000, 2000)).toBe(0);
        });

        it('should return absolute value regardless of order', () => {
            expect(calculateNetWeight(2000, 5000)).toBe(3000);
        });
    });

    describe('Unit Conversion Logic', () => {
        const convertToKg = (weight: number, unit: 'KG' | 'TONS' | 'KL') => {
            if (unit === 'TONS') return weight * 1000;
            if (unit === 'KL') return weight * 1000;
            return weight;
        };

        it('should convert TONS to KG correctly', () => {
            expect(convertToKg(1, 'TONS')).toBe(1000);
            expect(convertToKg(5.5, 'TONS')).toBe(5500);
            expect(convertToKg(0.5, 'TONS')).toBe(500);
        });

        it('should convert KL to KG correctly', () => {
            expect(convertToKg(1, 'KL')).toBe(1000);
            expect(convertToKg(2.5, 'KL')).toBe(2500);
        });

        it('should keep KG as is', () => {
            expect(convertToKg(500, 'KG')).toBe(500);
            expect(convertToKg(1000, 'KG')).toBe(1000);
        });
    });

    describe('Vehicle Number Normalization', () => {
        const normalizeVehicleNumber = (vehicleNumber: string) => vehicleNumber.toUpperCase();

        it('should convert to uppercase', () => {
            expect(normalizeVehicleNumber('ka01ab1234')).toBe('KA01AB1234');
            expect(normalizeVehicleNumber('MH12CD5678')).toBe('MH12CD5678');
        });

        it('should handle mixed case', () => {
            expect(normalizeVehicleNumber('Ka01Ab1234')).toBe('KA01AB1234');
        });
    });

    describe('createWeighbridgeEntry - traceability links', () => {
        it('should persist gateEntryId when provided', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });
            mockAddDoc.mockResolvedValue({ id: 'new-wb-entry-id' });

            const { createWeighbridgeEntry } = await import('./weighbridgeService');

            await createWeighbridgeEntry({
                entryType: 'RM_IN',
                vehicleNumber: 'KA01AB1234',
                unit: 'KG',
                gateEntryId: 'gate-entry-123',
            }, 'user-1', 'SUPER_ADMIN');

            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            const entryData = mockAddDoc.mock.calls[0][1];
            expect(entryData.gateEntryId).toBe('gate-entry-123');
        });

        it('should persist batchId when provided', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });
            mockAddDoc.mockResolvedValue({ id: 'new-wb-entry-id' });

            const { createWeighbridgeEntry } = await import('./weighbridgeService');

            await createWeighbridgeEntry({
                entryType: 'FG_OUT',
                vehicleNumber: 'MH12CD5678',
                unit: 'TONS',
                batchId: 'batch-456',
            }, 'user-1', 'SUPER_ADMIN');

            const entryData = mockAddDoc.mock.calls[0][1];
            expect(entryData.batchId).toBe('batch-456');
        });

        it('should set gateEntryId and batchId to null when not provided', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });
            mockAddDoc.mockResolvedValue({ id: 'new-wb-entry-id' });

            const { createWeighbridgeEntry } = await import('./weighbridgeService');

            await createWeighbridgeEntry({
                entryType: 'RM_IN',
                vehicleNumber: 'KA01AB1234',
                unit: 'KG',
            }, 'user-1', 'SUPER_ADMIN');

            const entryData = mockAddDoc.mock.calls[0][1];
            expect(entryData.gateEntryId).toBeNull();
            expect(entryData.batchId).toBeNull();
        });

        it('should normalize vehicle number to uppercase', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });
            mockAddDoc.mockResolvedValue({ id: 'new-wb-entry-id' });

            const { createWeighbridgeEntry } = await import('./weighbridgeService');

            await createWeighbridgeEntry({
                entryType: 'RM_IN',
                vehicleNumber: 'ka01ab1234',
                unit: 'KG',
            }, 'user-1', 'SUPER_ADMIN');

            const entryData = mockAddDoc.mock.calls[0][1];
            expect(entryData.vehicleNumber).toBe('KA01AB1234');
        });
    });

    describe('getWeighbridgeEntriesByGateEntryId - reverse lookup', () => {
        it('should return entries linked to a gate entry', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'wb-1',
                        data: () => ({
                            entryNumber: 'WB-2026-00001',
                            vehicleNumber: 'KA01AB1234',
                            gateEntryId: 'gate-1',
                            status: 'COMPLETED',
                        }),
                    },
                    {
                        id: 'wb-2',
                        data: () => ({
                            entryNumber: 'WB-2026-00002',
                            vehicleNumber: 'KA01AB1234',
                            gateEntryId: 'gate-1',
                            status: 'PENDING',
                        }),
                    },
                ],
            });

            const { getWeighbridgeEntriesByGateEntryId } = await import('./weighbridgeService');

            const entries = await getWeighbridgeEntriesByGateEntryId('gate-1');

            expect(entries).toHaveLength(2);
            expect(entries[0].id).toBe('wb-1');
            expect(entries[1].id).toBe('wb-2');
        });

        it('should return empty array when no linked entries exist', async () => {
            mockGetDocs.mockResolvedValue({ docs: [] });

            const { getWeighbridgeEntriesByGateEntryId } = await import('./weighbridgeService');

            const entries = await getWeighbridgeEntriesByGateEntryId('gate-no-links');

            expect(entries).toHaveLength(0);
        });
    });

    describe('recordSecondWeightAndComplete - weight validation', () => {
        it('should reject when gross weight is less than tare weight', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'wb-1',
                data: () => ({
                    entryNumber: 'WB-2026-00001',
                    entryType: 'RM_IN',
                    vehicleNumber: 'KA01AB1234',
                    grossWeight: null,
                    tareWeight: 5000,
                    unit: 'KG',
                    status: 'FIRST_WEIGHT',
                }),
            });

            const { recordSecondWeightAndComplete } = await import('./weighbridgeService');

            await expect(
                recordSecondWeightAndComplete(
                    'wb-1',
                    { weight: 3000, isGross: true },
                    'user-1',
                    'SUPER_ADMIN'
                )
            ).rejects.toThrow(/Gross weight cannot be less than tare weight/);
        });

        it('should complete entry when weights are valid', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'wb-1',
                data: () => ({
                    entryNumber: 'WB-2026-00001',
                    entryType: 'RM_IN',
                    vehicleNumber: 'KA01AB1234',
                    grossWeight: 5000,
                    tareWeight: null,
                    unit: 'KG',
                    status: 'FIRST_WEIGHT',
                }),
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            const { recordSecondWeightAndComplete } = await import('./weighbridgeService');

            await recordSecondWeightAndComplete(
                'wb-1',
                { weight: 2000, isGross: false },
                'user-1',
                'SUPER_ADMIN'
            );

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.netWeight).toBe(3000);
            expect(updateArgs.status).toBe('COMPLETED');
        });

        it('should throw when entry not found', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => false,
            });

            const { recordSecondWeightAndComplete } = await import('./weighbridgeService');

            await expect(
                recordSecondWeightAndComplete(
                    'nonexistent',
                    { weight: 5000, isGross: true },
                    'user-1',
                    'SUPER_ADMIN'
                )
            ).rejects.toThrow('Weighbridge entry not found');
        });
    });

    describe('recordSecondWeightAndComplete - inventory integration', () => {
        it('should record RECEIPT for RM_IN with WEIGHBRIDGE_ENTRY referenceType', async () => {
            const { recordTransaction } = await import('../../inventory/services/inventoryService');

            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'wb-1',
                data: () => ({
                    entryNumber: 'WB-2026-00001',
                    entryType: 'RM_IN',
                    vehicleNumber: 'KA01AB1234',
                    grossWeight: 5000,
                    tareWeight: null,
                    inventoryItemId: 'item-1',
                    unit: 'KG',
                    status: 'FIRST_WEIGHT',
                }),
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            const { recordSecondWeightAndComplete } = await import('./weighbridgeService');

            await recordSecondWeightAndComplete(
                'wb-1',
                { weight: 2000, isGross: false },
                'user-1',
                'SUPER_ADMIN'
            );

            expect(recordTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    itemId: 'item-1',
                    transactionType: 'RECEIPT',
                    referenceType: 'WEIGHBRIDGE_ENTRY',
                    referenceId: 'wb-1',
                }),
                'user-1'
            );
        });

        it('should record ISSUE for FG_OUT with WEIGHBRIDGE_ENTRY referenceType', async () => {
            const { recordTransaction } = await import('../../inventory/services/inventoryService');

            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'wb-1',
                data: () => ({
                    entryNumber: 'WB-2026-00001',
                    entryType: 'FG_OUT',
                    vehicleNumber: 'KA01AB1234',
                    grossWeight: 5000,
                    tareWeight: null,
                    inventoryItemId: 'item-2',
                    unit: 'KG',
                    status: 'FIRST_WEIGHT',
                }),
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            const { recordSecondWeightAndComplete } = await import('./weighbridgeService');

            await recordSecondWeightAndComplete(
                'wb-1',
                { weight: 2000, isGross: false },
                'user-1',
                'SUPER_ADMIN'
            );

            expect(recordTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    itemId: 'item-2',
                    transactionType: 'ISSUE',
                    referenceType: 'WEIGHBRIDGE_ENTRY',
                }),
                'user-1'
            );
        });

        it('should convert TONS to KG for inventory transaction', async () => {
            const { recordTransaction } = await import('../../inventory/services/inventoryService');

            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'wb-1',
                data: () => ({
                    entryNumber: 'WB-2026-00001',
                    entryType: 'RM_IN',
                    vehicleNumber: 'KA01AB1234',
                    grossWeight: 5,
                    tareWeight: null,
                    inventoryItemId: 'item-1',
                    unit: 'TONS',
                    status: 'FIRST_WEIGHT',
                }),
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            const { recordSecondWeightAndComplete } = await import('./weighbridgeService');

            await recordSecondWeightAndComplete(
                'wb-1',
                { weight: 2, isGross: false },
                'user-1',
                'SUPER_ADMIN'
            );

            expect(recordTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    quantity: 3000,
                }),
                'user-1'
            );
        });

        it('should not record inventory transaction when no inventoryItemId', async () => {
            const { recordTransaction } = await import('../../inventory/services/inventoryService');
            vi.mocked(recordTransaction).mockClear();

            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'wb-1',
                data: () => ({
                    entryNumber: 'WB-2026-00001',
                    entryType: 'RM_IN',
                    vehicleNumber: 'KA01AB1234',
                    grossWeight: 5000,
                    tareWeight: null,
                    inventoryItemId: undefined,
                    unit: 'KG',
                    status: 'FIRST_WEIGHT',
                }),
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            const { recordSecondWeightAndComplete } = await import('./weighbridgeService');

            await recordSecondWeightAndComplete(
                'wb-1',
                { weight: 2000, isGross: false },
                'user-1',
                'SUPER_ADMIN'
            );

            expect(recordTransaction).not.toHaveBeenCalled();
        });
    });
});
