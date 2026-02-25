import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Webhook, WebhookDelivery, CreateWebhookData, UpdateWebhookData, WebhookStatus } from '../types';
import type { FirestoreDocData } from '../../../types';
import { parseDoc, parseDocs, webhookSchema, webhookDeliverySchema } from '../../../lib/schemas';
import { validateUrl, validateWebhookHeaders, sanitizeString } from '../../../utils/validation';
import { assertAuthorized } from '../../../lib/authorization';
import type { UserRole } from '../../../types';

const WEBHOOKS_COLLECTION = 'webhooks';
const WEBHOOK_DELIVERIES_COLLECTION = 'webhookDeliveries';

/**
 * Generate a unique webhook ID
 */
function generateWebhookId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `wh_${timestamp}_${randomPart}`;
}

/**
 * Get all webhooks
 */
export async function getWebhooks(): Promise<Webhook[]> {
    const webhooksRef = collection(db, WEBHOOKS_COLLECTION);
    const q = query(webhooksRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return parseDocs(webhookSchema, raw, 'getWebhooks') as Webhook[];
}

/**
 * Get webhooks by status
 */
export async function getWebhooksByStatus(status: WebhookStatus): Promise<Webhook[]> {
    const webhooksRef = collection(db, WEBHOOKS_COLLECTION);
    const q = query(webhooksRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return parseDocs(webhookSchema, raw, 'getWebhooksByStatus') as Webhook[];
}

/**
 * Get a webhook by ID
 */
export async function getWebhookById(webhookId: string): Promise<Webhook | null> {
    const webhookRef = doc(db, WEBHOOKS_COLLECTION, webhookId);
    const snapshot = await getDoc(webhookRef);

    if (!snapshot.exists()) {
        return null;
    }

    return parseDoc(webhookSchema, { id: snapshot.id, ...snapshot.data() }, 'getWebhookById') as Webhook;
}

/**
 * Create a new webhook
 */
export async function createWebhook(
    data: CreateWebhookData,
    createdBy: string,
    callerRole?: UserRole,
): Promise<string> {
    assertAuthorized(callerRole, 'webhooks:manage');

    const webhookId = generateWebhookId();
    const webhookRef = doc(db, WEBHOOKS_COLLECTION, webhookId);

    // Validate URL
    const urlValidation = validateUrl(data.url);
    if (!urlValidation.isValid) {
        throw new Error(urlValidation.error || 'Invalid webhook URL');
    }

    // Validate name
    const name = sanitizeString(data.name);
    if (!name || name.length < 2) {
        throw new Error('Webhook name must be at least 2 characters');
    }

    // Validate events
    if (!data.events || data.events.length === 0) {
        throw new Error('At least one event must be selected');
    }

    // Validate headers if provided
    if (data.headers && Object.keys(data.headers).length > 0) {
        const headerValidation = validateWebhookHeaders(data.headers);
        if (!headerValidation.isValid) {
            throw new Error(headerValidation.error || 'Invalid webhook headers');
        }
    }

    const webhookDoc: FirestoreDocData = {
        name,
        url: data.url.trim(),
        method: data.method,
        events: data.events,
        status: 'ACTIVE',
        retryCount: 0,
        maxRetries: 3,
        successCount: 0,
        failureCount: 0,
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    // Add optional fields
    if (data.description) webhookDoc.description = sanitizeString(data.description);
    if (data.headers && Object.keys(data.headers).length > 0) {
        webhookDoc.headers = data.headers;
    }
    if (data.secret) webhookDoc.secret = data.secret;

    await setDoc(webhookRef, webhookDoc);
    return webhookId;
}

/**
 * Update a webhook
 */
export async function updateWebhook(
    webhookId: string,
    data: UpdateWebhookData,
    updatedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'webhooks:manage');

    const webhookRef = doc(db, WEBHOOKS_COLLECTION, webhookId);

    // Validate URL if being updated
    if (data.url) {
        const urlValidation = validateUrl(data.url);
        if (!urlValidation.isValid) {
            throw new Error(urlValidation.error || 'Invalid webhook URL');
        }
    }

    // Validate headers if being updated
    if (data.headers && Object.keys(data.headers).length > 0) {
        const headerValidation = validateWebhookHeaders(data.headers);
        if (!headerValidation.isValid) {
            throw new Error(headerValidation.error || 'Invalid webhook headers');
        }
    }

    const updateData: FirestoreDocData = {
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    // Add fields that are being updated
    if (data.name) updateData.name = sanitizeString(data.name);
    if (data.description !== undefined)
        updateData.description = data.description ? sanitizeString(data.description) : null;
    if (data.url) updateData.url = data.url.trim();
    if (data.method) updateData.method = data.method;
    if (data.events) updateData.events = data.events;
    if (data.headers !== undefined) updateData.headers = data.headers;
    if (data.secret !== undefined) updateData.secret = data.secret;
    if (data.status) updateData.status = data.status;

    await updateDoc(webhookRef, updateData);
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string, callerRole?: UserRole): Promise<void> {
    assertAuthorized(callerRole, 'webhooks:manage');

    const webhookRef = doc(db, WEBHOOKS_COLLECTION, webhookId);
    await deleteDoc(webhookRef);
}

/**
 * Activate a webhook
 */
export async function activateWebhook(webhookId: string, updatedBy: string, callerRole?: UserRole): Promise<void> {
    await updateWebhook(webhookId, { status: 'ACTIVE' }, updatedBy, callerRole);
}

/**
 * Deactivate a webhook
 */
export async function deactivateWebhook(webhookId: string, updatedBy: string, callerRole?: UserRole): Promise<void> {
    await updateWebhook(webhookId, { status: 'INACTIVE' }, updatedBy, callerRole);
}

/**
 * Get webhook delivery logs
 */
export async function getWebhookDeliveries(webhookId: string, limitCount: number = 50): Promise<WebhookDelivery[]> {
    const deliveriesRef = collection(db, WEBHOOK_DELIVERIES_COLLECTION);
    const q = query(
        deliveriesRef,
        where('webhookId', '==', webhookId),
        orderBy('triggeredAt', 'desc'),
        limit(limitCount),
    );
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return parseDocs(webhookDeliverySchema, raw, 'getWebhookDeliveries') as WebhookDelivery[];
}

/**
 * Get recent webhook deliveries across all webhooks
 */
export async function getRecentDeliveries(limitCount: number = 50): Promise<WebhookDelivery[]> {
    const deliveriesRef = collection(db, WEBHOOK_DELIVERIES_COLLECTION);
    const q = query(deliveriesRef, orderBy('triggeredAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return parseDocs(webhookDeliverySchema, raw, 'getRecentDeliveries') as WebhookDelivery[];
}

/**
 * Test a webhook by sending a test payload
 */
export async function testWebhook(webhookId: string): Promise<{
    success: boolean;
    responseCode?: number;
    responseBody?: string;
    error?: string;
    duration?: number;
}> {
    const webhook = await getWebhookById(webhookId);
    if (!webhook) {
        return { success: false, error: 'Webhook not found' };
    }

    const testPayload = {
        event: 'webhook.test',
        webhookId: webhook.id,
        webhookName: webhook.name,
        timestamp: new Date().toISOString(),
        data: {
            message: 'This is a test webhook delivery',
        },
    };

    const startTime = performance.now();

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Webhook-Event': 'webhook.test',
            'X-Webhook-Delivery-Id': `test_${Date.now()}`,
            ...webhook.headers,
        };

        // Add signature if secret is configured
        if (webhook.secret) {
            headers['X-Webhook-Signature'] = await generateSignature(JSON.stringify(testPayload), webhook.secret);
        }

        const response = await fetch(webhook.url, {
            method: webhook.method,
            headers,
            body: JSON.stringify(testPayload),
        });

        const duration = performance.now() - startTime;
        const responseBody = await response.text();

        return {
            success: response.ok,
            responseCode: response.status,
            responseBody: responseBody.substring(0, 1000), // Limit response body
            duration: Math.round(duration),
        };
    } catch (error) {
        const duration = performance.now() - startTime;
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Math.round(duration),
        };
    }
}

/**
 * Generate HMAC signature for webhook payload
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const payloadData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
