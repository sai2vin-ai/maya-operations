import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getInventoryItems,
    getInventoryItemById,
    createInventoryItem,
    updateInventoryItem,
    recordTransaction,
    type CreateInventoryItemData,
    type UpdateInventoryItemData,
    type RecordTransactionData,
} from '../services/inventoryService';
import type { InventoryCategory } from '../types';

// Query keys
export const inventoryKeys = {
    all: ['inventory'] as const,
    lists: () => [...inventoryKeys.all, 'list'] as const,
    list: (filters: InventoryFilters) => [...inventoryKeys.lists(), filters] as const,
    details: () => [...inventoryKeys.all, 'detail'] as const,
    detail: (id: string) => [...inventoryKeys.details(), id] as const,
};

// Filter types
export interface InventoryFilters {
    category?: 'all' | 'low-stock' | InventoryCategory;
    searchQuery?: string;
}

// Apply filters to inventory list
function applyFilters(items: Awaited<ReturnType<typeof getInventoryItems>>, filters?: InventoryFilters) {
    if (!filters) return items;

    return items.filter((item) => {
        // Category filter
        if (filters.category && filters.category !== 'all') {
            if (filters.category === 'low-stock') {
                if (item.currentStock > item.minimumStock) return false;
            } else if (item.category !== filters.category) {
                return false;
            }
        }

        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
                item.name?.toLowerCase().includes(query) ||
                item.code?.toLowerCase().includes(query) ||
                item.location?.toLowerCase().includes(query)
            );
        }

        return true;
    });
}

// Hook to fetch all inventory items with optional filters
export function useInventory(filters?: InventoryFilters) {
    return useQuery({
        queryKey: inventoryKeys.list(filters || {}),
        queryFn: () => getInventoryItems(),
        select: (data) => applyFilters(data, filters),
    });
}

// Hook to fetch a single inventory item by ID
export function useInventoryItem(id: string | undefined) {
    return useQuery({
        queryKey: inventoryKeys.detail(id || ''),
        queryFn: () => getInventoryItemById(id!),
        enabled: !!id,
    });
}

// Hook to create a new inventory item
export function useCreateInventoryItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, createdBy }: { data: CreateInventoryItemData; createdBy: string }) =>
            createInventoryItem(data, createdBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
        },
    });
}

// Hook to update an inventory item
export function useUpdateInventoryItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            itemId,
            data,
            updatedBy,
        }: {
            itemId: string;
            data: UpdateInventoryItemData;
            updatedBy: string;
        }) => updateInventoryItem(itemId, data, updatedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.itemId) });
        },
    });
}

// Hook to record a transaction
export function useRecordTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, recordedBy }: { data: RecordTransactionData; recordedBy: string }) =>
            recordTransaction(data, recordedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.data.itemId) });
        },
    });
}
