import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getQualityChecks,
    getQualityChecksByBatch,
    getQualityCheckById,
    createQualityCheck,
    updateQualityCheck,
    getQCStats,
    type CreateQualityCheckData,
    type QCStatus,
    type QCParameter,
} from '../services/qualityService';

export const qualityKeys = {
    all: ['quality'] as const,
    lists: () => [...qualityKeys.all, 'list'] as const,
    byBatch: (batchId: string) => [...qualityKeys.all, 'batch', batchId] as const,
    detail: (id: string) => [...qualityKeys.all, 'detail', id] as const,
    stats: () => [...qualityKeys.all, 'stats'] as const,
};

export function useQualityChecks() {
    return useQuery({
        queryKey: qualityKeys.lists(),
        queryFn: () => getQualityChecks(),
    });
}

export function useQualityChecksByBatch(batchId: string | undefined) {
    return useQuery({
        queryKey: qualityKeys.byBatch(batchId || ''),
        queryFn: () => getQualityChecksByBatch(batchId!),
        enabled: !!batchId,
    });
}

export function useQualityCheck(id: string | undefined) {
    return useQuery({
        queryKey: qualityKeys.detail(id || ''),
        queryFn: () => getQualityCheckById(id!),
        enabled: !!id,
    });
}

export function useCreateQualityCheck() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, inspector }: { data: CreateQualityCheckData; inspector: string }) =>
            createQualityCheck(data, inspector),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qualityKeys.all });
        },
    });
}

export function useUpdateQualityCheck() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ checkId, data, updatedBy }: {
            checkId: string;
            data: { status?: QCStatus; parameters?: QCParameter[]; notes?: string };
            updatedBy: string;
        }) => updateQualityCheck(checkId, data, updatedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: qualityKeys.all });
            queryClient.invalidateQueries({ queryKey: qualityKeys.detail(variables.checkId) });
        },
    });
}

export function useQCStats() {
    return useQuery({
        queryKey: qualityKeys.stats(),
        queryFn: getQCStats,
        staleTime: 30_000,
    });
}
