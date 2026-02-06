import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getWebhooks,
    getWebhookById,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    activateWebhook,
    deactivateWebhook,
    getWebhookDeliveries,
    getRecentDeliveries,
    testWebhook,
} from '../services/webhookService';
import type { WebhookStatus, CreateWebhookData, UpdateWebhookData } from '../types';
import type { UserRole } from '../../../types';

// Query keys
export const webhookKeys = {
    all: ['webhooks'] as const,
    lists: () => [...webhookKeys.all, 'list'] as const,
    list: (filters: WebhookFilters) => [...webhookKeys.lists(), filters] as const,
    details: () => [...webhookKeys.all, 'detail'] as const,
    detail: (id: string) => [...webhookKeys.details(), id] as const,
    deliveries: (id: string) => [...webhookKeys.all, 'deliveries', id] as const,
    recentDeliveries: () => [...webhookKeys.all, 'recentDeliveries'] as const,
};

// Filter types
export interface WebhookFilters {
    status?: 'all' | WebhookStatus;
    searchQuery?: string;
}

// Apply filters to webhook list
function applyFilters(
    webhooks: Awaited<ReturnType<typeof getWebhooks>>,
    filters?: WebhookFilters
) {
    if (!filters) return webhooks;

    return webhooks.filter((webhook) => {
        // Status filter
        if (filters.status && filters.status !== 'all' && webhook.status !== filters.status) {
            return false;
        }

        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
                webhook.name?.toLowerCase().includes(query) ||
                webhook.url?.toLowerCase().includes(query) ||
                webhook.description?.toLowerCase().includes(query)
            );
        }

        return true;
    });
}

/**
 * Hook to fetch all webhooks with optional filters
 */
export function useWebhooks(filters?: WebhookFilters) {
    return useQuery({
        queryKey: webhookKeys.list(filters || {}),
        queryFn: getWebhooks,
        select: (data) => applyFilters(data, filters),
    });
}

/**
 * Hook to fetch a single webhook by ID
 */
export function useWebhook(id: string | undefined) {
    return useQuery({
        queryKey: webhookKeys.detail(id || ''),
        queryFn: () => getWebhookById(id!),
        enabled: !!id,
    });
}

/**
 * Hook to create a new webhook
 */
export function useCreateWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, createdBy, callerRole }: { data: CreateWebhookData; createdBy: string; callerRole?: UserRole }) =>
            createWebhook(data, createdBy, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: webhookKeys.all });
        },
    });
}

/**
 * Hook to update a webhook
 */
export function useUpdateWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            webhookId,
            data,
            updatedBy,
            callerRole,
        }: {
            webhookId: string;
            data: UpdateWebhookData;
            updatedBy: string;
            callerRole?: UserRole;
        }) => updateWebhook(webhookId, data, updatedBy, callerRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: webhookKeys.all });
            queryClient.invalidateQueries({
                queryKey: webhookKeys.detail(variables.webhookId),
            });
        },
    });
}

/**
 * Hook to delete a webhook
 */
export function useDeleteWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ webhookId, callerRole }: { webhookId: string; callerRole?: UserRole }) =>
            deleteWebhook(webhookId, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: webhookKeys.all });
        },
    });
}

/**
 * Hook to toggle webhook status
 */
export function useToggleWebhookStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            webhookId,
            currentStatus,
            updatedBy,
        }: {
            webhookId: string;
            currentStatus: WebhookStatus;
            updatedBy: string;
        }) => {
            if (currentStatus === 'ACTIVE') {
                return deactivateWebhook(webhookId, updatedBy);
            } else {
                return activateWebhook(webhookId, updatedBy);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: webhookKeys.all });
        },
    });
}

/**
 * Hook to fetch webhook deliveries
 */
export function useWebhookDeliveries(webhookId: string | undefined, limitCount?: number) {
    return useQuery({
        queryKey: webhookKeys.deliveries(webhookId || ''),
        queryFn: () => getWebhookDeliveries(webhookId!, limitCount),
        enabled: !!webhookId,
    });
}

/**
 * Hook to fetch recent deliveries across all webhooks
 */
export function useRecentDeliveries(limitCount?: number) {
    return useQuery({
        queryKey: webhookKeys.recentDeliveries(),
        queryFn: () => getRecentDeliveries(limitCount),
    });
}

/**
 * Hook to test a webhook
 */
export function useTestWebhook() {
    return useMutation({
        mutationFn: (webhookId: string) => testWebhook(webhookId),
    });
}
