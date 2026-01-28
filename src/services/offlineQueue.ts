/**
 * Offline Queue Service using IndexedDB
 * Stores pending operations when offline and syncs when online
 */

const DB_NAME = 'pyrolysis-ops-offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'pendingOperations';

export interface PendingOperation {
    id: string;
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    collection: string;
    documentId: string;
    data: Record<string, any>;
    timestamp: number;
    retryCount: number;
    status: 'PENDING' | 'SYNCING' | 'FAILED';
    error?: string;
}

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initOfflineDB(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open IndexedDB:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB initialized successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // Create pending operations store
            if (!database.objectStoreNames.contains(QUEUE_STORE)) {
                const store = database.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('collection', 'collection', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Generate unique ID
function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Add operation to queue
export async function addToQueue(
    type: PendingOperation['type'],
    collection: string,
    documentId: string,
    data: Record<string, any>
): Promise<string> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
        const tx = database.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);

        const operation: PendingOperation = {
            id: generateId(),
            type,
            collection,
            documentId,
            data,
            timestamp: Date.now(),
            retryCount: 0,
            status: 'PENDING',
        };

        const request = store.add(operation);

        request.onsuccess = () => {
            console.log('Operation added to queue:', operation.id);
            resolve(operation.id);
        };

        request.onerror = () => {
            console.error('Failed to add operation to queue:', request.error);
            reject(request.error);
        };
    });
}

// Get all pending operations
export async function getPendingOperations(): Promise<PendingOperation[]> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
        const tx = database.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const index = store.index('status');
        const request = index.getAll('PENDING');

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get all operations (for debugging)
export async function getAllOperations(): Promise<PendingOperation[]> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
        const tx = database.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Update operation status
export async function updateOperationStatus(
    operationId: string,
    status: PendingOperation['status'],
    error?: string
): Promise<void> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
        const tx = database.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const getRequest = store.get(operationId);

        getRequest.onsuccess = () => {
            const operation = getRequest.result as PendingOperation;
            if (!operation) {
                reject(new Error('Operation not found'));
                return;
            }

            operation.status = status;
            operation.retryCount += status === 'FAILED' ? 1 : 0;
            if (error) operation.error = error;

            const updateRequest = store.put(operation);

            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Remove operation from queue
export async function removeFromQueue(operationId: string): Promise<void> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
        const tx = database.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const request = store.delete(operationId);

        request.onsuccess = () => {
            console.log('Operation removed from queue:', operationId);
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Clear all completed/failed operations
export async function clearCompletedOperations(): Promise<void> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
        const tx = database.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                const operation = cursor.value as PendingOperation;
                // Keep failed operations with retry count < 3
                if (operation.status === 'FAILED' && operation.retryCount >= 3) {
                    cursor.delete();
                }
                cursor.continue();
            } else {
                resolve();
            }
        };

        request.onerror = () => reject(request.error);
    });
}

// Get queue stats
export async function getQueueStats(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
}> {
    const operations = await getAllOperations();

    return {
        pending: operations.filter(op => op.status === 'PENDING').length,
        syncing: operations.filter(op => op.status === 'SYNCING').length,
        failed: operations.filter(op => op.status === 'FAILED').length,
    };
}

// Check if online
export function isOnline(): boolean {
    return navigator.onLine;
}

// Listen for online/offline events
export function setupNetworkListeners(
    onOnline: () => void,
    onOffline: () => void
): () => void {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Return cleanup function
    return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
    };
}
