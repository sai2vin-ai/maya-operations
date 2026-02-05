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

// Get all reactors
export async function getReactors(): Promise<Reactor[]> {
    const reactorsRef = collection(db, REACTORS_COLLECTION);
    const snapshot = await getDocs(reactorsRef);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Reactor[];
}

// Get reactor by ID
export async function getReactorById(reactorId: string): Promise<Reactor | null> {
    const reactorRef = doc(db, REACTORS_COLLECTION, reactorId);
    const snapshot = await getDoc(reactorRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as Reactor;
}

// Get reactors by status
export async function getReactorsByStatus(status: ReactorStatus): Promise<Reactor[]> {
    const reactorsRef = collection(db, REACTORS_COLLECTION);
    const q = query(reactorsRef, where('status', '==', status));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Reactor[];
}

// Create reactor
export interface CreateReactorData {
    reactorNumber: string;
    name: string;
}

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

// Update reactor status
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

// Set reactor to maintenance
export async function setReactorMaintenance(reactorId: string, updatedBy: string): Promise<void> {
    await updateReactorStatus(reactorId, 'MAINTENANCE', undefined, updatedBy);
}

// Set reactor to idle
export async function setReactorIdle(reactorId: string, updatedBy: string): Promise<void> {
    await updateReactorStatus(reactorId, 'IDLE', undefined, updatedBy);
}

// Update reactor after batch completion
export async function incrementBatchCount(reactorId: string): Promise<void> {
    const reactor = await getReactorById(reactorId);
    if (reactor) {
        const reactorRef = doc(db, REACTORS_COLLECTION, reactorId);
        await updateDoc(reactorRef, {
            totalBatches: (reactor.totalBatches || 0) + 1,
            currentBatchId: null,
            status: 'IDLE',
            updatedAt: Timestamp.now(),
        });
    }
}

// Reactor statuses for UI
export const REACTOR_STATUSES: { value: ReactorStatus; label: string; color: string }[] = [
    { value: 'IDLE', label: 'Idle', color: 'gray' },
    { value: 'IN_BATCH', label: 'In Batch', color: 'green' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: 'yellow' },
    { value: 'OFFLINE', label: 'Offline', color: 'red' },
];

// Get status info
export function getReactorStatusInfo(status: ReactorStatus) {
    return REACTOR_STATUSES.find(s => s.value === status) || REACTOR_STATUSES[0];
}
