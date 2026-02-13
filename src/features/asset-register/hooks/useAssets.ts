import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAssets,
    getAssetById,
    createAsset,
    updateAsset,
    getAssetStats,
    getReactorAssets,
    getReactorAssetById,
    getChildAssets,
    getAssetsByIds,
    type CreateAssetData,
    type UpdateAssetData,
} from '../services/assetService';
import type { UserRole } from '../../../types';

export const assetKeys = {
    all: ['assets'] as const,
    lists: () => [...assetKeys.all, 'list'] as const,
    detail: (id: string) => [...assetKeys.all, 'detail', id] as const,
    stats: () => [...assetKeys.all, 'stats'] as const,
    reactors: () => [...assetKeys.all, 'reactors'] as const,
    reactor: (id: string) => [...assetKeys.all, 'reactor', id] as const,
    children: (parentId: string) => [...assetKeys.all, 'children', parentId] as const,
    byIds: (ids: string[]) => [...assetKeys.all, 'byIds', ...ids] as const,
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
        mutationFn: ({
            data,
            createdBy,
            callerRole,
        }: {
            data: CreateAssetData;
            createdBy: string;
            callerRole?: UserRole;
        }) => createAsset(data, createdBy, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
            queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
        },
    });
}

export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assetId,
            data,
            updatedBy,
            callerRole,
        }: {
            assetId: string;
            data: UpdateAssetData;
            updatedBy: string;
            callerRole?: UserRole;
        }) => updateAsset(assetId, data, updatedBy, callerRole),
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

// ============================================
// REACTOR HOOKS
// ============================================

export function useReactorAssets() {
    return useQuery({
        queryKey: assetKeys.reactors(),
        queryFn: getReactorAssets,
    });
}

export function useReactorAsset(id: string | undefined) {
    return useQuery({
        queryKey: assetKeys.reactor(id || ''),
        queryFn: () => getReactorAssetById(id!),
        enabled: !!id,
    });
}

// ============================================
// HIERARCHY HOOKS
// ============================================

export function useChildAssets(parentId: string | undefined) {
    return useQuery({
        queryKey: assetKeys.children(parentId || ''),
        queryFn: () => getChildAssets(parentId!),
        enabled: !!parentId,
    });
}

export function useAssetsByIds(ids: string[] | undefined) {
    return useQuery({
        queryKey: assetKeys.byIds(ids || []),
        queryFn: () => getAssetsByIds(ids!),
        enabled: !!ids && ids.length > 0,
    });
}
