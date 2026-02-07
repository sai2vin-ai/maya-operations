import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Reactor, ReactorStatus } from '../types';
import type { FirestoreDocData } from '../../../types';

const REACTORS_COLLECTION = 'reactors';

/** Fetches all reactors from Firestore. */
export async function getReactors(): Promise<Reactor[]> {
    const reactorsRef = collection(db, REACTORS_COLLECTION);
    const snapshot = await getDocs(reactorsRef);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Reactor[];
}

/**
 * Fetches a single reactor by its document ID.
 * @param reactorId - The Firestore document ID
 * @returns The reactor object, or null if not found
 */
export async function getReactorById(reactorId: string): Promise<Reactor | null> {
    const reactorRef = doc(db, REACTORS_COLLECTION, reactorId);
    const snapshot = await getDoc(reactorRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as Reactor;
}

/**
 * Fetches all reactors matching a specific status.
 * @param status - The reactor status to filter by (e.g., "IDLE", "IN_BATCH")
 * @returns Array of reactors with the specified status
 */
export async function getReactorsByStatus(status: ReactorStatus): Promise<Reactor[]> {
    const reactorsRef = collection(db, REACTORS_COLLECTION);
    const q = query(reactorsRef, where('status', '==', status));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Reactor[];
}

export interface CreateReactorData {
    reactorNumber: string;
    name: string;
}

/**
 * Creates a new reactor document in Firestore with IDLE status and zero batch count.
 * @param data - Reactor data including reactor number and display name
 * @param createdBy - UID of the user creating the reactor
 * @returns The newly created reactor's document ID
 */
export async function createReactor(data: CreateReactorData, createdBy: string): Promise<string> {
    const reactorId = `reactor_${data.reactorNumber}`;
    const reactorRef = doc(db, REACTORS_COLLECTION, reactorId);

    const reactorDoc: Omit<Reactor, 'id'> = {
        reactorNumber: data.reactorNumber,
        name: data.name,
        status: 'IDLE',
        totalBatches: 0,
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    await setDoc(reactorRef, reactorDoc);
    return reactorId;
}

/**
 * Updates a reactor's operational status and optionally links it to a batch.
 * @param reactorId - The reactor document ID
 * @param status - The new reactor status
 * @param currentBatchId - Optional batch ID to associate with the reactor
 * @param updatedBy - Optional UID of the user performing the update
 */
export async function updateReactorStatus(
    reactorId: string,
    status: ReactorStatus,
    currentBatchId?: string,
    updatedBy?: string
): Promise<void> {
    const reactorRef = doc(db, REACTORS_COLLECTION, reactorId);

    const updateData: FirestoreDocData = {
        status,
        updatedAt: Timestamp.now(),
    };

    if (currentBatchId !== undefined) {
        updateData.currentBatchId = currentBatchId;
    }

    if (updatedBy) {
        updateData.updatedBy = updatedBy;
    }

    await updateDoc(reactorRef, updateData as Record<string, unknown>);
}

/** Sets a reactor's status to MAINTENANCE. */
export async function setReactorMaintenance(reactorId: string, updatedBy: string): Promise<void> {
    await updateReactorStatus(reactorId, 'MAINTENANCE', undefined, updatedBy);
}

/** Sets a reactor's status to IDLE. */
export async function setReactorIdle(reactorId: string, updatedBy: string): Promise<void> {
    await updateReactorStatus(reactorId, 'IDLE', undefined, updatedBy);
}

// Reactor statuses for UI
export const REACTOR_STATUSES: { value: ReactorStatus; label: string; color: string }[] = [
    { value: 'IDLE', label: 'Idle', color: 'gray' },
    { value: 'IN_BATCH', label: 'In Batch', color: 'green' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: 'yellow' },
    { value: 'OFFLINE', label: 'Offline', color: 'red' },
];

/**
 * Returns the display label and color for a reactor status.
 * @param status - The reactor status value
 * @returns Status info object with value, label, and color
 */
export function getReactorStatusInfo(status: ReactorStatus) {
    return REACTOR_STATUSES.find(s => s.value === status) || REACTOR_STATUSES[0];
}
