import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WEBHOOK_EVENT_LABELS, WEBHOOK_EVENT_CATEGORIES } from '../types';
import type { WebhookStatus, WebhookMethod } from '../types';
import { validateUrl, validateWebhookHeaders } from '../../../utils/validation';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
    },
}));

vi.mock('../../../lib/firebase', () => ({
    db: {},
}));

vi.mock('../../../lib/authorization', () => ({
    assertAuthorized: vi.fn(),
}));

describe('webhookService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('WEBHOOK_EVENT_LABELS', () => {
        it('should have all required event types', () => {
            const eventTypes = Object.keys(WEBHOOK_EVENT_LABELS);
            expect(eventTypes).toContain('gate_entry.created');
            expect(eventTypes).toContain('gate_entry.completed');
            expect(eventTypes).toContain('gate_entry.cancelled');
            expect(eventTypes).toContain('batch.started');
            expect(eventTypes).toContain('batch.completed');
            expect(eventTypes).toContain('batch.cancelled');
            expect(eventTypes).toContain('weighbridge.completed');
            expect(eventTypes).toContain('inventory.low_stock');
            expect(eventTypes).toContain('user.created');
            expect(eventTypes).toContain('user.status_changed');
        });

        it('should have exactly 10 event types', () => {
            expect(Object.keys(WEBHOOK_EVENT_LABELS)).toHaveLength(10);
        });

        it('should have labels for all event types', () => {
            Object.values(WEBHOOK_EVENT_LABELS).forEach((label) => {
                expect(label).toBeDefined();
                expect(typeof label).toBe('string');
                expect(label.length).toBeGreaterThan(0);
            });
        });

        it('should have unique labels', () => {
            const labels = Object.values(WEBHOOK_EVENT_LABELS);
            const uniqueLabels = new Set(labels);
            expect(uniqueLabels.size).toBe(labels.length);
        });

        it('should have human-readable labels', () => {
            expect(WEBHOOK_EVENT_LABELS['gate_entry.created']).toBe('Gate Entry Created');
            expect(WEBHOOK_EVENT_LABELS['batch.started']).toBe('Batch Started');
            expect(WEBHOOK_EVENT_LABELS['weighbridge.completed']).toBe('Weighbridge Entry Completed');
            expect(WEBHOOK_EVENT_LABELS['inventory.low_stock']).toBe('Inventory Low Stock Alert');
            expect(WEBHOOK_EVENT_LABELS['user.created']).toBe('User Created');
            expect(WEBHOOK_EVENT_LABELS['user.status_changed']).toBe('User Status Changed');
        });
    });

    describe('WEBHOOK_EVENT_CATEGORIES', () => {
        it('should have all required categories', () => {
            const categories = Object.keys(WEBHOOK_EVENT_CATEGORIES);
            expect(categories).toContain('Gate Operations');
            expect(categories).toContain('Reactor Operations');
            expect(categories).toContain('Weighbridge');
            expect(categories).toContain('Inventory');
            expect(categories).toContain('User Management');
        });

        it('should have exactly 5 categories', () => {
            expect(Object.keys(WEBHOOK_EVENT_CATEGORIES)).toHaveLength(5);
        });

        it('should group gate events correctly', () => {
            const gateEvents = WEBHOOK_EVENT_CATEGORIES['Gate Operations'];
            expect(gateEvents).toContain('gate_entry.created');
            expect(gateEvents).toContain('gate_entry.completed');
            expect(gateEvents).toContain('gate_entry.cancelled');
            expect(gateEvents).toHaveLength(3);
        });

        it('should group reactor events correctly', () => {
            const reactorEvents = WEBHOOK_EVENT_CATEGORIES['Reactor Operations'];
            expect(reactorEvents).toContain('batch.started');
            expect(reactorEvents).toContain('batch.completed');
            expect(reactorEvents).toContain('batch.cancelled');
            expect(reactorEvents).toHaveLength(3);
        });

        it('should group weighbridge events correctly', () => {
            const weighbridgeEvents = WEBHOOK_EVENT_CATEGORIES['Weighbridge'];
            expect(weighbridgeEvents).toContain('weighbridge.completed');
            expect(weighbridgeEvents).toHaveLength(1);
        });

        it('should group inventory events correctly', () => {
            const inventoryEvents = WEBHOOK_EVENT_CATEGORIES['Inventory'];
            expect(inventoryEvents).toContain('inventory.low_stock');
            expect(inventoryEvents).toHaveLength(1);
        });

        it('should group user management events correctly', () => {
            const userEvents = WEBHOOK_EVENT_CATEGORIES['User Management'];
            expect(userEvents).toContain('user.created');
            expect(userEvents).toContain('user.status_changed');
            expect(userEvents).toHaveLength(2);
        });

        it('should cover all event types across categories', () => {
            const allCategoryEvents = Object.values(WEBHOOK_EVENT_CATEGORIES).flat();
            const allLabelKeys = Object.keys(WEBHOOK_EVENT_LABELS);

            // Every event type in labels should be in a category
            allLabelKeys.forEach((eventType) => {
                expect(allCategoryEvents).toContain(eventType);
            });

            // Every event in categories should be in labels
            allCategoryEvents.forEach((eventType) => {
                expect(allLabelKeys).toContain(eventType);
            });
        });
    });

    describe('WebhookStatus type coverage', () => {
        it('should support all valid statuses', () => {
            const validStatuses: WebhookStatus[] = ['ACTIVE', 'INACTIVE', 'FAILED'];
            expect(validStatuses).toHaveLength(3);
            validStatuses.forEach((status) => {
                expect(typeof status).toBe('string');
            });
        });
    });

    describe('WebhookMethod type coverage', () => {
        it('should support POST and PUT methods', () => {
            const validMethods: WebhookMethod[] = ['POST', 'PUT'];
            expect(validMethods).toHaveLength(2);
            validMethods.forEach((method) => {
                expect(typeof method).toBe('string');
            });
        });
    });

    describe('URL validation integration', () => {
        it('should accept valid HTTPS URLs', () => {
            const result = validateUrl('https://api.example.com/webhooks');
            expect(result.isValid).toBe(true);
        });

        it('should accept valid HTTP URLs', () => {
            const result = validateUrl('http://api.example.com/webhooks');
            expect(result.isValid).toBe(true);
        });

        it('should reject empty URLs', () => {
            const result = validateUrl('');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL is required');
        });

        it('should reject URLs with invalid protocol', () => {
            const result = validateUrl('ftp://example.com/webhooks');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL must use http or https protocol');
        });

        it('should reject localhost URLs', () => {
            const result = validateUrl('http://localhost:3000/hook');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL cannot point to localhost');
        });

        it('should reject 127.0.0.1 URLs', () => {
            const result = validateUrl('http://127.0.0.1:8080/hook');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL cannot point to localhost');
        });

        it('should reject private IP addresses (10.x.x.x)', () => {
            const result = validateUrl('http://10.0.0.1/hook');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL cannot point to a private IP address');
        });

        it('should reject private IP addresses (192.168.x.x)', () => {
            const result = validateUrl('http://192.168.1.1/hook');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL cannot point to a private IP address');
        });

        it('should reject private IP addresses (172.16-31.x.x)', () => {
            const result = validateUrl('http://172.16.0.1/hook');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL cannot point to a private IP address');
        });

        it('should reject malformed URLs', () => {
            const result = validateUrl('not-a-url');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid URL format');
        });

        it('should reject URLs that are too long', () => {
            const longUrl = 'https://example.com/' + 'a'.repeat(2048);
            const result = validateUrl(longUrl);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL is too long (max 2048 characters)');
        });

        it('should accept URLs with paths and query params', () => {
            const result = validateUrl('https://api.example.com/v1/webhooks?token=abc123');
            expect(result.isValid).toBe(true);
        });
    });

    describe('Header validation integration', () => {
        it('should accept valid custom headers', () => {
            const result = validateWebhookHeaders({
                Authorization: 'Bearer token123',
                'X-Custom-Header': 'value',
            });
            expect(result.isValid).toBe(true);
        });

        it('should accept empty headers object', () => {
            const result = validateWebhookHeaders({});
            expect(result.isValid).toBe(true);
        });

        it('should reject forbidden headers - host', () => {
            const result = validateWebhookHeaders({ Host: 'evil.com' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('not allowed');
        });

        it('should reject forbidden headers - cookie', () => {
            const result = validateWebhookHeaders({ Cookie: 'session=abc' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('not allowed');
        });

        it('should reject forbidden headers - set-cookie', () => {
            const result = validateWebhookHeaders({ 'Set-Cookie': 'session=abc' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('not allowed');
        });

        it('should reject forbidden headers - content-length', () => {
            const result = validateWebhookHeaders({ 'Content-Length': '100' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('not allowed');
        });

        it('should reject forbidden headers - transfer-encoding', () => {
            const result = validateWebhookHeaders({ 'Transfer-Encoding': 'chunked' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('not allowed');
        });

        it('should reject forbidden headers - connection', () => {
            const result = validateWebhookHeaders({ Connection: 'keep-alive' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('not allowed');
        });

        it('should reject forbidden headers - proxy-authorization', () => {
            const result = validateWebhookHeaders({ 'Proxy-Authorization': 'Basic abc' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('not allowed');
        });

        it('should reject headers with newline characters in key', () => {
            const result = validateWebhookHeaders({ 'X-Bad\nHeader': 'value' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('newline');
        });

        it('should reject headers with newline characters in value', () => {
            const result = validateWebhookHeaders({ 'X-Header': 'bad\r\nvalue' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('newline');
        });

        it('should reject too many headers', () => {
            const manyHeaders: Record<string, string> = {};
            for (let i = 0; i < 21; i++) {
                manyHeaders[`X-Header-${i}`] = `value-${i}`;
            }
            const result = validateWebhookHeaders(manyHeaders);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Too many headers');
        });

        it('should accept up to 20 headers', () => {
            const headers: Record<string, string> = {};
            for (let i = 0; i < 20; i++) {
                headers[`X-Header-${i}`] = `value-${i}`;
            }
            const result = validateWebhookHeaders(headers);
            expect(result.isValid).toBe(true);
        });

        it('should reject header keys that are too long', () => {
            const longKey = 'X-' + 'a'.repeat(256);
            const result = validateWebhookHeaders({ [longKey]: 'value' });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('too long');
        });

        it('should reject header values that are too long', () => {
            const longValue = 'a'.repeat(8193);
            const result = validateWebhookHeaders({ 'X-Header': longValue });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('too long');
        });
    });

    describe('Service function exports', () => {
        it('should export all expected functions', async () => {
            const service = await import('./webhookService');
            expect(typeof service.getWebhooks).toBe('function');
            expect(typeof service.getWebhooksByStatus).toBe('function');
            expect(typeof service.getWebhookById).toBe('function');
            expect(typeof service.createWebhook).toBe('function');
            expect(typeof service.updateWebhook).toBe('function');
            expect(typeof service.deleteWebhook).toBe('function');
            expect(typeof service.activateWebhook).toBe('function');
            expect(typeof service.deactivateWebhook).toBe('function');
            expect(typeof service.getWebhookDeliveries).toBe('function');
            expect(typeof service.getRecentDeliveries).toBe('function');
            expect(typeof service.testWebhook).toBe('function');
        });
    });

    describe('createWebhook validation', () => {
        it('should reject invalid URLs during creation', async () => {
            const { createWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {});

            await expect(
                createWebhook(
                    {
                        name: 'Test Webhook',
                        url: 'not-a-url',
                        method: 'POST',
                        events: ['batch.started'],
                    },
                    'user-1',
                    'SUPER_ADMIN',
                ),
            ).rejects.toThrow('Invalid URL format');
        });

        it('should reject empty webhook name', async () => {
            const { createWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {});

            await expect(
                createWebhook(
                    {
                        name: '',
                        url: 'https://api.example.com/hook',
                        method: 'POST',
                        events: ['batch.started'],
                    },
                    'user-1',
                    'SUPER_ADMIN',
                ),
            ).rejects.toThrow('Webhook name must be at least 2 characters');
        });

        it('should reject single character webhook name', async () => {
            const { createWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {});

            await expect(
                createWebhook(
                    {
                        name: 'A',
                        url: 'https://api.example.com/hook',
                        method: 'POST',
                        events: ['batch.started'],
                    },
                    'user-1',
                    'SUPER_ADMIN',
                ),
            ).rejects.toThrow('Webhook name must be at least 2 characters');
        });

        it('should reject empty events array', async () => {
            const { createWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {});

            await expect(
                createWebhook(
                    {
                        name: 'Test Webhook',
                        url: 'https://api.example.com/hook',
                        method: 'POST',
                        events: [],
                    },
                    'user-1',
                    'SUPER_ADMIN',
                ),
            ).rejects.toThrow('At least one event must be selected');
        });

        it('should reject invalid headers during creation', async () => {
            const { createWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {});

            await expect(
                createWebhook(
                    {
                        name: 'Test Webhook',
                        url: 'https://api.example.com/hook',
                        method: 'POST',
                        events: ['batch.started'],
                        headers: { Host: 'evil.com' },
                    },
                    'user-1',
                    'SUPER_ADMIN',
                ),
            ).rejects.toThrow(/not allowed/);
        });

        it('should require authorization for creating webhooks', async () => {
            const { createWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {
                throw new Error('Authentication required');
            });

            await expect(
                createWebhook(
                    {
                        name: 'Test Webhook',
                        url: 'https://api.example.com/hook',
                        method: 'POST',
                        events: ['batch.started'],
                    },
                    'user-1',
                    undefined,
                ),
            ).rejects.toThrow('Authentication required');

            expect(assertAuthorized).toHaveBeenCalledWith(undefined, 'webhooks:manage');
        });

        it('should reject localhost URLs during creation', async () => {
            const { createWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {});

            await expect(
                createWebhook(
                    {
                        name: 'Test Webhook',
                        url: 'http://localhost:3000/hook',
                        method: 'POST',
                        events: ['batch.started'],
                    },
                    'user-1',
                    'SUPER_ADMIN',
                ),
            ).rejects.toThrow('URL cannot point to localhost');
        });
    });

    describe('updateWebhook validation', () => {
        it('should reject invalid URLs during update', async () => {
            const { updateWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {});

            await expect(
                updateWebhook('wh_123', { url: 'ftp://invalid-protocol.com' }, 'user-1', 'SUPER_ADMIN'),
            ).rejects.toThrow('URL must use http or https protocol');
        });

        it('should reject invalid headers during update', async () => {
            const { updateWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {});

            await expect(
                updateWebhook('wh_123', { headers: { Cookie: 'session=abc' } }, 'user-1', 'SUPER_ADMIN'),
            ).rejects.toThrow(/not allowed/);
        });

        it('should require authorization for updating webhooks', async () => {
            const { updateWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {
                throw new Error("Unauthorized: role 'VIEWER' cannot perform 'webhooks:manage'");
            });

            await expect(updateWebhook('wh_123', { name: 'Updated Name' }, 'user-1', 'VIEWER')).rejects.toThrow(
                "Unauthorized: role 'VIEWER' cannot perform 'webhooks:manage'",
            );

            expect(assertAuthorized).toHaveBeenCalledWith('VIEWER', 'webhooks:manage');
        });
    });

    describe('deleteWebhook validation', () => {
        it('should require authorization for deleting webhooks', async () => {
            const { deleteWebhook } = await import('./webhookService');
            const { assertAuthorized } = await import('../../../lib/authorization');
            vi.mocked(assertAuthorized).mockImplementation(() => {
                throw new Error('Authentication required');
            });

            await expect(deleteWebhook('wh_123', undefined)).rejects.toThrow('Authentication required');

            expect(assertAuthorized).toHaveBeenCalledWith(undefined, 'webhooks:manage');
        });
    });
});
