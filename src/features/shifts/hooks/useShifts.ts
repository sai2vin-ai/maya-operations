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
import type { UserRole } from '../../../types';

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
        mutationFn: ({
            data,
            createdBy,
            callerRole,
        }: {
            data: StartShiftData;
            createdBy: string;
            callerRole?: UserRole;
        }) => startShift(data, createdBy, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.all });
        },
    });
}

export function useEndShift() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            shiftId,
            data,
            updatedBy,
            callerRole,
        }: {
            shiftId: string;
            data: EndShiftData;
            updatedBy: string;
            callerRole?: UserRole;
        }) => endShift(shiftId, data, updatedBy, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.all });
        },
    });
}

export function useAcknowledgeHandover() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, userId, callerRole }: { shiftId: string; userId: string; callerRole?: UserRole }) =>
            acknowledgeHandover(shiftId, userId, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shiftKeys.all });
        },
    });
}
