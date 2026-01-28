import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type { GateEntry, EntryType, MaterialCategory, GateEntryStatus } from '../types';

const GATE_ENTRIES_COLLECTION = 'gateEntries';

// Generate entry number like GE-2026-0001
async function generateEntryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `GE-${year}`;

    // Get the latest entry for this year
    const entriesRef = collection(db, GATE_ENTRIES_COLLECTION);
    const q = query(
        entriesRef,
        where('entryNumber', '>=', prefix),
        where('entryNumber', '<=', prefix + '\uf8ff'),
        orderBy('entryNumber', 'desc'),
        limit(1)
    );

    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastEntry = snapshot.docs[0].data() as GateEntry;
        const lastNumber = parseInt(lastEntry.entryNumber.split('-')[2]) || 0;
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

// Get all gate entries
export async function getGateEntries(limitCount: number = 50): Promise<GateEntry[]> {
    const entriesRef = collection(db, GATE_ENTRIES_COLLECTION);
    const q = query(entriesRef, orderBy('entryTime', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as GateEntry[];
}

// Get today's gate entries
export async function getTodaysEntries(): Promise<GateEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    const entriesRef = collection(db, GATE_ENTRIES_COLLECTION);
    const q = query(
        entriesRef,
        where('entryTime', '>=', todayTimestamp),
        orderBy('entryTime', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as GateEntry[];
}

// Get gate entry by ID
export async function getGateEntryById(entryId: string): Promise<GateEntry | null> {
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);
    const snapshot = await getDoc(entryRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as GateEntry;
}

// Get entries by status
export async function getEntriesByStatus(status: GateEntryStatus): Promise<GateEntry[]> {
    const entriesRef = collection(db, GATE_ENTRIES_COLLECTION);
    const q = query(entriesRef, where('status', '==', status), orderBy('entryTime', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as GateEntry[];
}

// Upload vehicle photo
export async function uploadVehiclePhoto(file: File, entryNumber: string): Promise<string> {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const path = `gate-entries/${entryNumber}/vehicle_${timestamp}.${extension}`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);

    return await getDownloadURL(storageRef);
}

// Capture photo from canvas/camera
export async function uploadPhotoFromBlob(blob: Blob, entryNumber: string, type: 'vehicle' | 'weighbridge'): Promise<string> {
    const timestamp = Date.now();
    const path = `gate-entries/${entryNumber}/${type}_${timestamp}.jpg`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    return await getDownloadURL(storageRef);
}

// Create gate entry
export interface CreateGateEntryData {
    entryType: EntryType;
    vehicleNumber: string;
    vehiclePhoto?: string;
    materialCategory?: MaterialCategory;
    quantity?: number;
    unit?: 'KG' | 'TONS' | 'PIECES';
    weighbridgeReading?: number;
    tareWeight?: number;
    supplierName?: string;
    driverName?: string;
    driverPhone?: string;
    purpose?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
}

export async function createGateEntry(data: CreateGateEntryData, createdBy: string): Promise<string> {
    const entryNumber = await generateEntryNumber();
    const entryId = entryNumber.replace(/-/g, '_');
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    // Calculate net weight if both readings available
    let netWeight: number | null = null;
    if (data.weighbridgeReading != null && data.tareWeight != null) {
        netWeight = data.weighbridgeReading - data.tareWeight;
    }

    // Build entry doc, only including defined values
    const entryDoc: Record<string, any> = {
        entryNumber,
        entryType: data.entryType,
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        status: 'PENDING',
        entryTime: Timestamp.now(),
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    // Only add optional fields if they have values
    if (data.vehiclePhoto) entryDoc.vehiclePhoto = data.vehiclePhoto;
    if (data.materialCategory) entryDoc.materialCategory = data.materialCategory;
    if (data.quantity != null) entryDoc.quantity = data.quantity;
    if (data.unit) entryDoc.unit = data.unit;
    if (data.weighbridgeReading != null) entryDoc.weighbridgeReading = data.weighbridgeReading;
    if (data.tareWeight != null) entryDoc.tareWeight = data.tareWeight;
    if (netWeight != null) entryDoc.netWeight = netWeight;
    if (data.supplierName) entryDoc.supplierName = data.supplierName;
    if (data.driverName) entryDoc.driverName = data.driverName;
    if (data.driverPhone) entryDoc.driverPhone = data.driverPhone;
    if (data.purpose) entryDoc.purpose = data.purpose;
    if (data.notes) entryDoc.notes = data.notes;
    if (data.latitude && data.longitude) {
        entryDoc.location = { latitude: data.latitude, longitude: data.longitude };
    }

    await setDoc(entryRef, entryDoc);
    return entryId;
}

// Update gate entry
export interface UpdateGateEntryData {
    vehiclePhoto?: string;
    materialCategory?: MaterialCategory;
    quantity?: number;
    unit?: 'KG' | 'TONS' | 'PIECES';
    weighbridgeReading?: number;
    tareWeight?: number;
    netWeight?: number;
    supplierName?: string;
    driverName?: string;
    driverPhone?: string;
    purpose?: string;
    notes?: string;
    status?: GateEntryStatus;
}

export async function updateGateEntry(
    entryId: string,
    data: UpdateGateEntryData,
    updatedBy: string
): Promise<void> {
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    // Build update object, only including defined values
    const updateData: Record<string, any> = {
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    // Only add fields that have values
    if (data.vehiclePhoto) updateData.vehiclePhoto = data.vehiclePhoto;
    if (data.materialCategory) updateData.materialCategory = data.materialCategory;
    if (data.quantity != null) updateData.quantity = data.quantity;
    if (data.unit) updateData.unit = data.unit;
    if (data.weighbridgeReading != null) updateData.weighbridgeReading = data.weighbridgeReading;
    if (data.tareWeight != null) updateData.tareWeight = data.tareWeight;
    if (data.supplierName) updateData.supplierName = data.supplierName;
    if (data.driverName) updateData.driverName = data.driverName;
    if (data.driverPhone) updateData.driverPhone = data.driverPhone;
    if (data.purpose) updateData.purpose = data.purpose;
    if (data.notes) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;

    // Calculate net weight if both readings available
    if (data.weighbridgeReading != null && data.tareWeight != null) {
        updateData.netWeight = data.weighbridgeReading - data.tareWeight;
    } else if (data.netWeight != null) {
        updateData.netWeight = data.netWeight;
    }

    await updateDoc(entryRef, updateData);
}

// Complete entry (mark exit)
export async function completeGateEntry(entryId: string, updatedBy: string): Promise<void> {
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    await updateDoc(entryRef, {
        status: 'COMPLETED',
        exitTime: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy,
    });
}

// Cancel entry
export async function cancelGateEntry(entryId: string, reason: string, updatedBy: string): Promise<void> {
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    await updateDoc(entryRef, {
        status: 'CANCELLED',
        notes: reason,
        updatedAt: Timestamp.now(),
        updatedBy,
    });
}

// Get today's entry count
export async function getTodaysEntryCount(): Promise<number> {
    const entries = await getTodaysEntries();
    return entries.length;
}

// Material categories for dropdown
export const MATERIAL_CATEGORIES: { value: MaterialCategory; label: string; unit: string }[] = [
    { value: 'TW-WHOLE', label: 'Whole Waste Tyres', unit: 'TONS' },
    { value: 'TW-SHRED', label: 'Pre-shredded Tyre Chips', unit: 'TONS' },
    { value: 'CB-STD', label: 'Carbon Black (Standard)', unit: 'KG' },
    { value: 'CB-HG', label: 'Carbon Black (High Grade)', unit: 'KG' },
    { value: 'PO-CRD', label: 'Pyrolysis Oil (Crude)', unit: 'KG' },
    { value: 'SW-MIX', label: 'Steel Wire (Mixed)', unit: 'KG' },
];

// Entry statuses for UI
export const ENTRY_STATUSES: { value: GateEntryStatus; label: string; color: string }[] = [
    { value: 'PENDING', label: 'Pending', color: 'yellow' },
    { value: 'COMPLETED', label: 'Completed', color: 'green' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
];
