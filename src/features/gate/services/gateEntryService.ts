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
import { db, storage } from '../../../lib/firebase';
import type { GateEntry, EntryType, MaterialCategory, GateEntryStatus } from '../types';
import type { FirestoreDocData } from '../../../types';
import { validateFile, generateSafeFilename, validateVehicleNumber, sanitizeString } from '../../../utils/validation';

const GATE_ENTRIES_COLLECTION = 'gateEntries';

// File upload configuration
const UPLOAD_CONFIG = {
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
};

/**
 * Generates a sequential gate entry number in the format GE-{year}-{serial}.
 * Queries existing entries for the current year to determine the next serial number.
 * @returns The next available entry number (e.g., "GE-2026-0001")
 */
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

/**
 * Fetches gate entries ordered by entry time, with an optional limit.
 * @param limitCount - Maximum number of entries to return (default: 50)
 * @returns Array of gate entries sorted newest first
 */
export async function getGateEntries(limitCount: number = 50): Promise<GateEntry[]> {
    const entriesRef = collection(db, GATE_ENTRIES_COLLECTION);
    const q = query(entriesRef, orderBy('entryTime', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as GateEntry[];
}

/** Fetches all gate entries created since midnight today. */
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

/**
 * Fetches a single gate entry by its document ID.
 * @param entryId - The Firestore document ID
 * @returns The gate entry object, or null if not found
 */
export async function getGateEntryById(entryId: string): Promise<GateEntry | null> {
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);
    const snapshot = await getDoc(entryRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as GateEntry;
}

/**
 * Fetches all gate entries matching a specific status.
 * @param status - The entry status to filter by (e.g., "PENDING", "COMPLETED")
 * @returns Array of matching gate entries sorted newest first
 */
export async function getEntriesByStatus(status: GateEntryStatus): Promise<GateEntry[]> {
    const entriesRef = collection(db, GATE_ENTRIES_COLLECTION);
    const q = query(entriesRef, where('status', '==', status), orderBy('entryTime', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as GateEntry[];
}

/**
 * Validates and uploads a vehicle photo to Firebase Storage.
 * @param file - The image file to upload
 * @param entryNumber - The gate entry number used for the storage path
 * @returns The download URL of the uploaded photo
 */
export async function uploadVehiclePhoto(file: File, entryNumber: string): Promise<string> {
    // Validate file before upload
    const validation = validateFile(file, UPLOAD_CONFIG);
    if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid file');
    }

    // Generate safe filename to prevent path traversal
    const safeFilename = generateSafeFilename(file.name, 'vehicle');
    const path = `gate-entries/${entryNumber}/${safeFilename}`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);

    return await getDownloadURL(storageRef);
}

/**
 * Validates and uploads a photo blob (e.g., from camera capture) to Firebase Storage.
 * @param blob - The image blob to upload
 * @param entryNumber - The gate entry number used for the storage path
 * @param type - Photo type label used in the filename ("vehicle" or "weighbridge")
 * @returns The download URL of the uploaded photo
 */
export async function uploadPhotoFromBlob(blob: Blob, entryNumber: string, type: 'vehicle' | 'weighbridge'): Promise<string> {
    // Validate blob size
    const maxSizeBytes = UPLOAD_CONFIG.maxSizeMB * 1024 * 1024;
    if (blob.size > maxSizeBytes) {
        throw new Error(`File size must be less than ${UPLOAD_CONFIG.maxSizeMB}MB`);
    }
    if (blob.size === 0) {
        throw new Error('File is empty');
    }

    // Validate MIME type
    if (!UPLOAD_CONFIG.allowedTypes.includes(blob.type)) {
        throw new Error(`File type not allowed. Allowed: ${UPLOAD_CONFIG.allowedTypes.join(', ')}`);
    }

    // Generate safe filename
    const safeFilename = generateSafeFilename(`${type}.jpg`, type);
    const path = `gate-entries/${entryNumber}/${safeFilename}`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    return await getDownloadURL(storageRef);
}

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

/**
 * Creates a new gate entry with an auto-generated entry number. Validates the vehicle
 * number, calculates net weight if weighbridge readings are provided, and sanitizes text fields.
 * @param data - Gate entry data including vehicle number, material info, and optional weights
 * @param createdBy - UID of the user creating the entry
 * @returns The newly created entry's document ID
 */
export async function createGateEntry(data: CreateGateEntryData, createdBy: string): Promise<string> {
    // Validate vehicle number
    const vehicleValidation = validateVehicleNumber(data.vehicleNumber);
    if (!vehicleValidation.isValid) {
        throw new Error(vehicleValidation.error || 'Invalid vehicle number');
    }

    const entryNumber = await generateEntryNumber();
    const entryId = entryNumber.replace(/-/g, '_');
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    // Calculate net weight if both readings available
    let netWeight: number | null = null;
    if (data.weighbridgeReading != null && data.tareWeight != null) {
        netWeight = data.weighbridgeReading - data.tareWeight;
    }

    // Build entry doc, only including defined values
    const entryDoc: FirestoreDocData = {
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
    if (data.supplierName) entryDoc.supplierName = sanitizeString(data.supplierName);
    if (data.driverName) entryDoc.driverName = sanitizeString(data.driverName);
    if (data.driverPhone) entryDoc.driverPhone = data.driverPhone;
    if (data.purpose) entryDoc.purpose = sanitizeString(data.purpose);
    if (data.notes) entryDoc.notes = sanitizeString(data.notes);
    if (data.latitude && data.longitude) {
        entryDoc.location = { latitude: data.latitude, longitude: data.longitude };
    }

    await setDoc(entryRef, entryDoc);
    return entryId;
}

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

/**
 * Updates an existing gate entry's fields. Recalculates net weight if weighbridge
 * readings are provided.
 * @param entryId - The document ID of the entry to update
 * @param data - Partial entry data to merge
 * @param updatedBy - UID of the user performing the update
 */
export async function updateGateEntry(
    entryId: string,
    data: UpdateGateEntryData,
    updatedBy: string
): Promise<void> {
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    // Build update object, only including defined values
    const updateData: FirestoreDocData = {
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

/**
 * Marks a gate entry as COMPLETED and records the exit timestamp.
 * @param entryId - The document ID of the entry to complete
 * @param updatedBy - UID of the user completing the entry
 */
export async function completeGateEntry(entryId: string, updatedBy: string): Promise<void> {
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    await updateDoc(entryRef, {
        status: 'COMPLETED',
        exitTime: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy,
    });
}

/**
 * Cancels a gate entry and records the cancellation reason in the notes field.
 * @param entryId - The document ID of the entry to cancel
 * @param reason - The reason for cancellation
 * @param updatedBy - UID of the user cancelling the entry
 */
export async function cancelGateEntry(entryId: string, reason: string, updatedBy: string): Promise<void> {
    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    await updateDoc(entryRef, {
        status: 'CANCELLED',
        notes: reason,
        updatedAt: Timestamp.now(),
        updatedBy,
    });
}

/** Returns the total number of gate entries created today. */
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
