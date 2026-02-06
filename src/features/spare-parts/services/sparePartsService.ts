// Spare Parts Service
// Handles spare parts inventory management with part numbers, stock tracking, and issue/receipt transactions

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
    runTransaction,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { assertAuthorized } from '../../../lib/authorization';
import type { SparePart, SparePartTransaction, SparePartCategory, SparePartTransactionType } from '../types';
import { getTimestampMillis, type FirestoreDocData, type UserRole } from '../../../types';

const SPARE_PARTS_COLLECTION = 'spareParts';
const SPARE_PARTS_TRANSACTIONS_COLLECTION = 'sparePartTransactions';

// Spare part categories with labels
export const SPARE_PART_CATEGORIES: { value: SparePartCategory; label: string }[] = [
    { value: 'MOTOR', label: 'Motor' },
    { value: 'PUMP', label: 'Pump' },
    { value: 'VALVE', label: 'Valve' },
    { value: 'BEARING', label: 'Bearing' },
    { value: 'BELT', label: 'Belt' },
    { value: 'SEAL', label: 'Seal' },
    { value: 'ELECTRICAL', label: 'Electrical' },
    { value: 'HYDRAULIC', label: 'Hydraulic' },
    { value: 'PNEUMATIC', label: 'Pneumatic' },
    { value: 'GENERAL', label: 'General' },
];

// Common units for spare parts
export const SPARE_PART_UNITS = ['PCS', 'SET', 'MTR', 'KG', 'LTR', 'PAIR', 'BOX'];

