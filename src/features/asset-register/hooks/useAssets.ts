import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAssets,
    getAssetById,
    createAsset,
    updateAsset,
    getAssetStats,
    type CreateAssetData,
    type UpdateAssetData,
} from '../services/assetService';
import type { UserRole } from '../../../types';

export const assetKeys = {
    all: ['assets'] as const,
    lists: () => [...assetKeys.all, 'list'] as const,
    detail: (id: string) => [...assetKeys.all, 'detail', id] as const,
    stats: () => [...assetKeys.all, 'stats'] as const,
};

export function useAssets() {
    return useQuery({
        queryKey: assetKeys.lists(),
        queryFn: () => getAssets(),
    });
}

export function useAsset(id: string | undefined) {
    return useQuery({
        queryKey: assetKeys.detail(id || ''),
        queryFn: () => getAssetById(id!),
        enabled: !!id,
    });
}

export function useCreateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, createdBy, callerRole }: { data: CreateAssetData; createdBy: string; callerRole?: UserRole }) =>
            createAsset(data, createdBy, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
            queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
        },
    });
}

export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ assetId, data, updatedBy, callerRole }: { assetId: string; data: UpdateAssetData; updatedBy: string; callerRole?: UserRole }) =>
            updateAsset(assetId, data, updatedBy, callerRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
            queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.assetId) });
            queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
        },
    });
}

export function useAssetStats() {
    return useQuery({
        queryKey: assetKeys.stats(),
        queryFn: getAssetStats,
        staleTime: 30_000,
    });
}
