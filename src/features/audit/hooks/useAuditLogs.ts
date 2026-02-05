import { useQuery } from '@tanstack/react-query';
import {
    getAuditLogs,
    getAuditLogsByDocument,
    getAuditLogsByUser,
    getRecentAuditLogs,
} from '../services/auditService';
import type { AuditFilters } from '../types';

// Query keys
export const auditKeys = {
    all: ['auditLogs'] as const,
    lists: () => [...auditKeys.all, 'list'] as const,
    list: (filters: AuditFilters) => [...auditKeys.lists(), filters] as const,
    document: (collection: string, docId: string) =>
        [...auditKeys.all, 'document', collection, docId] as const,
    user: (userId: string) => [...auditKeys.all, 'user', userId] as const,
    recent: (count: number) => [...auditKeys.all, 'recent', count] as const,
};

/**
 * Hook to fetch audit logs with filters
 */
export function useAuditLogs(filters?: AuditFilters) {
    return useQuery({
        queryKey: auditKeys.list(filters || {}),
        queryFn: () => getAuditLogs(filters),
        select: (data) => data.logs,
    });
}

/**
 * Hook to fetch audit history for a specific document
 */
export function useDocumentHistory(collection: string, documentId: string) {
    return useQuery({
        queryKey: auditKeys.document(collection, documentId),
        queryFn: () => getAuditLogsByDocument(collection, documentId),
        enabled: !!collection && !!documentId,
    });
}

/**
 * Hook to fetch audit logs by user
 */
export function useUserAuditLogs(userId: string) {
    return useQuery({
        queryKey: auditKeys.user(userId),
        queryFn: () => getAuditLogsByUser(userId),
        enabled: !!userId,
    });
}

/**
 * Hook to fetch recent audit logs for dashboard
 */
export function useRecentAuditLogs(count: number = 10) {
    return useQuery({
        queryKey: auditKeys.recent(count),
        queryFn: () => getRecentAuditLogs(count),
    });
}
