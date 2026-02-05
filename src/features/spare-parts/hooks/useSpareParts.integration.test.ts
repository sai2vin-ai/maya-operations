import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useSpareParts,
    useSparePart,
    useCreateSparePart,
    useReceiptSparePart,
    useIssueSparePart,
    sparePartKeys,
} from './useSpareParts';
import { createWrapper, mockSparePart } from '../../../test/test-utils';
import * as sparePartsService from '../services/sparePartsService';

// Mock the spare parts service
vi.mock('../services/sparePartsService', () => ({
    getSpareParts: vi.fn(),
    getSparePartById: vi.fn(),
    createSparePart: vi.fn(),
    updateSparePart: vi.fn(),
    receiptSparePart: vi.fn(),
    issueSparePart: vi.fn(),
    SPARE_PART_CATEGORIES: [
        { value: 'MOTOR', label: 'Motor' },
        { value: 'PUMP', label: 'Pump' },
        { value: 'BEARING', label: 'Bearing' },
    ],
    SPARE_PART_UNITS: ['PCS', 'SET', 'MTR'],
}));

describe('useSpareParts hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useSpareParts', () => {
        it('should fetch and return spare parts', async () => {
            const mockParts = [
                mockSparePart({ id: '1', name: 'Motor 5HP' }),
                mockSparePart({ id: '2', name: 'Pump Seal' }),
            ];

            vi.mocked(sparePartsService.getSpareParts).mockResolvedValue(mockParts);

            const { result } = renderHook(() => useSpareParts({}), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(sparePartsService.getSpareParts).toHaveBeenCalledTimes(1);
        });

        it('should filter by category', async () => {
            const mockParts = [
                mockSparePart({ id: '1', name: 'Motor 5HP', category: 'MOTOR' }),
                mockSparePart({ id: '2', name: 'Pump Seal', category: 'SEAL' }),
            ];

            vi.mocked(sparePartsService.getSpareParts).mockResolvedValue(mockParts);

            const { result } = renderHook(
                () => useSpareParts({ category: 'MOTOR' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].category).toBe('MOTOR');
        });

        it('should filter by search query on name', async () => {
            const mockParts = [
                mockSparePart({ id: '1', name: 'Motor 5HP', partNumber: 'MOT-001' }),
                mockSparePart({ id: '2', name: 'Pump Seal', partNumber: 'PMP-001' }),
            ];

            vi.mocked(sparePartsService.getSpareParts).mockResolvedValue(mockParts);

            const { result } = renderHook(
                () => useSpareParts({ searchQuery: 'motor' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Motor 5HP');
        });

        it('should filter by search query on part number', async () => {
            const mockParts = [
                mockSparePart({ id: '1', name: 'Motor 5HP', partNumber: 'MOT-001' }),
                mockSparePart({ id: '2', name: 'Pump Seal', partNumber: 'PMP-001' }),
            ];

            vi.mocked(sparePartsService.getSpareParts).mockResolvedValue(mockParts);

            const { result } = renderHook(
                () => useSpareParts({ searchQuery: 'pmp' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].partNumber).toBe('PMP-001');
        });

        it('should filter by search query on location', async () => {
            const mockParts = [
                mockSparePart({ id: '1', name: 'Motor 5HP', location: 'Rack A-1' }),
                mockSparePart({ id: '2', name: 'Pump Seal', location: 'Rack B-2' }),
            ];

            vi.mocked(sparePartsService.getSpareParts).mockResolvedValue(mockParts);

            const { result } = renderHook(
                () => useSpareParts({ searchQuery: 'B-2' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].location).toBe('Rack B-2');
        });
    });

    describe('useSparePart', () => {
        it('should fetch a single spare part by ID', async () => {
            const part = mockSparePart({ id: 'part-123', name: 'Test Part' });
            vi.mocked(sparePartsService.getSparePartById).mockResolvedValue(part);

            const { result } = renderHook(() => useSparePart('part-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.name).toBe('Test Part');
            expect(sparePartsService.getSparePartById).toHaveBeenCalledWith('part-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useSparePart(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(sparePartsService.getSparePartById).not.toHaveBeenCalled();
        });
    });

    describe('useCreateSparePart', () => {
        it('should create a spare part', async () => {
            vi.mocked(sparePartsService.createSparePart).mockResolvedValue('new-part-id');

            const { result } = renderHook(() => useCreateSparePart(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    name: 'New Motor',
                    category: 'MOTOR' as const,
                    unit: 'PCS',
                    currentStock: 5,
                    minimumStock: 2,
                },
                createdBy: 'admin',
            };

            await result.current.mutateAsync(createData);

            expect(sparePartsService.createSparePart).toHaveBeenCalledWith(
                createData.data,
                createData.createdBy
            );
        });
    });

    describe('useReceiptSparePart', () => {
        it('should record a receipt', async () => {
            vi.mocked(sparePartsService.receiptSparePart).mockResolvedValue('txn-123');

            const { result } = renderHook(() => useReceiptSparePart(), {
                wrapper: createWrapper(),
            });

            const receiptData = {
                partId: 'part-123',
                quantity: 10,
                reason: 'Purchase order received',
                recordedBy: 'admin',
            };

            await result.current.mutateAsync(receiptData);

            expect(sparePartsService.receiptSparePart).toHaveBeenCalledWith(
                'part-123',
                10,
                'Purchase order received',
                'admin'
            );
        });
    });

    describe('useIssueSparePart', () => {
        it('should record an issue', async () => {
            vi.mocked(sparePartsService.issueSparePart).mockResolvedValue('txn-124');

            const { result } = renderHook(() => useIssueSparePart(), {
                wrapper: createWrapper(),
            });

            const issueData = {
                partId: 'part-123',
                quantity: 2,
                machineId: 'reactor-1',
                machineName: 'Main Reactor 1',
                reason: 'Replacement',
                issuedTo: 'John Doe',
                recordedBy: 'admin',
            };

            await result.current.mutateAsync(issueData);

            expect(sparePartsService.issueSparePart).toHaveBeenCalledWith(
                'part-123',
                2,
                'reactor-1',
                'Main Reactor 1',
                'Replacement',
                'John Doe',
                'admin'
            );
        });
    });

    describe('sparePartKeys', () => {
        it('should generate correct query keys', () => {
            expect(sparePartKeys.all).toEqual(['spareParts']);
            expect(sparePartKeys.lists()).toEqual(['spareParts', 'list']);
            expect(sparePartKeys.list({ category: 'MOTOR' })).toEqual([
                'spareParts',
                'list',
                { category: 'MOTOR' },
            ]);
            expect(sparePartKeys.details()).toEqual(['spareParts', 'detail']);
            expect(sparePartKeys.detail('123')).toEqual(['spareParts', 'detail', '123']);
        });
    });
});
