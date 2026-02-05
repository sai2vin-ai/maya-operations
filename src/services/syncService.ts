/**
 * Sync Service
 * Handles syncing offline operations when back online
 */

import {
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
    getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
    initOfflineDB,
    getPendingOperations,
    updateOperationStatus,
    removeFromQueue,
    isOnline,
    setupNetworkListeners,
    type PendingOperation,
} from './offlineQueue';

// Sync state
let isSyncing = false;
let syncListeners: Array<(syncing: boolean, error?: string) => void> = [];

// Register sync state listener
export function onSyncStateChange(
    callback: (syncing: boolean, error?: string) => void
): () => void {
    syncListeners.push(callback);
    return () => {
        syncListeners = syncListeners.filter(cb => cb !== callback);
    };
}

// Notify listeners of sync state change
function notifySyncState(syncing: boolean, error?: string) {
    syncListeners.forEach(cb => cb(syncing, error));
}

// Process a single operation
async function processOperation(operation: PendingOperation): Promise<void> {
    const docRef = doc(db, operation.collection, operation.documentId);

    switch (operation.type) {
        case 'CREATE': {
            // Check if document already exists (conflict resolution)
            const existingDoc = await getDoc(docRef);
            if (existingDoc.exists()) {
                // Merge strategy: newer timestamp wins
                const existingData = existingDoc.data();
                const existingTimestamp = existingData.updatedAt?.toMillis?.() || 0;
                const operationTimestamp = operation.timestamp;

                if (operationTimestamp > existingTimestamp) {
                    // Our data is newer, overwrite
                    await setDoc(docRef, {
                        ...operation.data,
                        updatedAt: Timestamp.fromMillis(operation.timestamp),
                        syncedAt: Timestamp.now(),
                    });
                }
                // If existing is newer, just remove from queue (already synced)
            } else {
                // Document doesn't exist, create it
                await setDoc(docRef, {
                    ...operation.data,
                    syncedAt: Timestamp.now(),
                });
            }
            break;
        }

        case 'UPDATE': {
            // Check if document still exists
            const docToUpdate = await getDoc(docRef);
            if (docToUpdate.exists()) {
                const existingData = docToUpdate.data();
                const existingTimestamp = existingData.updatedAt?.toMillis?.() || 0;
                const operationTimestamp = operation.timestamp;

                if (operationTimestamp >= existingTimestamp) {
                    // Our update is newer or same time, apply it
                    await updateDoc(docRef, {
                        ...operation.data,
                        updatedAt: Timestamp.fromMillis(operation.timestamp),
                        syncedAt: Timestamp.now(),
                    });
                }
                // If existing is newer, skip (already updated by someone else)
            }
            break;
        }

        case 'DELETE': {
            // Check if document exists before deleting
            const docToDelete = await getDoc(docRef);
            if (docToDelete.exists()) {
                await deleteDoc(docRef);
            }
            break;
        }
    }
}

// Sync all pending operations
export async function syncPendingOperations(): Promise<{
    synced: number;
    failed: number;
}> {
    if (!isOnline()) {
        console.log('Offline, skipping sync');
        return { synced: 0, failed: 0 };
    }

    if (isSyncing) {
        console.log('Already syncing, skipping');
        return { synced: 0, failed: 0 };
    }

    isSyncing = true;
    notifySyncState(true);

    let synced = 0;
    let failed = 0;

    try {
        const operations = await getPendingOperations();
        console.log(`Syncing ${operations.length} pending operations...`);

        // Sort by timestamp (oldest first)
        operations.sort((a, b) => a.timestamp - b.timestamp);

        for (const operation of operations) {
            if (!isOnline()) {
                console.log('Went offline during sync, stopping');
                break;
            }

            try {
                await updateOperationStatus(operation.id, 'SYNCING');
                await processOperation(operation);
                await removeFromQueue(operation.id);
                synced++;
                console.log(`Synced operation: ${operation.id}`);
            } catch (error) {
                console.error(`Failed to sync operation ${operation.id}:`, error);
                await updateOperationStatus(operation.id, 'FAILED', error instanceof Error ? error.message : 'Unknown error');
                failed++;
            }
        }

        console.log(`Sync complete: ${synced} synced, ${failed} failed`);
        return { synced, failed };
    } finally {
        isSyncing = false;
        notifySyncState(false);
    }
}

// Auto-sync on reconnect
let cleanupNetworkListeners: (() => void) | null = null;

export async function initSyncService(): Promise<void> {
    // Initialize IndexedDB
    await initOfflineDB();

    // Setup network listeners
    cleanupNetworkListeners = setupNetworkListeners(
        // On online
        async () => {
            console.log('Network restored, starting sync...');
            const result = await syncPendingOperations();
            if (result.synced > 0 || result.failed > 0) {
                notifySyncState(false, result.failed > 0 ? 'Some operations failed to sync' : undefined);
            }
        },
        // On offline
        () => {
            console.log('Network lost, operations will be queued');
        }
    );

    // Initial sync if online
    if (isOnline()) {
        syncPendingOperations();
    }
}

// Cleanup
export function destroySyncService(): void {
    if (cleanupNetworkListeners) {
        cleanupNetworkListeners();
        cleanupNetworkListeners = null;
    }
    syncListeners = [];
}

// Get sync status
export function getSyncStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
} {
    return {
        isOnline: isOnline(),
        isSyncing,
    };
}
