import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAssets,
    getAssetById,
    createAsset,
    updateAsset,
    getJobs,
    getJobsByAsset,
    getJobById,
    createJob,
    updateJob,
    getMaintenanceStats,
    type CreateAssetData,
    type UpdateAssetData,
    type CreateJobData,
    type UpdateJobData,
} from '../services/maintenanceService';
import type { UserRole } from '../../../types';

export const maintenanceKeys = {
    all: ['maintenance'] as const,
    assets: () => [...maintenanceKeys.all, 'assets'] as const,
    assetDetail: (id: string) => [...maintenanceKeys.all, 'asset', id] as const,
    jobs: () => [...maintenanceKeys.all, 'jobs'] as const,
    jobsByAsset: (assetId: string) => [...maintenanceKeys.all, 'jobs', 'asset', assetId] as const,
    jobDetail: (id: string) => [...maintenanceKeys.all, 'job', id] as const,
    stats: () => [...maintenanceKeys.all, 'stats'] as const,
};

export function useAssets() {
    return useQuery({
        queryKey: maintenanceKeys.assets(),
        queryFn: () => getAssets(),
    });
}

export function useAsset(id: string | undefined) {
    return useQuery({
        queryKey: maintenanceKeys.assetDetail(id || ''),
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
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.assets() });
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.stats() });
        },
    });
}

export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ assetId, data, updatedBy, callerRole }: { assetId: string; data: UpdateAssetData; updatedBy: string; callerRole?: UserRole }) =>
            updateAsset(assetId, data, updatedBy, callerRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.assets() });
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.assetDetail(variables.assetId) });
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.stats() });
        },
    });
}

export function useJobs() {
    return useQuery({
        queryKey: maintenanceKeys.jobs(),
        queryFn: () => getJobs(),
    });
}

export function useJobsByAsset(assetId: string | undefined) {
    return useQuery({
        queryKey: maintenanceKeys.jobsByAsset(assetId || ''),
        queryFn: () => getJobsByAsset(assetId!),
        enabled: !!assetId,
    });
}

export function useJob(id: string | undefined) {
    return useQuery({
        queryKey: maintenanceKeys.jobDetail(id || ''),
        queryFn: () => getJobById(id!),
        enabled: !!id,
    });
}

export function useCreateJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, reportedBy, callerRole }: { data: CreateJobData; reportedBy: string; callerRole?: UserRole }) =>
            createJob(data, reportedBy, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
        },
    });
}

export function useUpdateJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ jobId, data, updatedBy, callerRole }: { jobId: string; data: UpdateJobData; updatedBy: string; callerRole?: UserRole }) =>
            updateJob(jobId, data, updatedBy, callerRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.jobDetail(variables.jobId) });
        },
    });
}

export function useMaintenanceStats() {
    return useQuery({
        queryKey: maintenanceKeys.stats(),
        queryFn: getMaintenanceStats,
        staleTime: 30_000,
    });
}
