import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    getBugReports,
    getBugReport,
    createBugReport,
    updateBugReportStatus,
} from '../services/bugReportService';
import type { BugReportStatus, BugReportPriority, CreateBugReportData } from '../types';
import type { UserRole } from '../../../types';
import { useToast } from '../../../components/ui/Toast';

export const bugReportKeys = {
    all: ['bugReports'] as const,
    lists: () => [...bugReportKeys.all, 'list'] as const,
    list: (filters: BugReportFilters) => [...bugReportKeys.lists(), filters] as const,
    details: () => [...bugReportKeys.all, 'detail'] as const,
    detail: (id: string) => [...bugReportKeys.details(), id] as const,
};

export interface BugReportFilters {
    status?: 'all' | BugReportStatus;
    priority?: 'all' | BugReportPriority;
}

function applyFilters(
    reports: Awaited<ReturnType<typeof getBugReports>>,
    filters?: BugReportFilters,
) {
    if (!filters) return reports;

    return reports.filter((report) => {
        if (filters.status && filters.status !== 'all' && report.status !== filters.status) {
            return false;
        }
        if (filters.priority && filters.priority !== 'all' && report.priority !== filters.priority) {
            return false;
        }
        return true;
    });
}

export function useBugReports(filters?: BugReportFilters) {
    return useQuery({
        queryKey: bugReportKeys.list(filters || {}),
        queryFn: getBugReports,
        select: (data) => applyFilters(data, filters),
    });
}

export function useBugReport(id: string | undefined) {
    return useQuery({
        queryKey: bugReportKeys.detail(id || ''),
        queryFn: () => getBugReport(id!),
        enabled: !!id,
    });
}

export function useCreateBugReport() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const toast = useToast();

    return useMutation({
        mutationFn: ({
            data,
            createdBy,
            file,
            callerRole,
        }: {
            data: CreateBugReportData;
            createdBy: { userId: string; displayName: string; role: string };
            file?: File;
            callerRole?: UserRole;
        }) => createBugReport(data, createdBy, file, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bugReportKeys.all });
            toast.success('Bug report submitted successfully');
            navigate('/dashboard');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to submit bug report');
        },
    });
}

export function useUpdateBugReportStatus() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({
            id,
            status,
            adminNotes,
            callerRole,
        }: {
            id: string;
            status: BugReportStatus;
            adminNotes?: string;
            callerRole?: UserRole;
        }) => updateBugReportStatus(id, status, adminNotes, callerRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: bugReportKeys.all });
            queryClient.invalidateQueries({ queryKey: bugReportKeys.detail(variables.id) });
            toast.success('Bug report updated');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to update bug report');
        },
    });
}
