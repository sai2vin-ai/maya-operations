import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useWebhooks,
    useWebhook,
    useCreateWebhook,
    useUpdateWebhook,
    useDeleteWebhook,
    useToggleWebhookStatus,
    useWebhookDeliveries,
    useRecentDeliveries,
    useTestWebhook,
    webhookKeys,
} from './useWebhooks';
import { createWrapper, mockTimestamp } from '../../../test/test-utils';
import * as webhookService from '../services/webhookService';
import type { Webhook, WebhookDelivery } from '../types';

// Mock the webhook service
vi.mock('../services/webhookService', () => ({
    getWebhooks: vi.fn(),
    getWebhooksByStatus: vi.fn(),
    getWebhookById: vi.fn(),
    createWebhook: vi.fn(),
    updateWebhook: vi.fn(),
    deleteWebhook: vi.fn(),
    activateWebhook: vi.fn(),
    deactivateWebhook: vi.fn(),
    getWebhookDeliveries: vi.fn(),
    getRecentDeliveries: vi.fn(),
    testWebhook: vi.fn(),
}));

// Helper to create mock webhook data
function mockWebhook(overrides: Partial<Webhook> = {}): Webhook {
    return {
        id: 'wh_test_abc123',
        name: 'Test Webhook',
        description: 'A test webhook',
        url: 'https://api.example.com/hook',
        method: 'POST',
        events: ['batch.started', 'batch.completed'],
        headers: { Authorization: 'Bearer token123' },
        status: 'ACTIVE',
        retryCount: 0,
        maxRetries: 3,
        successCount: 10,
        failureCount: 0,
        createdAt: mockTimestamp(),
        createdBy: 'admin',
        updatedAt: mockTimestamp(),
        updatedBy: 'admin',
        ...overrides,
    } as Webhook;
}

// Helper to create mock delivery data
function mockDelivery(overrides: Partial<WebhookDelivery> = {}): WebhookDelivery {
    return {
        id: 'del_test_abc123',
        webhookId: 'wh_test_abc123',
        webhookName: 'Test Webhook',
        event: 'batch.started',
        payload: { batchId: 'batch-1' },
        url: 'https://api.example.com/hook',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        status: 'SUCCESS',
        responseCode: 200,
        duration: 150,
        attemptNumber: 1,
        triggeredAt: mockTimestamp(),
        completedAt: mockTimestamp(),
        ...overrides,
    } as WebhookDelivery;
}

