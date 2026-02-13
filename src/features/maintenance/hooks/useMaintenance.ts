import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getJobs,
    getJobsByAsset,
    getJobsByAssets,
    getJobById,
    createJob,
    updateJob,
    getJobStats,
    issuePartsToJob,
    type CreateJobData,
    type UpdateJobData,
    type IssuePartsToJobData,
} from '../services/maintenanceService';
import { getChildAssets } from '../../asset-register/services/assetService';
import type { UserRole } from '../../../types';

export const maintenanceKeys = {
    all: ['maintenance'] as const,
    jobs: () => [...maintenanceKeys.all, 'jobs'] as const,
    jobsByAsset: (assetId: string) => [...maintenanceKeys.all, 'jobs', 'asset', assetId] as const,
    jobsByAssetWithChildren: (assetId: string) => [...maintenanceKeys.all, 'jobs', 'assetTree', assetId] as const,
    jobDetail: (id: string) => [...maintenanceKeys.all, 'job', id] as const,
    stats: () => [...maintenanceKeys.all, 'stats'] as const,
};

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

export function useJobsByAssetWithChildren(assetId: string | undefined) {
    return useQuery({
        queryKey: maintenanceKeys.jobsByAssetWithChildren(assetId || ''),
        queryFn: async () => {
            const children = await getChildAssets(assetId!);
            const allIds = [assetId!, ...children.map((c) => c.id)];
            const jobs = await getJobsByAssets(allIds);
            return { jobs, childAssetIds: children.map((c) => c.id) };
        },
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
        mutationFn: ({
            data,
            reportedBy,
            callerRole,
        }: {
            data: CreateJobData;
            reportedBy: string;
            callerRole?: UserRole;
        }) => createJob(data, reportedBy, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
        },
    });
}

export function useUpdateJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            jobId,
            data,
            updatedBy,
            callerRole,
        }: {
            jobId: string;
            data: UpdateJobData;
            updatedBy: string;
            callerRole?: UserRole;
        }) => updateJob(jobId, data, updatedBy, callerRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.jobDetail(variables.jobId) });
        },
    });
}

export function useJobStats() {
    return useQuery({
        queryKey: maintenanceKeys.stats(),
        queryFn: getJobStats,
        staleTime: 30_000,
    });
}

export function useIssuePartsToJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            data,
            issuedBy,
            callerRole,
        }: {
            data: IssuePartsToJobData;
            issuedBy: string;
            callerRole?: UserRole;
        }) => issuePartsToJob(data, issuedBy, callerRole),
        onSuccess: (_, variables) => {
            // Invalidate job detail and job lists
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.jobDetail(variables.data.jobId) });
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.jobs() });
            // Cross-module: invalidate spare parts cache
            queryClient.invalidateQueries({ queryKey: ['spareParts'] });
        },
    });
}
