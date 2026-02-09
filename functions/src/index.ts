/**
 * Firebase Cloud Functions for Pyrolysis Ops
 * Handles triggers, background tasks, and audit logging
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================
// AUDIT LOGGING
// ============================================

interface AuditLog {
    action: string;
    collection: string;
    documentId: string;
    userId?: string;
    data?: Record<string, unknown>;
    timestamp: admin.firestore.Timestamp;
}

async function createAuditLog(log: Omit<AuditLog, 'timestamp'>) {
    await db.collection('auditLogs').add({
        ...log,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}

// ============================================
// NOTIFICATIONS
// ============================================

interface NotificationData {
    type: 'info' | 'success' | 'warning' | 'alert';
    title: string;
    message: string;
    targetRoles: string[];
    entityType?: string;
    entityId?: string;
}

async function createNotification(data: NotificationData) {
    await db.collection('notifications').add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

// ============================================
// GATE ENTRY TRIGGERS
// ============================================

// Log gate entry creation
export const onGateEntryCreate = onDocumentCreated('gateEntries/{entryId}', async (event) => {
    const data = event.data?.data();

    await createAuditLog({
        action: 'GATE_ENTRY_CREATED',
        collection: 'gateEntries',
        documentId: event.params.entryId,
        userId: data?.createdBy,
        data: {
            entryNumber: data?.entryNumber,
            vehicleNumber: data?.vehicleNumber,
            entryType: data?.entryType,
        },
    });

    await createNotification({
        type: 'info',
        title: 'New Gate Entry',
        message: `Vehicle ${data?.vehicleNumber} (${data?.entryType}) — ${data?.entryNumber}`,
        targetRoles: ['GATE_OPERATOR', 'SHIFT_SUPERVISOR', 'PLANT_MANAGER', 'SUPER_ADMIN'],
        entityType: 'gateEntry',
        entityId: event.params.entryId,
    });
});

// Log gate entry status changes
export const onGateEntryUpdate = onDocumentUpdated('gateEntries/{entryId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (before?.status !== after?.status) {
        await createAuditLog({
            action: `GATE_ENTRY_${after?.status}`,
            collection: 'gateEntries',
            documentId: event.params.entryId,
            userId: after?.updatedBy,
            data: {
                entryNumber: after?.entryNumber,
                previousStatus: before?.status,
                newStatus: after?.status,
            },
        });
    }
});

// ============================================
// BATCH TRIGGERS
// ============================================

// Log batch creation
export const onBatchCreate = onDocumentCreated('batches/{batchId}', async (event) => {
    const data = event.data?.data();

    await createAuditLog({
        action: 'BATCH_CREATED',
        collection: 'batches',
        documentId: event.params.batchId,
        userId: data?.createdBy,
        data: {
            batchNumber: data?.batchNumber,
            reactorId: data?.reactorId,
            inputWeight: data?.inputWeight,
        },
    });

    await createNotification({
        type: 'info',
        title: 'New Batch Created',
        message: `Batch ${data?.batchNumber} started on reactor ${data?.reactorId}`,
        targetRoles: ['REACTOR_OPERATOR', 'SHIFT_SUPERVISOR', 'PLANT_MANAGER', 'SUPER_ADMIN'],
        entityType: 'batch',
        entityId: event.params.batchId,
    });
});

// Log batch status changes and step completions
export const onBatchUpdate = onDocumentUpdated('batches/{batchId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // Status change
    if (before?.status !== after?.status) {
        await createAuditLog({
            action: `BATCH_${after?.status}`,
            collection: 'batches',
            documentId: event.params.batchId,
            userId: after?.updatedBy,
            data: {
                batchNumber: after?.batchNumber,
                previousStatus: before?.status,
                newStatus: after?.status,
            },
        });

        if (after?.status === 'COMPLETED') {
            await createNotification({
                type: 'success',
                title: 'Batch Completed',
                message: `Batch ${after?.batchNumber} has been completed`,
                targetRoles: ['PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'SUPER_ADMIN'],
                entityType: 'batch',
                entityId: event.params.batchId,
            });
        } else if (after?.status === 'CANCELLED') {
            await createNotification({
                type: 'warning',
                title: 'Batch Cancelled',
                message: `Batch ${after?.batchNumber} has been cancelled`,
                targetRoles: ['PLANT_MANAGER', 'SUPER_ADMIN'],
                entityType: 'batch',
                entityId: event.params.batchId,
            });
        }
    }

    // Step completion
    if (before?.currentStep !== after?.currentStep) {
        await createAuditLog({
            action: 'BATCH_STEP_COMPLETED',
            collection: 'batches',
            documentId: event.params.batchId,
            userId: after?.updatedBy,
            data: {
                batchNumber: after?.batchNumber,
                step: after?.currentStep,
                totalSteps: after?.totalSteps,
            },
        });
    }
});

// ============================================
// USER TRIGGERS
// ============================================

// Log user creation
export const onUserCreate = onDocumentCreated('users/{userId}', async (event) => {
    const data = event.data?.data();

    await createAuditLog({
        action: 'USER_CREATED',
        collection: 'users',
        documentId: event.params.userId,
        userId: data?.createdBy,
        data: {
            email: data?.email,
            role: data?.role,
            name: data?.name,
        },
    });

    await createNotification({
        type: 'info',
        title: 'New User Added',
        message: `${data?.name} (${data?.role}) has been added to the system`,
        targetRoles: ['SUPER_ADMIN', 'PLANT_MANAGER'],
        entityType: 'user',
        entityId: event.params.userId,
    });
});

// Log user status/role changes
export const onUserUpdate = onDocumentUpdated('users/{userId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // Status change
    if (before?.status !== after?.status) {
        await createAuditLog({
            action: `USER_${after?.status}`,
            collection: 'users',
            documentId: event.params.userId,
            userId: after?.updatedBy,
            data: {
                email: after?.email,
                previousStatus: before?.status,
                newStatus: after?.status,
            },
        });
    }

    // Role change
    if (before?.role !== after?.role) {
        await createAuditLog({
            action: 'USER_ROLE_CHANGED',
            collection: 'users',
            documentId: event.params.userId,
            userId: after?.updatedBy,
            data: {
                email: after?.email,
                previousRole: before?.role,
                newRole: after?.role,
            },
        });
    }
});

// ============================================
// REACTOR TRIGGERS
// ============================================

// Log reactor status changes
export const onReactorUpdate = onDocumentUpdated('reactors/{reactorId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (before?.status !== after?.status) {
        await createAuditLog({
            action: `REACTOR_${after?.status}`,
            collection: 'reactors',
            documentId: event.params.reactorId,
            userId: after?.updatedBy,
            data: {
                reactorNumber: after?.reactorNumber,
                previousStatus: before?.status,
                newStatus: after?.status,
                currentBatchId: after?.currentBatchId,
            },
        });

        if (after?.status === 'MAINTENANCE' || after?.status === 'OFFLINE') {
            await createNotification({
                type: 'alert',
                title: `Reactor ${after?.status === 'MAINTENANCE' ? 'Under Maintenance' : 'Offline'}`,
                message: `Reactor ${after?.reactorNumber} is now ${after?.status}`,
                targetRoles: ['PLANT_MANAGER', 'MAINTENANCE_TECH', 'SUPER_ADMIN'],
                entityType: 'reactor',
                entityId: event.params.reactorId,
            });
        }
    }
});

// ============================================
// DEVICE TRIGGERS
// ============================================

// Log device revocation
export const onDeviceUpdate = onDocumentUpdated('devices/{deviceId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (before?.status !== after?.status && after?.status === 'REVOKED') {
        await createAuditLog({
            action: 'DEVICE_REVOKED',
            collection: 'devices',
            documentId: event.params.deviceId,
            userId: after?.updatedBy,
            data: {
                deviceId: after?.deviceId,
                deviceName: after?.deviceName,
                reason: after?.revokeReason,
            },
        });

        await createNotification({
            type: 'warning',
            title: 'Device Revoked',
            message: `Device ${after?.name || after?.deviceId} has been revoked`,
            targetRoles: ['SUPER_ADMIN'],
            entityType: 'device',
            entityId: event.params.deviceId,
        });
    }
});

// ============================================
// SCHEDULED FUNCTIONS
// ============================================

// Daily cleanup of old audit logs (keep 90 days)
export const cleanupOldAuditLogs = onSchedule('every day 02:00', async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    const oldLogs = await db.collection('auditLogs')
        .where('timestamp', '<', cutoffTimestamp)
        .limit(500)
        .get();

    const batch = db.batch();
    oldLogs.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${oldLogs.size} old audit logs`);
});

// Low Stock Alert - triggers when inventory item stock drops below minimum
export const onInventoryItemUpdate = onDocumentUpdated('inventoryItems/{itemId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const itemId = event.params.itemId;

    // Only alert if stock just crossed below minimum (was above, now at/below)
    if (before.currentStock > before.minimumStock && after.currentStock <= after.minimumStock) {
        await createNotification({
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${after.name || itemId} stock is at ${after.currentStock} (minimum: ${after.minimumStock})`,
            targetRoles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER'],
            entityType: 'inventory',
            entityId: itemId,
        });
    }

    // Critical alert when stock reaches zero
    if (before.currentStock > 0 && after.currentStock === 0) {
        await createNotification({
            type: 'alert',
            title: 'Out of Stock',
            message: `${after.name || itemId} is now out of stock!`,
            targetRoles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER'],
            entityType: 'inventory',
            entityId: itemId,
        });
    }

    await createAuditLog({
        action: 'INVENTORY_UPDATED',
        collection: 'inventoryItems',
        documentId: itemId,
        userId: after.updatedBy || undefined,
        data: {
            name: after.name,
            previousStock: before.currentStock,
            newStock: after.currentStock,
            minimumStock: after.minimumStock,
        },
    });
});

// Low Stock Alert for Spare Parts
export const onSparePartUpdate = onDocumentUpdated('spareParts/{partId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const partId = event.params.partId;

    if (before.currentStock > before.minimumStock && after.currentStock <= after.minimumStock) {
        await createNotification({
            type: 'warning',
            title: 'Spare Part Low Stock',
            message: `${after.name || after.partNumber || partId} stock is at ${after.currentStock} (minimum: ${after.minimumStock})`,
            targetRoles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER', 'MAINTENANCE_TECH'],
        });
    }
});

// Daily cleanup of old notifications (keep 30 days)
export const cleanupOldNotifications = onSchedule('every day 02:30', async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    const oldNotifications = await db.collection('notifications')
        .where('createdAt', '<', cutoffTimestamp)
        .limit(500)
        .get();

    const writeBatch = db.batch();
    for (const doc of oldNotifications.docs) {
        const readByDocs = await doc.ref.collection('readBy').get();
        readByDocs.docs.forEach((readDoc) => {
            writeBatch.delete(readDoc.ref);
        });
        writeBatch.delete(doc.ref);
    }

    await writeBatch.commit();
    console.log(`Deleted ${oldNotifications.size} old notifications`);
});

// Daily stats aggregation
export const dailyStatsAggregation = onSchedule('every day 00:05', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterdayTs = admin.firestore.Timestamp.fromDate(yesterday);
    const todayTs = admin.firestore.Timestamp.fromDate(today);

    // Count gate entries
    const gateEntries = await db.collection('gateEntries')
        .where('entryTime', '>=', yesterdayTs)
        .where('entryTime', '<', todayTs)
        .count()
        .get();

    // Count completed batches
    const completedBatches = await db.collection('batches')
        .where('endTime', '>=', yesterdayTs)
        .where('endTime', '<', todayTs)
        .where('status', '==', 'COMPLETED')
        .count()
        .get();

    // Save daily stats
    await db.collection('dailyStats').doc(yesterday.toISOString().split('T')[0]).set({
        date: yesterdayTs,
        gateEntriesCount: gateEntries.data().count,
        completedBatchesCount: completedBatches.data().count,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Daily stats saved for ${yesterday.toISOString().split('T')[0]}`);
});
