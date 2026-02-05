import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getGateEntries,
    getGateEntryById,
    createGateEntry,
    updateGateEntry,
    completeGateEntry,
    cancelGateEntry,
    type CreateGateEntryData,
    type UpdateGateEntryData,
} from '../services/gateEntryService';
import type { GateEntryStatus } from '../types';

// Query keys
export const gateEntryKeys = {
    all: ['gateEntries'] as const,
    lists: () => [...gateEntryKeys.all, 'list'] as const,
    list: (filters: GateEntryFilters) => [...gateEntryKeys.lists(), filters] as const,
    details: () => [...gateEntryKeys.all, 'detail'] as const,
    detail: (id: string) => [...gateEntryKeys.details(), id] as const,
};

// Filter types
export interface GateEntryFilters {
    status?: 'all' | GateEntryStatus;
    searchQuery?: string;
}

// Apply filters to gate entry list
function applyFilters(entries: Awaited<ReturnType<typeof getGateEntries>>, filters?: GateEntryFilters) {
    if (!filters) return entries;

    return entries.filter((entry) => {
        // Status filter
        if (filters.status && filters.status !== 'all' && entry.status !== filters.status) return false;

        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
                entry.entryNumber?.toLowerCase().includes(query) ||
                entry.vehicleNumber?.toLowerCase().includes(query) ||
                entry.supplierName?.toLowerCase().includes(query) ||
                entry.driverName?.toLowerCase().includes(query)
            );
        }

        return true;
    });
}

// Hook to fetch all gate entries with optional filters
export function useGateEntries(filters?: GateEntryFilters) {
    return useQuery({
        queryKey: gateEntryKeys.list(filters || {}),
        queryFn: () => getGateEntries(),
        select: (data) => applyFilters(data, filters),
    });
}

// Hook to fetch a single gate entry by ID
export function useGateEntry(id: string | undefined) {
    return useQuery({
        queryKey: gateEntryKeys.detail(id || ''),
        queryFn: () => getGateEntryById(id!),
        enabled: !!id,
    });
}

// Hook to create a new gate entry
export function useCreateGateEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, createdBy }: { data: CreateGateEntryData; createdBy: string }) =>
            createGateEntry(data, createdBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gateEntryKeys.all });
        },
    });
}

// Hook to update a gate entry
export function useUpdateGateEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entryId,
            data,
            updatedBy,
        }: {
            entryId: string;
            data: UpdateGateEntryData;
            updatedBy: string;
        }) => updateGateEntry(entryId, data, updatedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: gateEntryKeys.all });
            queryClient.invalidateQueries({ queryKey: gateEntryKeys.detail(variables.entryId) });
        },
    });
}

// Hook to complete a gate entry
export function useCompleteGateEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ entryId, updatedBy }: { entryId: string; updatedBy: string }) =>
            completeGateEntry(entryId, updatedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gateEntryKeys.all });
        },
    });
}

// Hook to cancel a gate entry
export function useCancelGateEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entryId,
            reason,
            updatedBy,
        }: {
            entryId: string;
            reason: string;
            updatedBy: string;
        }) => cancelGateEntry(entryId, reason, updatedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gateEntryKeys.all });
        },
    });
}
