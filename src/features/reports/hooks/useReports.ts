import { useQuery } from '@tanstack/react-query';
import {
    getOperationsSummary,
    getProductionReport,
} from '../services/reportService';
import type { ReportFilters } from '../types';

// Query keys
export const reportKeys = {
    all: ['reports'] as const,
    summary: (filters: ReportFilters) =>
        [...reportKeys.all, 'summary', filters.startDate.toISOString(), filters.endDate.toISOString()] as const,
    production: (filters: ReportFilters) =>
        [...reportKeys.all, 'production', filters.startDate.toISOString(), filters.endDate.toISOString()] as const,
};

/**
 * Hook to fetch operations summary
 */
export function useOperationsSummary(filters: ReportFilters) {
    return useQuery({
        queryKey: reportKeys.summary(filters),
        queryFn: () => getOperationsSummary(filters),
        enabled: !!filters.startDate && !!filters.endDate,
    });
}

/**
 * Hook to fetch production report
 */
export function useProductionReport(filters: ReportFilters) {
    return useQuery({
        queryKey: reportKeys.production(filters),
        queryFn: () => getProductionReport(filters),
        enabled: !!filters.startDate && !!filters.endDate,
    });
}
