import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getWeighbridgeEntries,
    getPendingEntries,
    getTodayEntries,
    getWeighbridgeEntryById,
    createWeighbridgeEntry,
    recordFirstWeight,
    recordSecondWeightAndComplete,
    cancelWeighbridgeEntry,
    type CreateWeighbridgeEntryData,
    type RecordFirstWeightData,
    type RecordSecondWeightData,
} from '../services/weighbridgeService';
import type { WeighbridgeEntryType } from '../types';

// Query keys
export const weighbridgeKeys = {
    all: ['weighbridge'] as const,
    lists: () => [...weighbridgeKeys.all, 'list'] as const,
    list: (filters: WeighbridgeFilters) => [...weighbridgeKeys.lists(), filters] as const,
    pending: () => [...weighbridgeKeys.all, 'pending'] as const,
    today: () => [...weighbridgeKeys.all, 'today'] as const,
    details: () => [...weighbridgeKeys.all, 'detail'] as const,
    detail: (id: string) => [...weighbridgeKeys.details(), id] as const,
};

// Filter types
export interface WeighbridgeFilters {
    entryType?: 'all' | WeighbridgeEntryType;
    searchQuery?: string;
}

// Apply filters to weighbridge entries
function applyFilters(entries: Awaited<ReturnType<typeof getWeighbridgeEntries>>, filters?: WeighbridgeFilters) {
    if (!filters) return entries;

    return entries.filter((entry) => {
        // Entry type filter
        if (filters.entryType && filters.entryType !== 'all' && entry.entryType !== filters.entryType) {
            return false;
        }

        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
                entry.entryNumber?.toLowerCase().includes(query) ||
                entry.vehicleNumber?.toLowerCase().includes(query) ||
                entry.partyName?.toLowerCase().includes(query) ||
                entry.driverName?.toLowerCase().includes(query)
            );
        }

        return true;
    });
}

// Hook to fetch all weighbridge entries with optional filters
export function useWeighbridgeEntries(filters?: WeighbridgeFilters) {
    return useQuery({
        queryKey: weighbridgeKeys.list(filters || {}),
        queryFn: () => getWeighbridgeEntries(),
        select: (data) => applyFilters(data, filters),
    });
}

// Hook to fetch pending entries
export function usePendingEntries() {
    return useQuery({
        queryKey: weighbridgeKeys.pending(),
        queryFn: getPendingEntries,
    });
}

// Hook to fetch today's entries
export function useTodayEntries() {
    return useQuery({
        queryKey: weighbridgeKeys.today(),
        queryFn: getTodayEntries,
    });
}

// Hook to fetch a single weighbridge entry by ID
export function useWeighbridgeEntry(id: string | undefined) {
    return useQuery({
        queryKey: weighbridgeKeys.detail(id || ''),
        queryFn: () => getWeighbridgeEntryById(id!),
        enabled: !!id,
    });
}

// Hook to create a new weighbridge entry
export function useCreateWeighbridgeEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, createdBy }: { data: CreateWeighbridgeEntryData; createdBy: string }) =>
            createWeighbridgeEntry(data, createdBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weighbridgeKeys.all });
        },
    });
}

// Hook to record first weight
export function useRecordFirstWeight() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entryId,
            data,
            updatedBy,
        }: {
            entryId: string;
            data: RecordFirstWeightData;
            updatedBy: string;
        }) => recordFirstWeight(entryId, data, updatedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: weighbridgeKeys.all });
            queryClient.invalidateQueries({ queryKey: weighbridgeKeys.detail(variables.entryId) });
        },
    });
}

// Hook to record second weight and complete
export function useRecordSecondWeight() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entryId,
            data,
            updatedBy,
        }: {
            entryId: string;
            data: RecordSecondWeightData;
            updatedBy: string;
        }) => recordSecondWeightAndComplete(entryId, data, updatedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weighbridgeKeys.all });
        },
    });
}

// Hook to cancel weighbridge entry
export function useCancelWeighbridgeEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ entryId, updatedBy }: { entryId: string; updatedBy: string }) =>
            cancelWeighbridgeEntry(entryId, updatedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weighbridgeKeys.all });
        },
    });
}
