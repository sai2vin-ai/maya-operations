import type { Timestamp } from 'firebase/firestore';

/**
 * Webhook event types that can trigger webhook calls
 */
export type WebhookEventType =
    | 'gate_entry.created'
    | 'gate_entry.completed'
    | 'gate_entry.cancelled'
    | 'batch.started'
    | 'batch.completed'
    | 'batch.cancelled'
    | 'weighbridge.completed'
    | 'inventory.low_stock'
    | 'user.created'
    | 'user.status_changed';

/**
 * Webhook status
 */
export type WebhookStatus = 'ACTIVE' | 'INACTIVE' | 'FAILED';

/**
 * HTTP methods supported for webhooks
 */
export type WebhookMethod = 'POST' | 'PUT';

/**
 * Webhook configuration
 */
export interface Webhook {
    id: string;
    name: string;
    description?: string;
    url: string;
    method: WebhookMethod;
    events: WebhookEventType[];
    headers?: Record<string, string>;
    secret?: string;
    status: WebhookStatus;
    retryCount: number;
    maxRetries: number;
    lastTriggeredAt?: Timestamp;
    lastSuccessAt?: Timestamp;
    lastFailureAt?: Timestamp;
    lastError?: string;
    successCount: number;
    failureCount: number;
    createdAt: Timestamp;
    createdBy: string;
    updatedAt: Timestamp;
    updatedBy: string;
}

/**
 * Webhook delivery log entry
 */
export interface WebhookDelivery {
    id: string;
    webhookId: string;
    webhookName: string;
    event: WebhookEventType;
    payload: Record<string, unknown>;
    url: string;
    method: WebhookMethod;
    headers: Record<string, string>;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    responseCode?: number;
    responseBody?: string;
    error?: string;
    duration?: number;
    attemptNumber: number;
    triggeredAt: Timestamp;
    completedAt?: Timestamp;
}

/**
 * Webhook event labels for UI
 */
export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
    'gate_entry.created': 'Gate Entry Created',
    'gate_entry.completed': 'Gate Entry Completed',
    'gate_entry.cancelled': 'Gate Entry Cancelled',
    'batch.started': 'Batch Started',
    'batch.completed': 'Batch Completed',
    'batch.cancelled': 'Batch Cancelled',
    'weighbridge.completed': 'Weighbridge Entry Completed',
    'inventory.low_stock': 'Inventory Low Stock Alert',
    'user.created': 'User Created',
    'user.status_changed': 'User Status Changed',
};

/**
 * Webhook event categories for grouping in UI
 */
export const WEBHOOK_EVENT_CATEGORIES = {
    'Gate Operations': [
        'gate_entry.created',
        'gate_entry.completed',
        'gate_entry.cancelled',
    ],
    'Reactor Operations': [
        'batch.started',
        'batch.completed',
        'batch.cancelled',
    ],
    'Weighbridge': ['weighbridge.completed'],
    'Inventory': ['inventory.low_stock'],
    'User Management': ['user.created', 'user.status_changed'],
} as const;

/**
 * Create webhook input data
 */
export interface CreateWebhookData {
    name: string;
    description?: string;
    url: string;
    method: WebhookMethod;
    events: WebhookEventType[];
    headers?: Record<string, string>;
    secret?: string;
}

/**
 * Update webhook input data
 */
export interface UpdateWebhookData {
    name?: string;
    description?: string;
    url?: string;
    method?: WebhookMethod;
    events?: WebhookEventType[];
    headers?: Record<string, string>;
    secret?: string;
    status?: WebhookStatus;
}