describe('useWebhooks hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useWebhooks', () => {
        it('should fetch and return webhooks', async () => {
            const mockWebhooks = [
                mockWebhook({ id: 'wh_1', name: 'Webhook 1', status: 'ACTIVE' }),
                mockWebhook({ id: 'wh_2', name: 'Webhook 2', status: 'INACTIVE' }),
            ];

            vi.mocked(webhookService.getWebhooks).mockResolvedValue(mockWebhooks);

            const { result } = renderHook(() => useWebhooks(), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(webhookService.getWebhooks).toHaveBeenCalledTimes(1);
        });

        it('should filter webhooks by active status', async () => {
            const mockWebhooks = [
                mockWebhook({ id: 'wh_1', name: 'Active Hook', status: 'ACTIVE' }),
                mockWebhook({ id: 'wh_2', name: 'Inactive Hook', status: 'INACTIVE' }),
            ];

            vi.mocked(webhookService.getWebhooks).mockResolvedValue(mockWebhooks);

            const { result } = renderHook(() => useWebhooks({ status: 'ACTIVE' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Active Hook');
        });

        it('should filter webhooks by inactive status', async () => {
            const mockWebhooks = [
                mockWebhook({ id: 'wh_1', name: 'Active Hook', status: 'ACTIVE' }),
                mockWebhook({ id: 'wh_2', name: 'Inactive Hook', status: 'INACTIVE' }),
            ];

            vi.mocked(webhookService.getWebhooks).mockResolvedValue(mockWebhooks);

            const { result } = renderHook(() => useWebhooks({ status: 'INACTIVE' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Inactive Hook');
        });

        it('should show all webhooks when status is "all"', async () => {
            const mockWebhooks = [
                mockWebhook({ id: 'wh_1', name: 'Active Hook', status: 'ACTIVE' }),
                mockWebhook({ id: 'wh_2', name: 'Inactive Hook', status: 'INACTIVE' }),
                mockWebhook({ id: 'wh_3', name: 'Failed Hook', status: 'FAILED' }),
            ];

            vi.mocked(webhookService.getWebhooks).mockResolvedValue(mockWebhooks);

            const { result } = renderHook(() => useWebhooks({ status: 'all' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(3);
        });

        it('should filter webhooks by search query on name', async () => {
            const mockWebhooks = [
                mockWebhook({ id: 'wh_1', name: 'Production Webhook', url: 'https://prod.example.com/hook' }),
                mockWebhook({ id: 'wh_2', name: 'Staging Webhook', url: 'https://staging.example.com/hook' }),
            ];

            vi.mocked(webhookService.getWebhooks).mockResolvedValue(mockWebhooks);

            const { result } = renderHook(() => useWebhooks({ searchQuery: 'production' }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Production Webhook');
        });

        it('should filter webhooks by search query on URL', async () => {
            const mockWebhooks = [
                mockWebhook({ id: 'wh_1', name: 'Webhook A', url: 'https://api.slack.com/hook' }),
                mockWebhook({ id: 'wh_2', name: 'Webhook B', url: 'https://api.discord.com/hook' }),
            ];

            vi.mocked(webhookService.getWebhooks).mockResolvedValue(mockWebhooks);

            const { result } = renderHook(() => useWebhooks({ searchQuery: 'slack' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].url).toBe('https://api.slack.com/hook');
        });

        it('should filter webhooks by search query on description', async () => {
            const mockWebhooks = [
                mockWebhook({ id: 'wh_1', name: 'Hook 1', description: 'Sends alerts to Slack' }),
                mockWebhook({ id: 'wh_2', name: 'Hook 2', description: 'Logs to database' }),
            ];

            vi.mocked(webhookService.getWebhooks).mockResolvedValue(mockWebhooks);

            const { result } = renderHook(() => useWebhooks({ searchQuery: 'alerts' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].description).toBe('Sends alerts to Slack');
        });

        it('should handle error state', async () => {
            vi.mocked(webhookService.getWebhooks).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useWebhooks(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Network error');
        });

        it('should return empty array when no webhooks match filter', async () => {
            const mockWebhooks = [mockWebhook({ id: 'wh_1', name: 'Active Hook', status: 'ACTIVE' })];

            vi.mocked(webhookService.getWebhooks).mockResolvedValue(mockWebhooks);

            const { result } = renderHook(() => useWebhooks({ status: 'FAILED' }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(0);
        });
    });

    describe('useWebhook', () => {
        it('should fetch a single webhook by ID', async () => {
            const webhook = mockWebhook({ id: 'wh_123', name: 'My Webhook' });
            vi.mocked(webhookService.getWebhookById).mockResolvedValue(webhook);

            const { result } = renderHook(() => useWebhook('wh_123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.name).toBe('My Webhook');
            expect(webhookService.getWebhookById).toHaveBeenCalledWith('wh_123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useWebhook(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(webhookService.getWebhookById).not.toHaveBeenCalled();
        });

        it('should handle null result (webhook not found)', async () => {
            vi.mocked(webhookService.getWebhookById).mockResolvedValue(null);

            const { result } = renderHook(() => useWebhook('wh_nonexistent'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBeNull();
        });
    });

    describe('useCreateWebhook', () => {
        it('should create a webhook and return the ID', async () => {
            vi.mocked(webhookService.createWebhook).mockResolvedValue('wh_new_123');

            const { result } = renderHook(() => useCreateWebhook(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    name: 'New Webhook',
                    url: 'https://api.example.com/hook',
                    method: 'POST' as const,
                    events: ['batch.started' as const, 'batch.completed' as const],
                },
                createdBy: 'admin',
                callerRole: 'SUPER_ADMIN' as const,
            };

            const webhookId = await result.current.mutateAsync(createData);

            expect(webhookId).toBe('wh_new_123');
            expect(webhookService.createWebhook).toHaveBeenCalledWith(
                createData.data,
                createData.createdBy,
                createData.callerRole,
            );
        });

        it('should handle creation error', async () => {
            vi.mocked(webhookService.createWebhook).mockRejectedValue(
                new Error('Webhook name must be at least 2 characters'),
            );

            const { result } = renderHook(() => useCreateWebhook(), {
                wrapper: createWrapper(),
            });

            await expect(
                result.current.mutateAsync({
                    data: {
                        name: 'A',
                        url: 'https://api.example.com/hook',
                        method: 'POST',
                        events: ['batch.started'],
                    },
                    createdBy: 'admin',
                    callerRole: 'SUPER_ADMIN',
                }),
            ).rejects.toThrow('Webhook name must be at least 2 characters');
        });

        it('should pass callerRole for authorization', async () => {
            vi.mocked(webhookService.createWebhook).mockResolvedValue('wh_new');

            const { result } = renderHook(() => useCreateWebhook(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                data: {
                    name: 'Role Test Webhook',
                    url: 'https://api.example.com/hook',
                    method: 'POST',
                    events: ['batch.started'],
                },
                createdBy: 'admin',
                callerRole: 'PLANT_MANAGER',
            });

            expect(webhookService.createWebhook).toHaveBeenCalledWith(expect.any(Object), 'admin', 'PLANT_MANAGER');
        });
    });

    describe('useUpdateWebhook', () => {
        it('should update a webhook', async () => {
            vi.mocked(webhookService.updateWebhook).mockResolvedValue(undefined);

            const { result } = renderHook(() => useUpdateWebhook(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                webhookId: 'wh_123',
                data: { name: 'Updated Webhook', url: 'https://new.example.com/hook' },
                updatedBy: 'admin',
                callerRole: 'SUPER_ADMIN',
            });

            expect(webhookService.updateWebhook).toHaveBeenCalledWith(
                'wh_123',
                { name: 'Updated Webhook', url: 'https://new.example.com/hook' },
                'admin',
                'SUPER_ADMIN',
            );
        });

        it('should handle update error', async () => {
            vi.mocked(webhookService.updateWebhook).mockRejectedValue(new Error('Invalid webhook URL'));

            const { result } = renderHook(() => useUpdateWebhook(), {
                wrapper: createWrapper(),
            });

            await expect(
                result.current.mutateAsync({
                    webhookId: 'wh_123',
                    data: { url: 'not-valid' },
                    updatedBy: 'admin',
                    callerRole: 'SUPER_ADMIN',
                }),
            ).rejects.toThrow('Invalid webhook URL');
        });

        it('should update webhook status', async () => {
            vi.mocked(webhookService.updateWebhook).mockResolvedValue(undefined);

            const { result } = renderHook(() => useUpdateWebhook(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                webhookId: 'wh_123',
                data: { status: 'INACTIVE' },
                updatedBy: 'admin',
                callerRole: 'SUPER_ADMIN',
            });

            expect(webhookService.updateWebhook).toHaveBeenCalledWith(
                'wh_123',
                { status: 'INACTIVE' },
                'admin',
                'SUPER_ADMIN',
            );
        });
    });

    describe('useDeleteWebhook', () => {
        it('should delete a webhook', async () => {
            vi.mocked(webhookService.deleteWebhook).mockResolvedValue(undefined);

            const { result } = renderHook(() => useDeleteWebhook(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                webhookId: 'wh_123',
                callerRole: 'SUPER_ADMIN',
            });

            expect(webhookService.deleteWebhook).toHaveBeenCalledWith('wh_123', 'SUPER_ADMIN');
        });

        it('should pass callerRole as object parameter', async () => {
            vi.mocked(webhookService.deleteWebhook).mockResolvedValue(undefined);

            const { result } = renderHook(() => useDeleteWebhook(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                webhookId: 'wh_to_delete',
                callerRole: 'PLANT_MANAGER',
            });

            expect(webhookService.deleteWebhook).toHaveBeenCalledWith('wh_to_delete', 'PLANT_MANAGER');
        });

        it('should handle deletion error', async () => {
            vi.mocked(webhookService.deleteWebhook).mockRejectedValue(new Error('Authentication required'));

            const { result } = renderHook(() => useDeleteWebhook(), {
                wrapper: createWrapper(),
            });

            await expect(
                result.current.mutateAsync({
                    webhookId: 'wh_123',
                    callerRole: undefined,
                }),
            ).rejects.toThrow('Authentication required');
        });
    });

    describe('useToggleWebhookStatus', () => {
        it('should deactivate an active webhook', async () => {
            vi.mocked(webhookService.deactivateWebhook).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleWebhookStatus(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                webhookId: 'wh_123',
                currentStatus: 'ACTIVE',
                updatedBy: 'admin',
            });

            expect(webhookService.deactivateWebhook).toHaveBeenCalledWith('wh_123', 'admin');
            expect(webhookService.activateWebhook).not.toHaveBeenCalled();
        });

        it('should activate an inactive webhook', async () => {
            vi.mocked(webhookService.activateWebhook).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleWebhookStatus(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                webhookId: 'wh_123',
                currentStatus: 'INACTIVE',
                updatedBy: 'admin',
            });

            expect(webhookService.activateWebhook).toHaveBeenCalledWith('wh_123', 'admin');
            expect(webhookService.deactivateWebhook).not.toHaveBeenCalled();
        });

        it('should activate a failed webhook', async () => {
            vi.mocked(webhookService.activateWebhook).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleWebhookStatus(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                webhookId: 'wh_123',
                currentStatus: 'FAILED',
                updatedBy: 'admin',
            });

            expect(webhookService.activateWebhook).toHaveBeenCalledWith('wh_123', 'admin');
            expect(webhookService.deactivateWebhook).not.toHaveBeenCalled();
        });
    });

    describe('useWebhookDeliveries', () => {
        it('should fetch deliveries for a webhook', async () => {
            const mockDeliveries = [
                mockDelivery({ id: 'del_1', status: 'SUCCESS' }),
                mockDelivery({ id: 'del_2', status: 'FAILED' }),
            ];

            vi.mocked(webhookService.getWebhookDeliveries).mockResolvedValue(mockDeliveries);

            const { result } = renderHook(() => useWebhookDeliveries('wh_123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(webhookService.getWebhookDeliveries).toHaveBeenCalledWith('wh_123', undefined);
        });

        it('should not fetch when webhookId is undefined', async () => {
            const { result } = renderHook(() => useWebhookDeliveries(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(webhookService.getWebhookDeliveries).not.toHaveBeenCalled();
        });

        it('should pass limitCount parameter', async () => {
            vi.mocked(webhookService.getWebhookDeliveries).mockResolvedValue([]);

            const { result } = renderHook(() => useWebhookDeliveries('wh_123', 10), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(webhookService.getWebhookDeliveries).toHaveBeenCalledWith('wh_123', 10);
        });
    });

    describe('useRecentDeliveries', () => {
        it('should fetch recent deliveries across all webhooks', async () => {
            const mockDeliveries = [
                mockDelivery({ id: 'del_1', webhookId: 'wh_1' }),
                mockDelivery({ id: 'del_2', webhookId: 'wh_2' }),
            ];

            vi.mocked(webhookService.getRecentDeliveries).mockResolvedValue(mockDeliveries);

            const { result } = renderHook(() => useRecentDeliveries(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(webhookService.getRecentDeliveries).toHaveBeenCalledWith(undefined);
        });

        it('should pass limitCount parameter', async () => {
            vi.mocked(webhookService.getRecentDeliveries).mockResolvedValue([]);

            const { result } = renderHook(() => useRecentDeliveries(25), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(webhookService.getRecentDeliveries).toHaveBeenCalledWith(25);
        });
    });

    describe('useTestWebhook', () => {
        it('should test a webhook successfully', async () => {
            vi.mocked(webhookService.testWebhook).mockResolvedValue({
                success: true,
                responseCode: 200,
                responseBody: 'OK',
                duration: 150,
            });

            const { result } = renderHook(() => useTestWebhook(), {
                wrapper: createWrapper(),
            });

            const testResult = await result.current.mutateAsync('wh_123');

            expect(testResult.success).toBe(true);
            expect(testResult.responseCode).toBe(200);
            expect(webhookService.testWebhook).toHaveBeenCalledWith('wh_123');
        });

        it('should handle test failure', async () => {
            vi.mocked(webhookService.testWebhook).mockResolvedValue({
                success: false,
                error: 'Connection refused',
                duration: 5000,
            });

            const { result } = renderHook(() => useTestWebhook(), {
                wrapper: createWrapper(),
            });

            const testResult = await result.current.mutateAsync('wh_123');

            expect(testResult.success).toBe(false);
            expect(testResult.error).toBe('Connection refused');
        });

        it('should handle webhook not found during test', async () => {
            vi.mocked(webhookService.testWebhook).mockResolvedValue({
                success: false,
                error: 'Webhook not found',
            });

            const { result } = renderHook(() => useTestWebhook(), {
                wrapper: createWrapper(),
            });

            const testResult = await result.current.mutateAsync('wh_nonexistent');

            expect(testResult.success).toBe(false);
            expect(testResult.error).toBe('Webhook not found');
        });
    });

    describe('webhookKeys', () => {
        it('should generate correct base key', () => {
            expect(webhookKeys.all).toEqual(['webhooks']);
        });

        it('should generate correct lists key', () => {
            expect(webhookKeys.lists()).toEqual(['webhooks', 'list']);
        });

        it('should generate correct list key with filters', () => {
            expect(webhookKeys.list({ status: 'ACTIVE' })).toEqual(['webhooks', 'list', { status: 'ACTIVE' }]);
        });

        it('should generate correct list key with empty filters', () => {
            expect(webhookKeys.list({})).toEqual(['webhooks', 'list', {}]);
        });

        it('should generate correct list key with search query', () => {
            expect(webhookKeys.list({ searchQuery: 'test' })).toEqual(['webhooks', 'list', { searchQuery: 'test' }]);
        });

        it('should generate correct list key with multiple filters', () => {
            expect(webhookKeys.list({ status: 'ACTIVE', searchQuery: 'prod' })).toEqual([
                'webhooks',
                'list',
                { status: 'ACTIVE', searchQuery: 'prod' },
            ]);
        });

        it('should generate correct details key', () => {
            expect(webhookKeys.details()).toEqual(['webhooks', 'detail']);
        });

        it('should generate correct detail key with ID', () => {
            expect(webhookKeys.detail('wh_123')).toEqual(['webhooks', 'detail', 'wh_123']);
        });

        it('should generate correct deliveries key', () => {
            expect(webhookKeys.deliveries('wh_123')).toEqual(['webhooks', 'deliveries', 'wh_123']);
        });

        it('should generate correct recentDeliveries key', () => {
            expect(webhookKeys.recentDeliveries()).toEqual(['webhooks', 'recentDeliveries']);
        });

        it('should have keys that are hierarchically nested under "all"', () => {
            // All key variants should start with the base key
            const base = webhookKeys.all;
            expect(webhookKeys.lists()[0]).toBe(base[0]);
            expect(webhookKeys.details()[0]).toBe(base[0]);
            expect(webhookKeys.deliveries('id')[0]).toBe(base[0]);
            expect(webhookKeys.recentDeliveries()[0]).toBe(base[0]);
        });
    });
});
