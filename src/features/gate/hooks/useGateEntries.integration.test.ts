import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useGateEntries,
    useGateEntry,
    useCreateGateEntry,
    useCompleteGateEntry,
    useCancelGateEntry,
    gateEntryKeys,
} from './useGateEntries';
import { createWrapper, mockGateEntry } from '../../../test/test-utils';
import * as gateEntryService from '../services/gateEntryService';

// Mock the gate entry service
vi.mock('../services/gateEntryService', () => ({
    getGateEntries: vi.fn(),
    getGateEntryById: vi.fn(),
    createGateEntry: vi.fn(),
    updateGateEntry: vi.fn(),
    completeGateEntry: vi.fn(),
    cancelGateEntry: vi.fn(),
    MATERIAL_CATEGORIES: [
        { value: 'TW-WHOLE', label: 'Whole Waste Tyres', unit: 'TONS' },
        { value: 'CB-STD', label: 'Carbon Black (Standard)', unit: 'KG' },
    ],
    ENTRY_STATUSES: [
        { value: 'PENDING', label: 'Pending', color: 'yellow' },
        { value: 'COMPLETED', label: 'Completed', color: 'green' },
        { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
    ],
}));

describe('useGateEntries hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useGateEntries', () => {
        it('should fetch and return gate entries', async () => {
            const mockEntries = [
                mockGateEntry({ id: '1', entryNumber: 'GE-2026-0001' }),
                mockGateEntry({ id: '2', entryNumber: 'GE-2026-0002' }),
            ];

            vi.mocked(gateEntryService.getGateEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useGateEntries(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(gateEntryService.getGateEntries).toHaveBeenCalledTimes(1);
        });

        it('should filter by PENDING status', async () => {
            const mockEntries = [
                mockGateEntry({ id: '1', status: 'PENDING' }),
                mockGateEntry({ id: '2', status: 'COMPLETED' }),
            ];

            vi.mocked(gateEntryService.getGateEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useGateEntries({ status: 'PENDING' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].status).toBe('PENDING');
        });

        it('should filter by COMPLETED status', async () => {
            const mockEntries = [
                mockGateEntry({ id: '1', status: 'PENDING' }),
                mockGateEntry({ id: '2', status: 'COMPLETED' }),
                mockGateEntry({ id: '3', status: 'COMPLETED' }),
            ];

            vi.mocked(gateEntryService.getGateEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useGateEntries({ status: 'COMPLETED' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
        });

        it('should filter by search query on entry number', async () => {
            const mockEntries = [
                mockGateEntry({ id: '1', entryNumber: 'GE-2026-0001', vehicleNumber: 'KA01AB1234' }),
                mockGateEntry({ id: '2', entryNumber: 'GE-2026-0002', vehicleNumber: 'MH12CD5678' }),
            ];

            vi.mocked(gateEntryService.getGateEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useGateEntries({ searchQuery: '0001' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].entryNumber).toBe('GE-2026-0001');
        });

        it('should filter by search query on vehicle number', async () => {
            const mockEntries = [
                mockGateEntry({ id: '1', vehicleNumber: 'KA01AB1234' }),
                mockGateEntry({ id: '2', vehicleNumber: 'MH12CD5678' }),
            ];

            vi.mocked(gateEntryService.getGateEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useGateEntries({ searchQuery: 'MH12' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].vehicleNumber).toBe('MH12CD5678');
        });

        it('should filter by search query on supplier name', async () => {
            const mockEntries = [
                mockGateEntry({ id: '1', supplierName: 'ABC Tyres' }),
                mockGateEntry({ id: '2', supplierName: 'XYZ Rubber' }),
            ];

            vi.mocked(gateEntryService.getGateEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useGateEntries({ searchQuery: 'rubber' }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].supplierName).toBe('XYZ Rubber');
        });

        it('should filter by search query on driver name', async () => {
            const mockEntries = [
                mockGateEntry({ id: '1', driverName: 'John Driver' }),
                mockGateEntry({ id: '2', driverName: 'Jane Operator' }),
            ];

            vi.mocked(gateEntryService.getGateEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useGateEntries({ searchQuery: 'jane' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].driverName).toBe('Jane Operator');
        });

        it('should return all entries when status filter is "all"', async () => {
            const mockEntries = [
                mockGateEntry({ id: '1', status: 'PENDING' }),
                mockGateEntry({ id: '2', status: 'COMPLETED' }),
                mockGateEntry({ id: '3', status: 'CANCELLED' }),
            ];

            vi.mocked(gateEntryService.getGateEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useGateEntries({ status: 'all' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(3);
        });
    });

    describe('useGateEntry', () => {
        it('should fetch a single gate entry by ID', async () => {
            const entry = mockGateEntry({ id: 'entry-123', entryNumber: 'GE-2026-0001' });
            vi.mocked(gateEntryService.getGateEntryById).mockResolvedValue(entry);

            const { result } = renderHook(() => useGateEntry('entry-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.entryNumber).toBe('GE-2026-0001');
            expect(gateEntryService.getGateEntryById).toHaveBeenCalledWith('entry-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useGateEntry(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(gateEntryService.getGateEntryById).not.toHaveBeenCalled();
        });
    });

    describe('useCreateGateEntry', () => {
        it('should create a gate entry', async () => {
            vi.mocked(gateEntryService.createGateEntry).mockResolvedValue('new-entry-id');

            const { result } = renderHook(() => useCreateGateEntry(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    entryType: 'IN' as const,
                    vehicleNumber: 'KA01AB1234',
                    materialCategory: 'TW-WHOLE' as const,
                    quantity: 5000,
                    unit: 'KG' as const,
                    supplierName: 'Test Supplier',
                },
                createdBy: 'admin',
            };

            await result.current.mutateAsync(createData);

            expect(gateEntryService.createGateEntry).toHaveBeenCalledWith(createData.data, createData.createdBy);
        });
    });

    describe('useCompleteGateEntry', () => {
        it('should complete a gate entry', async () => {
            vi.mocked(gateEntryService.completeGateEntry).mockResolvedValue(undefined);

            const { result } = renderHook(() => useCompleteGateEntry(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                entryId: 'entry-123',
                updatedBy: 'admin',
            });

            expect(gateEntryService.completeGateEntry).toHaveBeenCalledWith('entry-123', 'admin', undefined);
        });
    });

    describe('useCancelGateEntry', () => {
        it('should cancel a gate entry with reason', async () => {
            vi.mocked(gateEntryService.cancelGateEntry).mockResolvedValue(undefined);

            const { result } = renderHook(() => useCancelGateEntry(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                entryId: 'entry-123',
                reason: 'Vehicle left without unloading',
                updatedBy: 'admin',
            });

            expect(gateEntryService.cancelGateEntry).toHaveBeenCalledWith(
                'entry-123',
                'Vehicle left without unloading',
                'admin',
                undefined,
            );
        });
    });

    describe('gateEntryKeys', () => {
        it('should generate correct query keys', () => {
            expect(gateEntryKeys.all).toEqual(['gateEntries']);
            expect(gateEntryKeys.lists()).toEqual(['gateEntries', 'list']);
            expect(gateEntryKeys.list({ status: 'PENDING' })).toEqual(['gateEntries', 'list', { status: 'PENDING' }]);
            expect(gateEntryKeys.details()).toEqual(['gateEntries', 'detail']);
            expect(gateEntryKeys.detail('123')).toEqual(['gateEntries', 'detail', '123']);
        });
    });
});
