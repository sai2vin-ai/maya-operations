import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBatches,
    getBatchById,
    getBatchesByReactor,
    getActiveBatch,
    createBatch,
    completeStep,
    recordOutput,
    cancelBatch,
    type CreateBatchData,
    type CompleteStepData,
    type RecordOutputData,
} from '../services/batchService';
import { getReactorAssets, getReactorAssetById } from '../../asset-register/services/assetService';
import { assetKeys } from '../../asset-register/hooks/useAssets';

// Query keys
export const batchKeys = {
    all: ['batches'] as const,
    lists: () => [...batchKeys.all, 'list'] as const,
    list: (filters?: BatchFilters) => [...batchKeys.lists(), filters] as const,
    details: () => [...batchKeys.all, 'detail'] as const,
    detail: (id: string) => [...batchKeys.details(), id] as const,
    byReactor: (reactorId: string) => [...batchKeys.all, 'reactor', reactorId] as const,
    active: (reactorId: string) => [...batchKeys.all, 'active', reactorId] as const,
};

// Filter types
export interface BatchFilters {
    status?: string;
    reactorId?: string;
}

// Hook to fetch all batches
export function useBatches(limit?: number) {
    return useQuery({
        queryKey: batchKeys.list({ limit } as BatchFilters),
        queryFn: () => getBatches(limit),
    });
}

// Hook to fetch a single batch by ID
export function useBatch(id: string | undefined) {
    return useQuery({
        queryKey: batchKeys.detail(id || ''),
        queryFn: () => getBatchById(id!),
        enabled: !!id,
    });
}

// Hook to fetch batches by reactor
export function useBatchesByReactor(reactorId: string | undefined) {
    return useQuery({
        queryKey: batchKeys.byReactor(reactorId || ''),
        queryFn: () => getBatchesByReactor(reactorId!),
        enabled: !!reactorId,
    });
}

// Hook to fetch active batch for a reactor
export function useActiveBatch(reactorId: string | undefined) {
    return useQuery({
        queryKey: batchKeys.active(reactorId || ''),
        queryFn: () => getActiveBatch(reactorId!),
        enabled: !!reactorId,
    });
}

// Hook to fetch all reactors (delegates to asset service)
export function useReactors() {
    return useQuery({
        queryKey: assetKeys.reactors(),
        queryFn: getReactorAssets,
    });
}

// Hook to fetch a single reactor by ID (delegates to asset service)
export function useReactor(id: string | undefined) {
    return useQuery({
        queryKey: assetKeys.reactor(id || ''),
        queryFn: () => getReactorAssetById(id!),
        enabled: !!id,
    });
}

// Hook to create a new batch
export function useCreateBatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, createdBy }: { data: CreateBatchData; createdBy: string }) => createBatch(data, createdBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: batchKeys.all });
            queryClient.invalidateQueries({ queryKey: assetKeys.reactor(variables.data.reactorId) });
            queryClient.invalidateQueries({ queryKey: assetKeys.reactors() });
        },
    });
}

// Hook to complete a step
export function useCompleteStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            batchId,
            stepData,
            completedBy,
        }: {
            batchId: string;
            stepData: CompleteStepData;
            completedBy: string;
        }) => completeStep(batchId, stepData, completedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: batchKeys.detail(variables.batchId) });
            queryClient.invalidateQueries({ queryKey: batchKeys.all });
        },
    });
}

// Hook to record batch output
export function useRecordOutput() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            batchId,
            outputData,
            recordedBy,
        }: {
            batchId: string;
            outputData: RecordOutputData;
            recordedBy: string;
        }) => recordOutput(batchId, outputData, recordedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: batchKeys.detail(variables.batchId) });
            queryClient.invalidateQueries({ queryKey: batchKeys.all });
        },
    });
}

// Hook to cancel a batch
export function useCancelBatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ batchId, reason, cancelledBy }: { batchId: string; reason: string; cancelledBy: string }) =>
            cancelBatch(batchId, reason, cancelledBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: batchKeys.all });
            queryClient.invalidateQueries({ queryKey: assetKeys.reactors() });
        },
    });
}
