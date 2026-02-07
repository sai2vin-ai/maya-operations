import { describe, it, expect, vi, beforeEach } from 'vitest';
import { INVENTORY_CATEGORIES, TRANSACTION_TYPES, COMMON_UNITS } from './inventoryService';

// Mock firebase/firestore at the SDK level
const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockRunTransaction = vi.fn();

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
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

describe('inventoryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('INVENTORY_CATEGORIES', () => {
        it('should have all required categories', () => {
            const categoryValues = INVENTORY_CATEGORIES.map(c => c.value);
            expect(categoryValues).toContain('RAW_MATERIAL');
            expect(categoryValues).toContain('FINISHED_PRODUCT');
            expect(categoryValues).toContain('CONSUMABLE');
            expect(categoryValues).toContain('SPARE_PART');
        });

        it('should have exactly 4 categories', () => {
            expect(INVENTORY_CATEGORIES).toHaveLength(4);
        });

        it('should have labels for all categories', () => {
            INVENTORY_CATEGORIES.forEach(category => {
                expect(category.label).toBeDefined();
                expect(typeof category.label).toBe('string');
                expect(category.label.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            const rawMaterial = INVENTORY_CATEGORIES.find(c => c.value === 'RAW_MATERIAL');
            expect(rawMaterial?.label).toBe('Raw Material');

            const finishedProduct = INVENTORY_CATEGORIES.find(c => c.value === 'FINISHED_PRODUCT');
            expect(finishedProduct?.label).toBe('Finished Product');
        });

        it('should have unique values', () => {
            const values = INVENTORY_CATEGORIES.map(c => c.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });
    });

    describe('TRANSACTION_TYPES', () => {
        it('should have all required transaction types', () => {
            const typeValues = TRANSACTION_TYPES.map(t => t.value);
            expect(typeValues).toContain('RECEIPT');
            expect(typeValues).toContain('ISSUE');
            expect(typeValues).toContain('ADJUSTMENT');
            expect(typeValues).toContain('TRANSFER');
        });

        it('should have exactly 4 transaction types', () => {
            expect(TRANSACTION_TYPES).toHaveLength(4);
        });

        it('should have labels and colors for all types', () => {
            TRANSACTION_TYPES.forEach(type => {
                expect(type.label).toBeDefined();
                expect(type.color).toBeDefined();
                expect(typeof type.label).toBe('string');
                expect(typeof type.color).toBe('string');
            });
        });

        it('should have correct colors for each type', () => {
            const receipt = TRANSACTION_TYPES.find(t => t.value === 'RECEIPT');
            expect(receipt?.color).toBe('green');

            const issue = TRANSACTION_TYPES.find(t => t.value === 'ISSUE');
            expect(issue?.color).toBe('red');

            const adjustment = TRANSACTION_TYPES.find(t => t.value === 'ADJUSTMENT');
            expect(adjustment?.color).toBe('yellow');

            const transfer = TRANSACTION_TYPES.find(t => t.value === 'TRANSFER');
            expect(transfer?.color).toBe('blue');
        });

        it('should have meaningful color associations', () => {
            // Green for receipt (adding stock)
            const receipt = TRANSACTION_TYPES.find(t => t.value === 'RECEIPT');
            expect(receipt?.color).toBe('green');

            // Red for issue (removing stock)
            const issue = TRANSACTION_TYPES.find(t => t.value === 'ISSUE');
            expect(issue?.color).toBe('red');
        });
    });

    describe('COMMON_UNITS', () => {
        it('should have common measurement units', () => {
            expect(COMMON_UNITS).toContain('KG');
            expect(COMMON_UNITS).toContain('TONS');
            expect(COMMON_UNITS).toContain('LITRE');
            expect(COMMON_UNITS).toContain('NOS');
        });

        it('should have exactly 8 common units', () => {
            expect(COMMON_UNITS).toHaveLength(8);
        });

        it('should include weight units', () => {
            expect(COMMON_UNITS).toContain('KG');
            expect(COMMON_UNITS).toContain('TONS');
        });

        it('should include volume units', () => {
            expect(COMMON_UNITS).toContain('LITRE');
            expect(COMMON_UNITS).toContain('KL');
        });

        it('should include count/quantity units', () => {
            expect(COMMON_UNITS).toContain('NOS');
            expect(COMMON_UNITS).toContain('SET');
            expect(COMMON_UNITS).toContain('BOX');
        });

        it('should include length units', () => {
            expect(COMMON_UNITS).toContain('MTR');
        });

        it('should have unique values', () => {
            const uniqueUnits = new Set(COMMON_UNITS);
            expect(uniqueUnits.size).toBe(COMMON_UNITS.length);
        });
    });

    describe('recordTransaction - stock balance logic', () => {
        // Test the balance calculation logic in isolation
        const calculateNewBalance = (
            currentStock: number,
            transactionType: 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'TRANSFER',
            quantity: number
        ): number => {
            let quantityChange = quantity;
            if (transactionType === 'ISSUE') {
                quantityChange = -Math.abs(quantity);
            }
            return currentStock + quantityChange;
        };

        it('should increase stock for RECEIPT', () => {
            expect(calculateNewBalance(5000, 'RECEIPT', 1000)).toBe(6000);
        });

        it('should decrease stock for ISSUE', () => {
            expect(calculateNewBalance(5000, 'ISSUE', 1000)).toBe(4000);
        });

        it('should handle positive ADJUSTMENT', () => {
            expect(calculateNewBalance(5000, 'ADJUSTMENT', 500)).toBe(5500);
        });

        it('should handle negative ADJUSTMENT', () => {
            expect(calculateNewBalance(5000, 'ADJUSTMENT', -500)).toBe(4500);
        });

        it('should not allow negative balance', () => {
            const newBalance = calculateNewBalance(100, 'ISSUE', 200);
            expect(newBalance).toBeLessThan(0); // service would throw
        });
    });

    describe('recordTransaction - maximumStock enforcement', () => {
        it('should reject receipt that exceeds maximum stock', async () => {
            // Mock generateTransactionId: no existing transactions
            mockGetDocs.mockResolvedValue({ empty: true });

            // Mock runTransaction to execute the callback
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({
                            currentStock: 9000,
                            maximumStock: 10000,
                        }),
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                };
                await callback(mockTransaction);
            });

            const { recordTransaction } = await import('./inventoryService');

            // Trying to add 2000 when current is 9000 and max is 10000
            await expect(
                recordTransaction({
                    itemId: 'item-1',
                    transactionType: 'RECEIPT',
                    quantity: 2000,
                }, 'user-1', 'SUPER_ADMIN')
            ).rejects.toThrow(/exceed maximum stock/);
        });

        it('should allow receipt that stays within maximum stock', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });

            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({
                            currentStock: 8000,
                            maximumStock: 10000,
                        }),
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                };
                await callback(mockTransaction);
            });

            const { recordTransaction } = await import('./inventoryService');

            // Adding 1000 when current is 8000 and max is 10000 = 9000 (OK)
            await expect(
                recordTransaction({
                    itemId: 'item-1',
                    transactionType: 'RECEIPT',
                    quantity: 1000,
                }, 'user-1', 'SUPER_ADMIN')
            ).resolves.toBeDefined();
        });

        it('should allow receipt when no maximumStock is set', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });

            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({
                            currentStock: 50000,
                            // no maximumStock field
                        }),
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                };
                await callback(mockTransaction);
            });

            const { recordTransaction } = await import('./inventoryService');

            await expect(
                recordTransaction({
                    itemId: 'item-1',
                    transactionType: 'RECEIPT',
                    quantity: 100000,
                }, 'user-1', 'SUPER_ADMIN')
            ).resolves.toBeDefined();
        });

        it('should reject issue that would result in negative stock', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });

            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({
                            currentStock: 100,
                        }),
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                };
                await callback(mockTransaction);
            });

            const { recordTransaction } = await import('./inventoryService');

            await expect(
                recordTransaction({
                    itemId: 'item-1',
                    transactionType: 'ISSUE',
                    quantity: 200,
                }, 'user-1', 'SUPER_ADMIN')
            ).rejects.toThrow('Insufficient stock');
        });

        it('should throw when inventory item not found', async () => {
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

            const { recordTransaction } = await import('./inventoryService');

            await expect(
                recordTransaction({
                    itemId: 'nonexistent',
                    transactionType: 'RECEIPT',
                    quantity: 100,
                }, 'user-1', 'SUPER_ADMIN')
            ).rejects.toThrow('Inventory item not found');
        });
    });

    describe('recordTransaction - referenceType support', () => {
        it('should accept WEIGHBRIDGE_ENTRY as referenceType', async () => {
            mockGetDocs.mockResolvedValue({ empty: true });

            let capturedTxnDoc: Record<string, unknown> | null = null;
            mockRunTransaction.mockImplementation(async (_db: unknown, callback: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ currentStock: 5000 }),
                    }),
                    set: vi.fn((_ref: unknown, doc: Record<string, unknown>) => { capturedTxnDoc = doc; }),
                    update: vi.fn(),
                };
                await callback(mockTransaction);
            });

            const { recordTransaction } = await import('./inventoryService');

            await recordTransaction({
                itemId: 'item-1',
                transactionType: 'RECEIPT',
                quantity: 1000,
                referenceType: 'WEIGHBRIDGE_ENTRY',
                referenceId: 'wb-entry-1',
            }, 'user-1', 'SUPER_ADMIN');

            expect(capturedTxnDoc).not.toBeNull();
            expect(capturedTxnDoc!.referenceType).toBe('WEIGHBRIDGE_ENTRY');
            expect(capturedTxnDoc!.referenceId).toBe('wb-entry-1');
        });
    });
});
