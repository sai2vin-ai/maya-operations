import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getShifts,
    getShiftById,
    getActiveShift,
    startShift,
    endShift,
    acknowledgeHandover,
    type StartShiftData,
    type EndShiftData,
} from '../services/shiftService';

export const shiftKeys = {
    all: ['shifts'] as const,
    lists: () => [...shiftKeys.all, 'list'] as const,
    detail: (id: string) => [...shiftKeys.all, 'detail', id] as const,
    active: () => [...shiftKeys.all, 'active'] as const,
};

export function useShifts() {
    return useQuery({
        queryKey: shiftKeys.lists(),
        queryFn: () => getShifts(),
    });
}

export function useShift(id: string | undefined) {
    return useQuery({
        queryKey: shiftKeys.detail(id || ''),
        queryFn: () => getShiftById(id!),
        enabled: !!id,
    });
}

export function useActiveShift() {
    return useQuery({
        queryKey: shiftKeys.active(),
        queryFn: getActiveShift,
        refetchInterval: 60_000,
    });
}

export function useStartShift() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, createdBy }: { data: StartShiftData; createdBy: string }) =>
            startShift(data, createdBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.all });
        },
    });
}

export function useEndShift() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, data, updatedBy }: { shiftId: string; data: EndShiftData; updatedBy: string }) =>
            endShift(shiftId, data, updatedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.all });
        },
    });
}

export function useAcknowledgeHandover() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, userId }: { shiftId: string; userId: string }) =>
            acknowledgeHandover(shiftId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.all });
        },
    });
}
