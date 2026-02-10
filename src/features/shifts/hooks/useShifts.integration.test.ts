import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useShifts,
    useShift,
    useActiveShift,
    useStartShift,
    useEndShift,
    useAcknowledgeHandover,
    shiftKeys,
} from './useShifts';
import { createWrapper, mockTimestamp } from '../../../test/test-utils';
import * as shiftService from '../services/shiftService';
import type { Shift } from '../../../types';

// Mock the shift service
vi.mock('../services/shiftService', () => ({
    getShifts: vi.fn(),
    getShiftById: vi.fn(),
    getActiveShift: vi.fn(),
    startShift: vi.fn(),
    endShift: vi.fn(),
    acknowledgeHandover: vi.fn(),
    SHIFT_TYPES: [
        { value: 'A', label: 'Shift A (Morning)', time: '06:00 - 14:00' },
        { value: 'B', label: 'Shift B (Afternoon)', time: '14:00 - 22:00' },
        { value: 'C', label: 'Shift C (Night)', time: '22:00 - 06:00' },
    ],
}));

// Helper to create mock shift data
function mockShift(overrides: Partial<Shift> = {}): Shift {
    return {
        id: 'shift-1',
        shiftType: 'A',
        date: mockTimestamp(),
        supervisorId: 'supervisor-1',
        startTime: mockTimestamp(),
        endTime: undefined,
        handoverNotes: undefined,
        incomingSupervisorId: undefined,
        handoverAcknowledged: false,
        createdAt: mockTimestamp(),
        createdBy: 'admin',
        updatedAt: mockTimestamp(),
        updatedBy: 'admin',
        ...overrides,
    } as Shift;
}

