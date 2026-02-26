import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSpareParts,
    getSparePartById,
    getSparePartsByAsset,
    createSparePart,
    updateSparePart,
    receiptSparePart,
    issueSparePart,
    type CreateSparePartData,
    type UpdateSparePartData,
} from '../services/sparePartsService';
import type { SparePartCategory } from '../types';
import type { UserRole } from '../../../types';

// Query keys
export const sparePartKeys = {
    all: ['spareParts'] as const,
    lists: () => [...sparePartKeys.all, 'list'] as const,
    list: (filters: SparePartFilters) => [...sparePartKeys.lists(), filters] as const,
    details: () => [...sparePartKeys.all, 'detail'] as const,
    detail: (id: string) => [...sparePartKeys.details(), id] as const,
    byAsset: (assetId: string) => [...sparePartKeys.all, 'byAsset', assetId] as const,
};

// Filter types
export interface SparePartFilters {
    category?: 'all' | 'low-stock' | SparePartCategory;
    subCategory?: string | 'all';
    searchQuery?: string;
}

// Apply filters to spare parts list
function applyFilters(parts: Awaited<ReturnType<typeof getSpareParts>>, filters?: SparePartFilters) {
    if (!filters) return parts;

    return parts.filter((part) => {
        // Category filter
        if (filters.category && filters.category !== 'all') {
            if (filters.category === 'low-stock') {
                if (part.currentStock > part.minimumStock) return false;
            } else if (part.category !== filters.category) {
                return false;
            }
        }

        // Subcategory filter
        if (filters.subCategory && filters.subCategory !== 'all') {
            if (part.subCategory !== filters.subCategory) return false;
        }

        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
                part.name?.toLowerCase().includes(query) ||
                part.partNumber?.toLowerCase().includes(query) ||
                part.description?.toLowerCase().includes(query) ||
                part.location?.toLowerCase().includes(query)
            );
        }

        return true;
    });
}

// Hook to fetch all spare parts with optional filters
export function useSpareParts(filters?: SparePartFilters) {
    return useQuery({
        queryKey: sparePartKeys.list(filters || {}),
        queryFn: () => getSpareParts(),
        select: (data) => applyFilters(data, filters),
    });
}

// Hook to fetch a single spare part by ID
export function useSparePart(id: string | undefined) {
    return useQuery({
        queryKey: sparePartKeys.detail(id || ''),
        queryFn: () => getSparePartById(id!),
        enabled: !!id,
    });
}

// Hook to fetch spare parts linked to a specific asset
export function useSparePartsByAsset(assetId: string | undefined) {
    return useQuery({
        queryKey: sparePartKeys.byAsset(assetId || ''),
        queryFn: () => getSparePartsByAsset(assetId!),
        enabled: !!assetId,
    });
}

// Hook to create a new spare part
export function useCreateSparePart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            data,
            createdBy,
            callerRole,
        }: {
            data: CreateSparePartData;
            createdBy: string;
            callerRole?: UserRole;
        }) => createSparePart(data, createdBy, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sparePartKeys.all });
        },
    });
}

// Hook to update a spare part
export function useUpdateSparePart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            partId,
            data,
            updatedBy,
            callerRole,
        }: {
            partId: string;
            data: UpdateSparePartData;
            updatedBy: string;
            callerRole?: UserRole;
        }) => updateSparePart(partId, data, updatedBy, callerRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: sparePartKeys.all });
            queryClient.invalidateQueries({ queryKey: sparePartKeys.detail(variables.partId) });
        },
    });
}

// Hook to receipt spare part
export function useReceiptSparePart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            partId,
            quantity,
            reason,
            recordedBy,
            callerRole,
        }: {
            partId: string;
            quantity: number;
            reason: string;
            recordedBy: string;
            callerRole?: UserRole;
        }) => receiptSparePart(partId, quantity, reason, recordedBy, callerRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: sparePartKeys.all });
            queryClient.invalidateQueries({ queryKey: sparePartKeys.detail(variables.partId) });
        },
    });
}

// Hook to issue spare part
export function useIssueSparePart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            partId,
            quantity,
            machineId,
            machineName,
            reason,
            issuedTo,
            recordedBy,
            callerRole,
        }: {
            partId: string;
            quantity: number;
            machineId?: string;
            machineName?: string;
            reason: string;
            issuedTo: string;
            recordedBy: string;
            callerRole?: UserRole;
        }) => issueSparePart(partId, quantity, machineId, machineName, reason, issuedTo, recordedBy, callerRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: sparePartKeys.all });
            queryClient.invalidateQueries({ queryKey: sparePartKeys.detail(variables.partId) });
        },
    });
}