// Generate part number using range query for efficiency
export async function generatePartNumber(category: SparePartCategory): Promise<string> {
    const prefix = category.substring(0, 3).toUpperCase();
    const partsRef = collection(db, SPARE_PARTS_COLLECTION);
    const q = query(
        partsRef,
        where('partNumber', '>=', prefix + '-'),
        where('partNumber', '<=', prefix + '-\uf8ff'),
        orderBy('partNumber', 'desc'),
        limit(1)
    );
    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastPart = snapshot.docs[0].data() as SparePart;
        const num = parseInt(lastPart.partNumber.split('-')[1]) || 0;
        nextNumber = num + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

// Get all spare parts
export async function getSpareParts(limitCount: number = 100): Promise<SparePart[]> {
    const partsRef = collection(db, SPARE_PARTS_COLLECTION);
    const q = query(partsRef, orderBy('partNumber', 'asc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SparePart[];
}

// Get spare parts by category - simplified to avoid composite index
export async function getSparePartsByCategory(category: SparePartCategory): Promise<SparePart[]> {
    const partsRef = collection(db, SPARE_PARTS_COLLECTION);
    const q = query(partsRef, where('category', '==', category));
    const snapshot = await getDocs(q);

    const parts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SparePart[];

    // Sort in-memory by partNumber
    return parts.sort((a, b) => a.partNumber.localeCompare(b.partNumber));
}

// Get single spare part
export async function getSparePartById(partId: string): Promise<SparePart | null> {
    const partRef = doc(db, SPARE_PARTS_COLLECTION, partId);
    const snapshot = await getDoc(partRef);

    if (!snapshot.exists()) return null;

    return { id: snapshot.id, ...snapshot.data() } as SparePart;
}

// Get low stock parts
export async function getLowStockParts(): Promise<SparePart[]> {
    const parts = await getSpareParts();
    return parts.filter(part => part.currentStock <= part.minimumStock);
}

// Create spare part data interface
export interface CreateSparePartData {
    partNumber?: string;      // Optional - auto-generate if not provided
    fileNumber?: string;
    name: string;
    description?: string;
    category: SparePartCategory;
    unit: string;
    currentStock: number;
    minimumStock: number;
    usedFor?: string;
    machineIds?: string[];
    location?: string;
    unitPrice?: number;
}

// Create new spare part
export async function createSparePart(
    data: CreateSparePartData,
    createdBy: string,
    callerRole?: UserRole
): Promise<string> {
    assertAuthorized(callerRole, 'spare_parts:create');
    const partNumber = data.partNumber || await generatePartNumber(data.category);

    const partData = {
        partNumber,
        fileNumber: data.fileNumber || null,
        name: data.name,
        description: data.description || null,
        category: data.category,
        unit: data.unit,
        currentStock: data.currentStock,
        minimumStock: data.minimumStock,
        usedFor: data.usedFor || null,
        machineIds: data.machineIds || [],
        location: data.location || null,
        unitPrice: data.unitPrice || null,
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    const partsRef = collection(db, SPARE_PARTS_COLLECTION);
    const docRef = await addDoc(partsRef, partData);

    // Record initial stock as receipt if > 0
    if (data.currentStock > 0) {
        await recordSparePartTransaction({
            partId: docRef.id,
            type: 'RECEIPT',
            quantity: data.currentStock,
            reason: 'Initial stock',
        }, createdBy);
    }

    return docRef.id;
}

// Update spare part data interface
export interface UpdateSparePartData {
    fileNumber?: string;
    name?: string;
    description?: string;
    category?: SparePartCategory;
    unit?: string;
    minimumStock?: number;
    usedFor?: string;
    machineIds?: string[];
    location?: string;
    unitPrice?: number;
}

// Update spare part
export async function updateSparePart(
    partId: string,
    data: UpdateSparePartData,
    updatedBy: string,
    callerRole?: UserRole
): Promise<void> {
    assertAuthorized(callerRole, 'spare_parts:update');
    const partRef = doc(db, SPARE_PARTS_COLLECTION, partId);

    const updateData: FirestoreDocData = {
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    if (data.fileNumber !== undefined) updateData.fileNumber = data.fileNumber || null;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.minimumStock !== undefined) updateData.minimumStock = data.minimumStock;
    if (data.usedFor !== undefined) updateData.usedFor = data.usedFor || null;
    if (data.machineIds !== undefined) updateData.machineIds = data.machineIds;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice || null;

    await updateDoc(partRef, updateData as Record<string, unknown>);
}

// Record transaction data interface
export interface RecordSparePartTransactionData {
    partId: string;
    type: SparePartTransactionType;
    quantity: number;
    machineId?: string;
    machineName?: string;
    reason?: string;
    issuedTo?: string;
}

// Record spare part transaction (receipt or issue)
export async function recordSparePartTransaction(
    data: RecordSparePartTransactionData,
    recordedBy: string,
    callerRole?: UserRole
): Promise<string> {
    assertAuthorized(callerRole, 'spare_parts:transact');
    return runTransaction(db, async (transaction) => {
        const partRef = doc(db, SPARE_PARTS_COLLECTION, data.partId);
        const partSnap = await transaction.get(partRef);

        if (!partSnap.exists()) {
            throw new Error('Spare part not found');
        }

        const part = partSnap.data() as SparePart;

        // Calculate new stock
        let newStock: number;
        if (data.type === 'RECEIPT') {
            newStock = part.currentStock + data.quantity;
        } else {
            if (part.currentStock < data.quantity) {
                throw new Error(`Insufficient stock. Available: ${part.currentStock}, Requested: ${data.quantity}`);
            }
            newStock = part.currentStock - data.quantity;
        }

        // Create transaction record
        const transactionData = {
            partId: data.partId,
            type: data.type,
            quantity: data.quantity,
            balanceAfter: newStock,
            machineId: data.machineId || null,
            machineName: data.machineName || null,
            reason: data.reason || null,
            issuedTo: data.issuedTo || null,
            createdAt: Timestamp.now(),
            createdBy: recordedBy,
            updatedAt: Timestamp.now(),
            updatedBy: recordedBy,
        };

        const transactionsRef = collection(db, SPARE_PARTS_TRANSACTIONS_COLLECTION);
        const newTransactionRef = doc(transactionsRef);
        transaction.set(newTransactionRef, transactionData);

        // Update part stock
        transaction.update(partRef, {
            currentStock: newStock,
            updatedAt: Timestamp.now(),
            updatedBy: recordedBy,
        });

        return newTransactionRef.id;
    });
}

// Get transactions for a spare part - simplified to avoid composite index
export async function getSparePartTransactions(
    partId: string,
    limitCount: number = 50
): Promise<SparePartTransaction[]> {
    const transactionsRef = collection(db, SPARE_PARTS_TRANSACTIONS_COLLECTION);
    // Single field query to avoid composite index requirement
    const q = query(
        transactionsRef,
        where('partId', '==', partId),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);

    const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SparePartTransaction[];

    // Sort in-memory by createdAt desc
    return transactions.sort((a, b) => {
        const aTime = getTimestampMillis(a.createdAt);
        const bTime = getTimestampMillis(b.createdAt);
        return bTime - aTime;
    });
}

// Receipt helper
export async function receiptSparePart(
    partId: string,
    quantity: number,
    reason: string,
    recordedBy: string
): Promise<string> {
    return recordSparePartTransaction({
        partId,
        type: 'RECEIPT',
        quantity,
        reason,
    }, recordedBy);
}

// Issue helper
export async function issueSparePart(
    partId: string,
    quantity: number,
    machineId: string | undefined,
    machineName: string | undefined,
    reason: string,
    issuedTo: string,
    recordedBy: string
): Promise<string> {
    return recordSparePartTransaction({
        partId,
        type: 'ISSUE',
        quantity,
        machineId,
        machineName,
        reason,
        issuedTo,
    }, recordedBy);
}