describe('useShifts hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useShifts', () => {
        it('should fetch and return shifts', async () => {
            const mockShifts = [
                mockShift({ id: 'shift-1', shiftType: 'A' }),
                mockShift({ id: 'shift-2', shiftType: 'B' }),
            ];

            vi.mocked(shiftService.getShifts).mockResolvedValue(mockShifts);

            const { result } = renderHook(() => useShifts(), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(shiftService.getShifts).toHaveBeenCalledTimes(1);
        });

        it('should handle error state', async () => {
            vi.mocked(shiftService.getShifts).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useShifts(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Network error');
        });

        it('should return empty array when no shifts exist', async () => {
            vi.mocked(shiftService.getShifts).mockResolvedValue([]);

            const { result } = renderHook(() => useShifts(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(0);
        });
    });

    describe('useShift', () => {
        it('should fetch a single shift by ID', async () => {
            const shift = mockShift({ id: 'shift-123', shiftType: 'B' });
            vi.mocked(shiftService.getShiftById).mockResolvedValue(shift);

            const { result } = renderHook(() => useShift('shift-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.shiftType).toBe('B');
            expect(shiftService.getShiftById).toHaveBeenCalledWith('shift-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useShift(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(shiftService.getShiftById).not.toHaveBeenCalled();
        });

        it('should return null when shift does not exist', async () => {
            vi.mocked(shiftService.getShiftById).mockResolvedValue(null);

            const { result } = renderHook(() => useShift('nonexistent'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBeNull();
        });
    });

    describe('useActiveShift', () => {
        it('should fetch the currently active shift', async () => {
            const activeShift = mockShift({ id: 'shift-active', shiftType: 'A', endTime: undefined });
            vi.mocked(shiftService.getActiveShift).mockResolvedValue(activeShift);

            const { result } = renderHook(() => useActiveShift(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.id).toBe('shift-active');
            expect(shiftService.getActiveShift).toHaveBeenCalledTimes(1);
        });

        it('should return null when no active shift exists', async () => {
            vi.mocked(shiftService.getActiveShift).mockResolvedValue(null);

            const { result } = renderHook(() => useActiveShift(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBeNull();
        });
    });

    describe('useStartShift', () => {
        it('should start a new shift and return the ID', async () => {
            vi.mocked(shiftService.startShift).mockResolvedValue('new-shift-id');

            const { result } = renderHook(() => useStartShift(), {
                wrapper: createWrapper(),
            });

            const startData = {
                data: {
                    shiftType: 'A' as const,
                    supervisorId: 'supervisor-1',
                },
                createdBy: 'admin',
            };

            const resultId = await result.current.mutateAsync(startData);

            expect(resultId).toBe('new-shift-id');
            expect(shiftService.startShift).toHaveBeenCalledWith(startData.data, startData.createdBy);
        });

        it('should handle start shift failure', async () => {
            vi.mocked(shiftService.startShift).mockRejectedValue(new Error('Failed to start shift'));

            const { result } = renderHook(() => useStartShift(), {
                wrapper: createWrapper(),
            });

            await expect(
                result.current.mutateAsync({
                    data: {
                        shiftType: 'B' as const,
                        supervisorId: 'supervisor-2',
                    },
                    createdBy: 'admin',
                }),
            ).rejects.toThrow('Failed to start shift');
        });

        it('should start shifts of different types', async () => {
            vi.mocked(shiftService.startShift).mockResolvedValue('night-shift-id');

            const { result } = renderHook(() => useStartShift(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                data: {
                    shiftType: 'C' as const,
                    supervisorId: 'supervisor-3',
                },
                createdBy: 'admin',
            });

            expect(shiftService.startShift).toHaveBeenCalledWith(
                { shiftType: 'C', supervisorId: 'supervisor-3' },
                'admin',
            );
        });
    });

    describe('useEndShift', () => {
        it('should end a shift with handover notes', async () => {
            vi.mocked(shiftService.endShift).mockResolvedValue(undefined);

            const { result } = renderHook(() => useEndShift(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                shiftId: 'shift-123',
                data: {
                    handoverNotes: 'All reactors running smoothly. Batch M1-001 at step 8.',
                },
                updatedBy: 'supervisor-1',
            });

            expect(shiftService.endShift).toHaveBeenCalledWith(
                'shift-123',
                { handoverNotes: 'All reactors running smoothly. Batch M1-001 at step 8.' },
                'supervisor-1',
            );
        });

        it('should end a shift with incoming supervisor', async () => {
            vi.mocked(shiftService.endShift).mockResolvedValue(undefined);

            const { result } = renderHook(() => useEndShift(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                shiftId: 'shift-123',
                data: {
                    handoverNotes: 'Handover notes here',
                    incomingSupervisorId: 'supervisor-2',
                },
                updatedBy: 'supervisor-1',
            });

            expect(shiftService.endShift).toHaveBeenCalledWith(
                'shift-123',
                {
                    handoverNotes: 'Handover notes here',
                    incomingSupervisorId: 'supervisor-2',
                },
                'supervisor-1',
            );
        });

        it('should handle end shift failure', async () => {
            vi.mocked(shiftService.endShift).mockRejectedValue(new Error('Failed to end shift'));

            const { result } = renderHook(() => useEndShift(), {
                wrapper: createWrapper(),
            });

            await expect(
                result.current.mutateAsync({
                    shiftId: 'shift-123',
                    data: { handoverNotes: 'Notes' },
                    updatedBy: 'supervisor-1',
                }),
            ).rejects.toThrow('Failed to end shift');
        });
    });

    describe('useAcknowledgeHandover', () => {
        it('should acknowledge a shift handover', async () => {
            vi.mocked(shiftService.acknowledgeHandover).mockResolvedValue(undefined);

            const { result } = renderHook(() => useAcknowledgeHandover(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                shiftId: 'shift-123',
                userId: 'supervisor-2',
            });

            expect(shiftService.acknowledgeHandover).toHaveBeenCalledWith('shift-123', 'supervisor-2');
        });

        it('should handle acknowledge failure', async () => {
            vi.mocked(shiftService.acknowledgeHandover).mockRejectedValue(new Error('Acknowledgement failed'));

            const { result } = renderHook(() => useAcknowledgeHandover(), {
                wrapper: createWrapper(),
            });

            await expect(
                result.current.mutateAsync({
                    shiftId: 'shift-123',
                    userId: 'supervisor-2',
                }),
            ).rejects.toThrow('Acknowledgement failed');
        });
    });

    describe('shiftKeys', () => {
        it('should generate correct query keys', () => {
            expect(shiftKeys.all).toEqual(['shifts']);
            expect(shiftKeys.lists()).toEqual(['shifts', 'list']);
            expect(shiftKeys.detail('shift-456')).toEqual(['shifts', 'detail', 'shift-456']);
            expect(shiftKeys.active()).toEqual(['shifts', 'active']);
        });
    });
});
