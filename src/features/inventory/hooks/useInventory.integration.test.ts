import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useInventory,
    useInventoryItem,
    useCreateInventoryItem,
    useRecordTransaction,
    inventoryKeys,
} from './useInventory';
import { createWrapper, mockInventoryItem } from '../../../test/test-utils';
import * as inventoryService from '../services/inventoryService';

// Mock the inventory service
vi.mock('../services/inventoryService', () => ({
    getInventoryItems: vi.fn(),
    getInventoryItemById: vi.fn(),
    createInventoryItem: vi.fn(),
    updateInventoryItem: vi.fn(),
    recordTransaction: vi.fn(),
    INVENTORY_CATEGORIES: [
        { value: 'RAW_MATERIAL', label: 'Raw Material' },
        { value: 'FINISHED_PRODUCT', label: 'Finished Product' },
    ],
    TRANSACTION_TYPES: [
        { value: 'RECEIPT', label: 'Receipt', color: 'green' },
        { value: 'ISSUE', label: 'Issue', color: 'red' },
    ],
    COMMON_UNITS: ['KG', 'TONS', 'LITRE'],
}));

describe('useInventory hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useInventory', () => {
        it('should fetch and return inventory items', async () => {
            const mockItems = [
                mockInventoryItem({ id: '1', name: 'Item 1', currentStock: 100 }),
                mockInventoryItem({ id: '2', name: 'Item 2', currentStock: 50 }),
            ];

            vi.mocked(inventoryService.getInventoryItems).mockResolvedValue(mockItems);

            const { result } = renderHook(() => useInventory(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(inventoryService.getInventoryItems).toHaveBeenCalledTimes(1);
        });

        it('should filter by category', async () => {
            const mockItems = [
                mockInventoryItem({ id: '1', name: 'Raw Item', category: 'RAW_MATERIAL' }),
                mockInventoryItem({ id: '2', name: 'Finished Item', category: 'FINISHED_PRODUCT' }),
            ];

            vi.mocked(inventoryService.getInventoryItems).mockResolvedValue(mockItems);

            const { result } = renderHook(
                () => useInventory({ category: 'RAW_MATERIAL' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].category).toBe('RAW_MATERIAL');
        });

        it('should filter by low-stock', async () => {
            const mockItems = [
                mockInventoryItem({ id: '1', name: 'Normal Stock', currentStock: 100, minimumStock: 50 }),
                mockInventoryItem({ id: '2', name: 'Low Stock', currentStock: 30, minimumStock: 50 }),
            ];

            vi.mocked(inventoryService.getInventoryItems).mockResolvedValue(mockItems);

            const { result } = renderHook(
                () => useInventory({ category: 'low-stock' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Low Stock');
        });

        it('should filter by search query on name', async () => {
            const mockItems = [
                mockInventoryItem({ id: '1', name: 'Waste Tyres', code: 'INV-RM-0001' }),
                mockInventoryItem({ id: '2', name: 'Carbon Black', code: 'INV-FP-0001' }),
            ];

            vi.mocked(inventoryService.getInventoryItems).mockResolvedValue(mockItems);

            const { result } = renderHook(
                () => useInventory({ searchQuery: 'tyre' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Waste Tyres');
        });

        it('should filter by search query on code', async () => {
            const mockItems = [
                mockInventoryItem({ id: '1', name: 'Item A', code: 'INV-RM-0001' }),
                mockInventoryItem({ id: '2', name: 'Item B', code: 'INV-FP-0001' }),
            ];

            vi.mocked(inventoryService.getInventoryItems).mockResolvedValue(mockItems);

            const { result } = renderHook(
                () => useInventory({ searchQuery: 'FP' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].code).toBe('INV-FP-0001');
        });

        it('should filter by search query on location', async () => {
            const mockItems = [
                mockInventoryItem({ id: '1', name: 'Item A', location: 'Storage A' }),
                mockInventoryItem({ id: '2', name: 'Item B', location: 'Warehouse B' }),
            ];

            vi.mocked(inventoryService.getInventoryItems).mockResolvedValue(mockItems);

            const { result } = renderHook(
                () => useInventory({ searchQuery: 'warehouse' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].location).toBe('Warehouse B');
        });
    });

    describe('useInventoryItem', () => {
        it('should fetch a single inventory item by ID', async () => {
            const item = mockInventoryItem({ id: 'item-123', name: 'Test Item' });
            vi.mocked(inventoryService.getInventoryItemById).mockResolvedValue(item);

            const { result } = renderHook(() => useInventoryItem('item-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.name).toBe('Test Item');
            expect(inventoryService.getInventoryItemById).toHaveBeenCalledWith('item-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useInventoryItem(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(inventoryService.getInventoryItemById).not.toHaveBeenCalled();
        });
    });

    describe('useCreateInventoryItem', () => {
        it('should create an inventory item', async () => {
            vi.mocked(inventoryService.createInventoryItem).mockResolvedValue('new-item-id');

            const { result } = renderHook(() => useCreateInventoryItem(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    name: 'New Item',
                    category: 'RAW_MATERIAL' as const,
                    unit: 'KG',
                    minimumStock: 100,
                    initialStock: 500,
                },
                createdBy: 'admin',
            };

            await result.current.mutateAsync(createData);

            expect(inventoryService.createInventoryItem).toHaveBeenCalledWith(
                createData.data,
                createData.createdBy
            );
        });
    });

    describe('useRecordTransaction', () => {
        it('should record a receipt transaction', async () => {
            vi.mocked(inventoryService.recordTransaction).mockResolvedValue('txn-123');

            const { result } = renderHook(() => useRecordTransaction(), {
                wrapper: createWrapper(),
            });

            const transactionData = {
                data: {
                    itemId: 'item-123',
                    transactionType: 'RECEIPT' as const,
                    quantity: 100,
                    reason: 'Incoming shipment',
                },
                recordedBy: 'admin',
            };

            await result.current.mutateAsync(transactionData);

            expect(inventoryService.recordTransaction).toHaveBeenCalledWith(
                transactionData.data,
                transactionData.recordedBy
            );
        });

        it('should record an issue transaction', async () => {
            vi.mocked(inventoryService.recordTransaction).mockResolvedValue('txn-124');

            const { result } = renderHook(() => useRecordTransaction(), {
                wrapper: createWrapper(),
            });

            const transactionData = {
                data: {
                    itemId: 'item-123',
                    transactionType: 'ISSUE' as const,
                    quantity: 50,
                    referenceType: 'BATCH' as const,
                    referenceId: 'batch-456',
                },
                recordedBy: 'admin',
            };

            await result.current.mutateAsync(transactionData);

            expect(inventoryService.recordTransaction).toHaveBeenCalledWith(
                transactionData.data,
                transactionData.recordedBy
            );
        });
    });

    describe('inventoryKeys', () => {
        it('should generate correct query keys', () => {
            expect(inventoryKeys.all).toEqual(['inventory']);
            expect(inventoryKeys.lists()).toEqual(['inventory', 'list']);
            expect(inventoryKeys.list({ category: 'RAW_MATERIAL' })).toEqual([
                'inventory',
                'list',
                { category: 'RAW_MATERIAL' },
            ]);
            expect(inventoryKeys.details()).toEqual(['inventory', 'detail']);
            expect(inventoryKeys.detail('123')).toEqual(['inventory', 'detail', '123']);
        });
    });
});
