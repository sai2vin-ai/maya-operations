import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useWeighbridgeEntries,
    usePendingEntries,
    useTodayEntries,
    useWeighbridgeEntry,
    useCreateWeighbridgeEntry,
    useRecordFirstWeight,
    useRecordSecondWeight,
    useCancelWeighbridgeEntry,
    weighbridgeKeys,
} from './useWeighbridge';
import { createWrapper, mockWeighbridgeEntry } from '../../../test/test-utils';
import * as weighbridgeService from '../services/weighbridgeService';

// Mock the weighbridge service
vi.mock('../services/weighbridgeService', () => ({
    getWeighbridgeEntries: vi.fn(),
    getPendingEntries: vi.fn(),
    getTodayEntries: vi.fn(),
    getWeighbridgeEntryById: vi.fn(),
    createWeighbridgeEntry: vi.fn(),
    recordFirstWeight: vi.fn(),
    recordSecondWeightAndComplete: vi.fn(),
    cancelWeighbridgeEntry: vi.fn(),
}));

describe('useWeighbridge hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useWeighbridgeEntries', () => {
        it('should fetch and return weighbridge entries', async () => {
            const mockEntries = [
                mockWeighbridgeEntry({ id: '1', entryNumber: 'WB-2026-00001' }),
                mockWeighbridgeEntry({ id: '2', entryNumber: 'WB-2026-00002' }),
            ];

            vi.mocked(weighbridgeService.getWeighbridgeEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useWeighbridgeEntries(), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(weighbridgeService.getWeighbridgeEntries).toHaveBeenCalledTimes(1);
        });

        it('should filter entries by entry type', async () => {
            const mockEntries = [
                mockWeighbridgeEntry({ id: '1', entryType: 'RM_IN' }),
                mockWeighbridgeEntry({ id: '2', entryType: 'FG_OUT' }),
            ];

            vi.mocked(weighbridgeService.getWeighbridgeEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(
                () => useWeighbridgeEntries({ entryType: 'RM_IN' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].entryType).toBe('RM_IN');
        });

        it('should filter entries by search query on entry number', async () => {
            const mockEntries = [
                mockWeighbridgeEntry({ id: '1', entryNumber: 'WB-2026-00001', vehicleNumber: 'KA01AB1234' }),
                mockWeighbridgeEntry({ id: '2', entryNumber: 'WB-2026-00002', vehicleNumber: 'MH12CD5678' }),
            ];

            vi.mocked(weighbridgeService.getWeighbridgeEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(
                () => useWeighbridgeEntries({ searchQuery: '00001' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].entryNumber).toBe('WB-2026-00001');
        });

        it('should filter entries by search query on vehicle number', async () => {
            const mockEntries = [
                mockWeighbridgeEntry({ id: '1', vehicleNumber: 'KA01AB1234' }),
                mockWeighbridgeEntry({ id: '2', vehicleNumber: 'MH12CD5678' }),
            ];

            vi.mocked(weighbridgeService.getWeighbridgeEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(
                () => useWeighbridgeEntries({ searchQuery: 'KA01' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].vehicleNumber).toBe('KA01AB1234');
        });

        it('should handle error state', async () => {
            vi.mocked(weighbridgeService.getWeighbridgeEntries).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useWeighbridgeEntries(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Network error');
        });
    });

    describe('usePendingEntries', () => {
        it('should fetch pending entries', async () => {
            const mockEntries = [
                mockWeighbridgeEntry({ id: '1', status: 'PENDING' }),
            ];

            vi.mocked(weighbridgeService.getPendingEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => usePendingEntries(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(weighbridgeService.getPendingEntries).toHaveBeenCalledTimes(1);
        });
    });

    describe('useTodayEntries', () => {
        it('should fetch today entries', async () => {
            const mockEntries = [
                mockWeighbridgeEntry({ id: '1' }),
                mockWeighbridgeEntry({ id: '2' }),
            ];

            vi.mocked(weighbridgeService.getTodayEntries).mockResolvedValue(mockEntries);

            const { result } = renderHook(() => useTodayEntries(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(weighbridgeService.getTodayEntries).toHaveBeenCalledTimes(1);
        });
    });

    describe('useWeighbridgeEntry', () => {
        it('should fetch a single entry by ID', async () => {
            const entry = mockWeighbridgeEntry({ id: 'entry-123', entryNumber: 'WB-2026-00001' });
            vi.mocked(weighbridgeService.getWeighbridgeEntryById).mockResolvedValue(entry);

            const { result } = renderHook(() => useWeighbridgeEntry('entry-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.entryNumber).toBe('WB-2026-00001');
            expect(weighbridgeService.getWeighbridgeEntryById).toHaveBeenCalledWith('entry-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useWeighbridgeEntry(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(weighbridgeService.getWeighbridgeEntryById).not.toHaveBeenCalled();
        });
    });

    describe('useCreateWeighbridgeEntry', () => {
        it('should create an entry and return the ID', async () => {
            vi.mocked(weighbridgeService.createWeighbridgeEntry).mockResolvedValue('new-entry-id');

            const { result } = renderHook(() => useCreateWeighbridgeEntry(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    entryType: 'RM_IN' as const,
                    vehicleNumber: 'KA01AB1234',
                    unit: 'KG' as const,
                },
                createdBy: 'admin',
            };

            await result.current.mutateAsync(createData);

            expect(weighbridgeService.createWeighbridgeEntry).toHaveBeenCalledWith(
                createData.data,
                createData.createdBy
            );
        });
    });

    describe('useRecordFirstWeight', () => {
        it('should record first weight', async () => {
            vi.mocked(weighbridgeService.recordFirstWeight).mockResolvedValue(undefined);

            const { result } = renderHook(() => useRecordFirstWeight(), {
                wrapper: createWrapper(),
            });

            const weightData = {
                entryId: 'entry-123',
                data: {
                    weight: 15000,
                    isGross: true,
                },
                updatedBy: 'admin',
            };

            await result.current.mutateAsync(weightData);

            expect(weighbridgeService.recordFirstWeight).toHaveBeenCalledWith(
                weightData.entryId,
                weightData.data,
                weightData.updatedBy
            );
        });
    });

    describe('useRecordSecondWeight', () => {
        it('should record second weight and complete', async () => {
            vi.mocked(weighbridgeService.recordSecondWeightAndComplete).mockResolvedValue(undefined);

            const { result } = renderHook(() => useRecordSecondWeight(), {
                wrapper: createWrapper(),
            });

            const weightData = {
                entryId: 'entry-123',
                data: {
                    weight: 5000,
                    isGross: false,
                },
                updatedBy: 'admin',
            };

            await result.current.mutateAsync(weightData);

            expect(weighbridgeService.recordSecondWeightAndComplete).toHaveBeenCalledWith(
                weightData.entryId,
                weightData.data,
                weightData.updatedBy
            );
        });
    });

    describe('useCancelWeighbridgeEntry', () => {
        it('should cancel an entry', async () => {
            vi.mocked(weighbridgeService.cancelWeighbridgeEntry).mockResolvedValue(undefined);

            const { result } = renderHook(() => useCancelWeighbridgeEntry(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                entryId: 'entry-123',
                updatedBy: 'admin',
            });

            expect(weighbridgeService.cancelWeighbridgeEntry).toHaveBeenCalledWith(
                'entry-123',
                'admin'
            );
        });
    });

    describe('weighbridgeKeys', () => {
        it('should generate correct query keys', () => {
            expect(weighbridgeKeys.all).toEqual(['weighbridge']);
            expect(weighbridgeKeys.lists()).toEqual(['weighbridge', 'list']);
            expect(weighbridgeKeys.list({ entryType: 'RM_IN' })).toEqual(['weighbridge', 'list', { entryType: 'RM_IN' }]);
            expect(weighbridgeKeys.pending()).toEqual(['weighbridge', 'pending']);
            expect(weighbridgeKeys.today()).toEqual(['weighbridge', 'today']);
            expect(weighbridgeKeys.details()).toEqual(['weighbridge', 'detail']);
            expect(weighbridgeKeys.detail('123')).toEqual(['weighbridge', 'detail', '123']);
        });
    });
});
