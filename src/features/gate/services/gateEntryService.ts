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
import type { GateEntry, EntryType, VehicleType, MaterialCategory, GateEntryStatus } from '../types';
import type { FirestoreDocData, UserRole } from '../../../types';
import { assertAuthorized } from '../../../lib/authorization';
import { validateFile, generateSafeFilename, validateVehicleNumber, sanitizeString } from '../../../utils/validation';
import { gateEntrySchema, parseDocs, parseDoc } from '../../../lib/schemas';

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
        limit(1),
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

    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(gateEntrySchema, raw, 'getGateEntries') as GateEntry[];
}

/** Fetches all gate entries created since midnight today. */
export async function getTodaysEntries(): Promise<GateEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    const entriesRef = collection(db, GATE_ENTRIES_COLLECTION);
    const q = query(entriesRef, where('entryTime', '>=', todayTimestamp), orderBy('entryTime', 'desc'));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(gateEntrySchema, raw, 'getTodaysEntries') as GateEntry[];
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

    return parseDoc(gateEntrySchema, { id: snapshot.id, ...snapshot.data() }, 'getGateEntryById') as GateEntry;
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

    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(gateEntrySchema, raw, 'getEntriesByStatus') as GateEntry[];
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
export async function uploadPhotoFromBlob(
    blob: Blob,
    entryNumber: string,
    type: 'vehicle' | 'weighbridge',
): Promise<string> {
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
    vehicleType?: VehicleType;
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
export async function createGateEntry(
    data: CreateGateEntryData,
    createdBy: string,
    callerRole?: UserRole,
): Promise<string> {
    assertAuthorized(callerRole, 'gate:create');

    // Validate vehicle number
    const vehicleValidation = validateVehicleNumber(data.vehicleNumber);
    if (!vehicleValidation.isValid) {
        throw new Error(vehicleValidation.error || 'Invalid vehicle number');
    }

    // Check for duplicate pending entries with same vehicle number
    const vehicleUpper = data.vehicleNumber.toUpperCase();
    const duplicateQuery = query(
        collection(db, GATE_ENTRIES_COLLECTION),
        where('vehicleNumber', '==', vehicleUpper),
        where('status', '==', 'PENDING'),
        limit(1),
    );
    const duplicateSnap = await getDocs(duplicateQuery);
    if (!duplicateSnap.empty) {
        const existing = duplicateSnap.docs[0].data() as GateEntry;
        throw new Error(`Vehicle ${vehicleUpper} already has a pending entry (${existing.entryNumber})`);
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
    if (data.vehicleType) entryDoc.vehicleType = data.vehicleType;
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
    updatedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'gate:update');

    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    // Build update object, only including defined values
    const updateData: FirestoreDocData = {
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    // Only add fields that have values (sanitize string inputs)
    if (data.vehiclePhoto) updateData.vehiclePhoto = data.vehiclePhoto;
    if (data.materialCategory) updateData.materialCategory = data.materialCategory;
    if (data.quantity != null) updateData.quantity = data.quantity;
    if (data.unit) updateData.unit = data.unit;
    if (data.weighbridgeReading != null) updateData.weighbridgeReading = data.weighbridgeReading;
    if (data.tareWeight != null) updateData.tareWeight = data.tareWeight;
    if (data.supplierName) updateData.supplierName = sanitizeString(data.supplierName);
    if (data.driverName) updateData.driverName = sanitizeString(data.driverName);
    if (data.driverPhone) updateData.driverPhone = data.driverPhone;
    if (data.purpose) updateData.purpose = sanitizeString(data.purpose);
    if (data.notes) updateData.notes = sanitizeString(data.notes);
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
export async function completeGateEntry(entryId: string, updatedBy: string, callerRole?: UserRole): Promise<void> {
    assertAuthorized(callerRole, 'gate:update');

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
export async function cancelGateEntry(
    entryId: string,
    reason: string,
    updatedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'gate:cancel');

    const entryRef = doc(db, GATE_ENTRIES_COLLECTION, entryId);

    // Preserve existing notes by appending cancellation reason
    const existing = await getGateEntryById(entryId);
    const existingNotes = existing?.notes ? `${existing.notes}\n` : '';

    await updateDoc(entryRef, {
        status: 'CANCELLED',
        notes: `${existingNotes}Cancelled: ${reason}`,
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

/**
 * Generate and print a gate pass for cargo vehicles exiting the campus.
 * Designed to be attached to the invoice carried by the vehicle.
 */
export function printGatePass(entry: GateEntry): void {
    const materialLabel =
        MATERIAL_CATEGORIES.find((m) => m.value === entry.materialCategory)?.label || entry.materialCategory || '-';

    const formatTimestamp = (ts: unknown) => {
        if (!ts) return '-';
        const t = ts as { toDate?: () => Date };
        const date = t.toDate ? t.toDate() : new Date(ts as string | number);
        return date.toLocaleString();
    };

    const html = `
        <!DOCTYPE html>
        <html><head><title>Gate Pass - ${entry.entryNumber}</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #333; max-width: 700px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { font-size: 22px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 2px; }
            .header h2 { font-size: 16px; margin: 0; color: #666; font-weight: normal; }
            .pass-title { text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; padding: 10px; background: #f0f0f0; border: 2px solid #333; text-transform: uppercase; letter-spacing: 3px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #ccc; margin-bottom: 20px; }
            .info-item { padding: 10px 15px; border-bottom: 1px solid #ccc; }
            .info-item:nth-child(even) { border-left: 1px solid #ccc; }
            .info-item label { display: block; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
            .info-item span { font-size: 15px; font-weight: 600; }
            .cargo-section { border: 2px solid #333; padding: 15px; margin-bottom: 20px; }
            .cargo-section h3 { margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
            .cargo-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
            .cargo-item label { display: block; font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 3px; }
            .cargo-item span { font-size: 18px; font-weight: 700; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 50px; }
            .sig-block { text-align: center; padding-top: 40px; border-top: 1px solid #333; }
            .sig-block label { font-size: 11px; color: #666; text-transform: uppercase; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #999; border-top: 1px solid #ccc; padding-top: 10px; }
            .pass-no { text-align: right; font-size: 12px; color: #666; margin-bottom: 5px; }
            @media print { body { padding: 15px; } }
        </style></head><body>
        <div class="header">
            <h1>Maya Recyclage</h1>
            <h2>Pyrolysis Operations — Plant Management</h2>
        </div>
        <div class="pass-no">Pass No: ${entry.entryNumber}</div>
        <div class="pass-title">Gate Pass — Outward</div>

        <div class="info-grid">
            <div class="info-item">
                <label>Vehicle Number</label>
                <span>${entry.vehicleNumber}</span>
            </div>
            <div class="info-item">
                <label>Driver Name</label>
                <span>${entry.driverName || '-'}</span>
            </div>
            <div class="info-item">
                <label>Supplier / Customer</label>
                <span>${entry.supplierName || '-'}</span>
            </div>
            <div class="info-item">
                <label>Driver Phone</label>
                <span>${entry.driverPhone || '-'}</span>
            </div>
            <div class="info-item">
                <label>Entry Time</label>
                <span>${formatTimestamp(entry.entryTime)}</span>
            </div>
            <div class="info-item">
                <label>Out Time</label>
                <span>${formatTimestamp(entry.exitTime)}</span>
            </div>
        </div>

        <div class="cargo-section">
            <h3>Cargo Details</h3>
            <div class="cargo-grid">
                <div class="cargo-item">
                    <label>Material</label>
                    <span>${materialLabel}</span>
                </div>
                <div class="cargo-item">
                    <label>Net Weight</label>
                    <span>${entry.netWeight != null ? entry.netWeight.toLocaleString() + ' ' + (entry.unit || 'KG') : '-'}</span>
                </div>
                <div class="cargo-item">
                    <label>Quantity</label>
                    <span>${entry.quantity != null ? entry.quantity + ' ' + (entry.unit || '') : '-'}</span>
                </div>
            </div>
            ${
                entry.weighbridgeReading != null || entry.tareWeight != null
                    ? `
            <div class="cargo-grid" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
                <div class="cargo-item">
                    <label>Gross Weight (kg)</label>
                    <span>${entry.weighbridgeReading != null ? entry.weighbridgeReading.toLocaleString() : '-'}</span>
                </div>
                <div class="cargo-item">
                    <label>Tare Weight (kg)</label>
                    <span>${entry.tareWeight != null ? entry.tareWeight.toLocaleString() : '-'}</span>
                </div>
                <div class="cargo-item"></div>
            </div>`
                    : ''
            }
        </div>

        ${entry.notes ? `<p style="font-size: 13px; color: #666;"><strong>Notes:</strong> ${entry.notes}</p>` : ''}

        <div class="signatures">
            <div class="sig-block"><label>Security / Gate</label></div>
            <div class="sig-block"><label>Store In-Charge</label></div>
            <div class="sig-block"><label>Authorized Signatory</label></div>
        </div>

        <div class="footer">
            Generated: ${new Date().toLocaleString()} | ${entry.entryNumber} | This is a system-generated gate pass
        </div>
        </body></html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }
}

// Vehicle types for UI
export const VEHICLE_TYPES: { value: VehicleType; label: string; description: string }[] = [
    { value: 'CARGO', label: 'Cargo Vehicle', description: 'Material transport vehicle' },
    { value: 'INTERNAL', label: 'Internal Vehicle', description: 'Company vehicle' },
    { value: 'VISITOR', label: 'Visitor', description: 'Visitor or guest vehicle' },
];

// Entry statuses for UI
export const ENTRY_STATUSES: { value: GateEntryStatus; label: string; color: string }[] = [
    { value: 'PENDING', label: 'Pending', color: 'yellow' },
    { value: 'COMPLETED', label: 'Completed', color: 'green' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
];
