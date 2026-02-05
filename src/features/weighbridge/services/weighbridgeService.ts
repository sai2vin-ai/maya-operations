// Weighbridge Service
// Handles weighbridge entries for raw material IN and finished goods OUT

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { recordTransaction } from '../../inventory/services/inventoryService';
import type { WeighbridgeEntry, WeighbridgeEntryType, WeighbridgeEntryStatus } from '../types';
import { getTimestampMillis, type FirestoreDocData } from '../../../types';

const WEIGHBRIDGE_COLLECTION = 'weighbridgeEntries';

// Generate entry number like WB-2026-00001
async function generateEntryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `WB-${year}`;

    const entriesRef = collection(db, WEIGHBRIDGE_COLLECTION);
    const snapshot = await getDocs(entriesRef);

    let maxNumber = 0;
    snapshot.docs.forEach(doc => {
        const entry = doc.data() as WeighbridgeEntry;
        if (entry.entryNumber && entry.entryNumber.startsWith(prefix)) {
            const num = parseInt(entry.entryNumber.split('-')[2]) || 0;
            if (num > maxNumber) maxNumber = num;
        }
    });

    return `${prefix}-${String(maxNumber + 1).padStart(5, '0')}`;
}

// Get all weighbridge entries
export async function getWeighbridgeEntries(limitCount: number = 50): Promise<WeighbridgeEntry[]> {
    const entriesRef = collection(db, WEIGHBRIDGE_COLLECTION);
    const q = query(entriesRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as WeighbridgeEntry[];
}

// Get entries by type (RM_IN or FG_OUT)
export async function getWeighbridgeEntriesByType(entryType: WeighbridgeEntryType): Promise<WeighbridgeEntry[]> {
    const entriesRef = collection(db, WEIGHBRIDGE_COLLECTION);
    const q = query(entriesRef, where('entryType', '==', entryType));
    const snapshot = await getDocs(q);

    const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as WeighbridgeEntry[];

    // Sort in-memory by createdAt desc
    return entries.sort((a, b) => {
        const aTime = getTimestampMillis(a.createdAt);
        const bTime = getTimestampMillis(b.createdAt);
        return bTime - aTime;
    });
}

// Get pending entries (awaiting second weight)
export async function getPendingEntries(): Promise<WeighbridgeEntry[]> {
    const entriesRef = collection(db, WEIGHBRIDGE_COLLECTION);
    const q = query(entriesRef, where('status', 'in', ['PENDING', 'FIRST_WEIGHT']));
    const snapshot = await getDocs(q);

    const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as WeighbridgeEntry[];

    return entries.sort((a, b) => {
        const aTime = getTimestampMillis(a.createdAt);
        const bTime = getTimestampMillis(b.createdAt);
        return bTime - aTime;
    });
}

// Get entry by ID
export async function getWeighbridgeEntryById(entryId: string): Promise<WeighbridgeEntry | null> {
    const entryRef = doc(db, WEIGHBRIDGE_COLLECTION, entryId);
    const snapshot = await getDoc(entryRef);

    if (!snapshot.exists()) return null;

    return { id: snapshot.id, ...snapshot.data() } as WeighbridgeEntry;
}

// Create weighbridge entry data
export interface CreateWeighbridgeEntryData {
    entryType: WeighbridgeEntryType;
    vehicleNumber: string;
    driverName?: string;
    driverPhone?: string;
    partyName?: string;
    inventoryItemId?: string;
    materialName?: string;
    unit: 'KG' | 'TONS' | 'KL';
    notes?: string;
}

// Create new weighbridge entry
export async function createWeighbridgeEntry(
    data: CreateWeighbridgeEntryData,
    createdBy: string
): Promise<string> {
    const entryNumber = await generateEntryNumber();

    const entryData = {
        entryNumber,
        entryType: data.entryType,
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
        partyName: data.partyName || null,
        inventoryItemId: data.inventoryItemId || null,
        materialName: data.materialName || null,
        grossWeight: null,
        tareWeight: null,
        netWeight: null,
        unit: data.unit,
        firstWeightTime: null,
        secondWeightTime: null,
        status: 'PENDING' as WeighbridgeEntryStatus,
        notes: data.notes || null,
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    const entriesRef = collection(db, WEIGHBRIDGE_COLLECTION);
    const docRef = await addDoc(entriesRef, entryData);

    return docRef.id;
}

// Record first weight (gross or tare depending on flow)
export interface RecordFirstWeightData {
    weight: number;
    isGross: boolean;  // true = gross weight first (loaded truck), false = tare first (empty truck)
}

export async function recordFirstWeight(
    entryId: string,
    data: RecordFirstWeightData,
    updatedBy: string
): Promise<void> {
    const entryRef = doc(db, WEIGHBRIDGE_COLLECTION, entryId);

    const updateData: FirestoreDocData = {
        status: 'FIRST_WEIGHT',
        firstWeightTime: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    if (data.isGross) {
        updateData.grossWeight = data.weight;
    } else {
        updateData.tareWeight = data.weight;
    }

    await updateDoc(entryRef, updateData as Record<string, unknown>);
}

// Record second weight and complete entry
export interface RecordSecondWeightData {
    weight: number;
    isGross: boolean;  // true = gross weight, false = tare weight
}

export async function recordSecondWeightAndComplete(
    entryId: string,
    data: RecordSecondWeightData,
    updatedBy: string
): Promise<void> {
    const entryRef = doc(db, WEIGHBRIDGE_COLLECTION, entryId);
    const entry = await getWeighbridgeEntryById(entryId);

    if (!entry) throw new Error('Weighbridge entry not found');

    let grossWeight: number;
    let tareWeight: number;

    if (data.isGross) {
        grossWeight = data.weight;
        tareWeight = entry.tareWeight || 0;
    } else {
        grossWeight = entry.grossWeight || 0;
        tareWeight = data.weight;
    }

    const netWeight = Math.abs(grossWeight - tareWeight);

    const updateData: FirestoreDocData = {
        grossWeight,
        tareWeight,
        netWeight,
        status: 'COMPLETED',
        secondWeightTime: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    if (data.isGross) {
        updateData.grossWeight = data.weight;
    } else {
        updateData.tareWeight = data.weight;
    }

    await updateDoc(entryRef, updateData as Record<string, unknown>);

    // Update inventory if linked to an inventory item
    if (entry.inventoryItemId) {
        // Convert weight to the correct unit if needed
        let quantityInKg = netWeight;
        if (entry.unit === 'TONS') {
            quantityInKg = netWeight * 1000;
        } else if (entry.unit === 'KL') {
            // For liquids, assume 1 KL ≈ 1000 KG (approximate)
            quantityInKg = netWeight * 1000;
        }

        try {
            if (entry.entryType === 'RM_IN') {
                // Raw material coming IN = RECEIPT to inventory
                await recordTransaction({
                    itemId: entry.inventoryItemId,
                    transactionType: 'RECEIPT',
                    quantity: quantityInKg,
                    referenceType: 'GATE_ENTRY',  // Reusing existing reference type
                    referenceId: entryId,
                    reason: `Weighbridge IN: ${entry.entryNumber}`,
                }, updatedBy);
            } else if (entry.entryType === 'FG_OUT') {
                // Finished goods going OUT = ISSUE from inventory
                await recordTransaction({
                    itemId: entry.inventoryItemId,
                    transactionType: 'ISSUE',
                    quantity: quantityInKg,
                    referenceType: 'GATE_ENTRY',
                    referenceId: entryId,
                    reason: `Weighbridge OUT: ${entry.entryNumber}`,
                }, updatedBy);
            }
        } catch (err) {
            console.error('Failed to update inventory:', err);
            // Don't throw - the weighbridge entry is still completed
        }
    }
}

// Cancel entry
export async function cancelWeighbridgeEntry(
    entryId: string,
    updatedBy: string
): Promise<void> {
    const entryRef = doc(db, WEIGHBRIDGE_COLLECTION, entryId);

    await updateDoc(entryRef, {
        status: 'CANCELLED',
        updatedAt: Timestamp.now(),
        updatedBy,
    });
}

// Get today's entries
export async function getTodayEntries(): Promise<WeighbridgeEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = Timestamp.fromDate(today);

    const entriesRef = collection(db, WEIGHBRIDGE_COLLECTION);
    const q = query(entriesRef, where('createdAt', '>=', todayStart));
    const snapshot = await getDocs(q);

    const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as WeighbridgeEntry[];

    return entries.sort((a, b) => {
        const aTime = getTimestampMillis(a.createdAt);
        const bTime = getTimestampMillis(b.createdAt);
        return bTime - aTime;
    });
}
