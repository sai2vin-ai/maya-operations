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
    runTransaction,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { InventoryItem, InventoryTransaction, InventoryCategory, TransactionType } from '../types';
import { getTimestampMillis, type FirestoreDocData, type UserRole } from '../../../types';
import { assertAuthorized } from '../../../lib/authorization';

const INVENTORY_ITEMS_COLLECTION = 'inventoryItems';
const INVENTORY_TRANSACTIONS_COLLECTION = 'inventoryTransactions';

/**
 * Generates a sequential inventory item code based on category (e.g., "INV-RM-0001").
 * Queries existing items to determine the next serial for the given category prefix.
 * @param category - The inventory category used to determine the code prefix
 * @returns The next available item code
 */
async function generateItemCode(category: InventoryCategory): Promise<string> {
    const categoryPrefix: Record<InventoryCategory, string> = {
        'RAW_MATERIAL': 'RM',
        'FINISHED_PRODUCT': 'FP',
        'CONSUMABLE': 'CN',
        'SPARE_PART': 'SP',
    };

    const prefix = `INV-${categoryPrefix[category]}`;

    const itemsRef = collection(db, INVENTORY_ITEMS_COLLECTION);
    const q = query(
        itemsRef,
        where('code', '>=', prefix),
        where('code', '<=', prefix + '\uf8ff'),
        orderBy('code', 'desc'),
        limit(1)
    );

    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastItem = snapshot.docs[0].data() as InventoryItem;
        const lastNumber = parseInt(lastItem.code.split('-')[2]) || 0;
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Generates a sequential transaction ID in the format TXN-{year}-{serial}.
 * Queries existing transactions to determine the next serial for the current year.
 * @returns The next available transaction ID (e.g., "TXN-2026-00001")
 */
async function generateTransactionId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TXN-${year}`;

    const txnRef = collection(db, INVENTORY_TRANSACTIONS_COLLECTION);
    const q = query(
        txnRef,
        where('id', '>=', prefix),
        where('id', '<=', prefix + '\uf8ff'),
        orderBy('id', 'desc'),
        limit(1)
    );

    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastTxn = snapshot.docs[0].data();
        const lastNumber = parseInt(lastTxn.id.split('-')[2]) || 0;
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
}

// ============================================
// INVENTORY ITEM OPERATIONS
// ============================================

/**
 * Fetches inventory items ordered by code, with an optional limit.
 * @param limitCount - Maximum number of items to return (default: 100)
 * @returns Array of inventory items sorted by code ascending
 */
export async function getInventoryItems(limitCount: number = 100): Promise<InventoryItem[]> {
    const itemsRef = collection(db, INVENTORY_ITEMS_COLLECTION);
    const q = query(itemsRef, orderBy('code', 'asc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as InventoryItem[];
}

/**
 * Fetches inventory items filtered by category, sorted by code in memory.
 * @param category - The inventory category to filter by
 * @returns Array of matching items sorted by code ascending
 */
export async function getInventoryItemsByCategory(category: InventoryCategory): Promise<InventoryItem[]> {
    const itemsRef = collection(db, INVENTORY_ITEMS_COLLECTION);
    const q = query(itemsRef, where('category', '==', category));
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as InventoryItem[];

    // Sort in-memory by code
    return items.sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Fetches a single inventory item by its document ID.
 * @param itemId - The Firestore document ID
 * @returns The inventory item, or null if not found
 */
export async function getInventoryItemById(itemId: string): Promise<InventoryItem | null> {
    const itemRef = doc(db, INVENTORY_ITEMS_COLLECTION, itemId);
    const snapshot = await getDoc(itemRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as InventoryItem;
}

/** Returns all inventory items whose current stock is at or below their minimum threshold. */
export async function getLowStockItems(): Promise<InventoryItem[]> {
    const items = await getInventoryItems();
    return items.filter(item => item.currentStock <= item.minimumStock);
}

export interface CreateInventoryItemData {
    name: string;
    category: InventoryCategory;
    unit: string;
    minimumStock: number;
    maximumStock?: number;
    location?: string;
    initialStock?: number;
}

/**
 * Creates a new inventory item with an auto-generated code. If initial stock is provided,
 * also records a RECEIPT transaction for the opening balance.
 * @param data - Item data including name, category, unit, and stock thresholds
 * @param createdBy - UID of the user creating the item
 * @returns The newly created item's document ID
 */
export async function createInventoryItem(
    data: CreateInventoryItemData,
    createdBy: string,
    callerRole?: UserRole
): Promise<string> {
    assertAuthorized(callerRole, 'inventory:create');
    const code = await generateItemCode(data.category);
    const itemId = code.replace(/-/g, '_');
    const itemRef = doc(db, INVENTORY_ITEMS_COLLECTION, itemId);

    const itemDoc: FirestoreDocData = {
        code,
        name: data.name,
        category: data.category,
        unit: data.unit,
        currentStock: data.initialStock || 0,
        minimumStock: data.minimumStock,
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    if (data.maximumStock != null) itemDoc.maximumStock = data.maximumStock;
    if (data.location) itemDoc.location = data.location;

    await setDoc(itemRef, itemDoc);

    // If initial stock provided, create a receipt transaction
    if (data.initialStock && data.initialStock > 0) {
        await recordTransaction({
            itemId,
            transactionType: 'RECEIPT',
            quantity: data.initialStock,
            reason: 'Initial stock',
        }, createdBy);
    }

    return itemId;
}

export interface UpdateInventoryItemData {
    name?: string;
    unit?: string;
    minimumStock?: number;
    maximumStock?: number;
    location?: string;
}

/**
 * Updates an inventory item's metadata (name, unit, stock thresholds, location).
 * @param itemId - The item document ID to update
 * @param data - Partial item data to merge
 * @param updatedBy - UID of the user performing the update
 */
export async function updateInventoryItem(
    itemId: string,
    data: UpdateInventoryItemData,
    updatedBy: string,
    callerRole?: UserRole
): Promise<void> {
    assertAuthorized(callerRole, 'inventory:update');
    const itemRef = doc(db, INVENTORY_ITEMS_COLLECTION, itemId);

    const updateData: FirestoreDocData = {
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    if (data.name) updateData.name = data.name;
    if (data.unit) updateData.unit = data.unit;
    if (data.minimumStock != null) updateData.minimumStock = data.minimumStock;
    if (data.maximumStock != null) updateData.maximumStock = data.maximumStock;
    if (data.location) updateData.location = data.location;

    await updateDoc(itemRef, updateData as Record<string, unknown>);
}

// ============================================
// INVENTORY TRANSACTION OPERATIONS
// ============================================

/**
 * Fetches transactions for a specific inventory item, sorted newest first in memory.
 * @param itemId - The inventory item document ID to filter by
 * @param limitCount - Maximum number of transactions to return (default: 50)
 * @returns Array of transactions sorted by creation time descending
 */
export async function getItemTransactions(itemId: string, limitCount: number = 50): Promise<InventoryTransaction[]> {
    const txnRef = collection(db, INVENTORY_TRANSACTIONS_COLLECTION);
    const q = query(
        txnRef,
        where('itemId', '==', itemId),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);

    const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as InventoryTransaction[];

    // Sort in-memory by createdAt desc
    return transactions.sort((a, b) => {
        const aTime = getTimestampMillis(a.createdAt);
        const bTime = getTimestampMillis(b.createdAt);
        return bTime - aTime;
    });
}

/**
 * Fetches the most recent inventory transactions across all items.
 * @param limitCount - Maximum number of transactions to return (default: 50)
 * @returns Array of transactions sorted newest first
 */
export async function getRecentTransactions(limitCount: number = 50): Promise<InventoryTransaction[]> {
    const txnRef = collection(db, INVENTORY_TRANSACTIONS_COLLECTION);
    const q = query(txnRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as InventoryTransaction[];
}

export interface RecordTransactionData {
    itemId: string;
    transactionType: TransactionType;
    quantity: number;
    referenceType?: 'GATE_ENTRY' | 'BATCH' | 'MAINTENANCE_JOB';
    referenceId?: string;
    reason?: string;
    approvedBy?: string;
}

/**
 * Records an inventory transaction and atomically updates the item's stock level using a
 * Firestore transaction. Issues reduce stock; receipts increase it. Throws if the resulting
 * balance would be negative.
 * @param data - Transaction data including item ID, type, quantity, and optional reference
 * @param recordedBy - UID of the user recording the transaction
 * @returns The newly created transaction ID
 */
export async function recordTransaction(
    data: RecordTransactionData,
    recordedBy: string,
    callerRole?: UserRole
): Promise<string> {
    assertAuthorized(callerRole, 'inventory:transact');
    const txnId = await generateTransactionId();

    // Use transaction for atomic update
    await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, INVENTORY_ITEMS_COLLECTION, data.itemId);
        const itemSnap = await transaction.get(itemRef);

        if (!itemSnap.exists()) {
            throw new Error('Inventory item not found');
        }

        const item = itemSnap.data() as InventoryItem;

        // Calculate new balance
        let quantityChange = data.quantity;
        if (data.transactionType === 'ISSUE') {
            quantityChange = -Math.abs(data.quantity);
        } else if (data.transactionType === 'ADJUSTMENT') {
            // Adjustment can be positive or negative
            quantityChange = data.quantity;
        }

        const newBalance = item.currentStock + quantityChange;

        if (newBalance < 0) {
            throw new Error('Insufficient stock for this transaction');
        }

        // Create transaction record
        const txnRef = doc(db, INVENTORY_TRANSACTIONS_COLLECTION, txnId);
        const txnDoc: FirestoreDocData = {
            itemId: data.itemId,
            transactionType: data.transactionType,
            quantity: data.quantity,
            balanceAfter: newBalance,
            createdAt: Timestamp.now(),
            createdBy: recordedBy,
            updatedAt: Timestamp.now(),
            updatedBy: recordedBy,
        };

        if (data.referenceType) txnDoc.referenceType = data.referenceType;
        if (data.referenceId) txnDoc.referenceId = data.referenceId;
        if (data.reason) txnDoc.reason = data.reason;
        if (data.approvedBy) txnDoc.approvedBy = data.approvedBy;

        transaction.set(txnRef, txnDoc);

        // Update item stock
        transaction.update(itemRef, {
            currentStock: newBalance,
            updatedAt: Timestamp.now(),
            updatedBy: recordedBy,
        });
    });

    return txnId;
}

/**
 * Records a RECEIPT transaction for raw materials received via a gate entry.
 * @param itemId - The inventory item ID to receive into
 * @param quantity - The quantity received
 * @param gateEntryId - The linked gate entry document ID
 * @param recordedBy - UID of the user recording the receipt
 * @returns The newly created transaction ID
 */
export async function receiptFromGateEntry(
    itemId: string,
    quantity: number,
    gateEntryId: string,
    recordedBy: string
): Promise<string> {
    return recordTransaction({
        itemId,
        transactionType: 'RECEIPT',
        quantity,
        referenceType: 'GATE_ENTRY',
        referenceId: gateEntryId,
        reason: 'Receipt from gate entry',
    }, recordedBy);
}

/**
 * Records an ISSUE transaction for materials consumed by a batch.
 * @param itemId - The inventory item ID to issue from
 * @param quantity - The quantity issued
 * @param batchId - The linked batch document ID
 * @param recordedBy - UID of the user recording the issue
 * @returns The newly created transaction ID
 */
export async function issueToBatch(
    itemId: string,
    quantity: number,
    batchId: string,
    recordedBy: string
): Promise<string> {
    return recordTransaction({
        itemId,
        transactionType: 'ISSUE',
        quantity,
        referenceType: 'BATCH',
        referenceId: batchId,
        reason: 'Issue to batch production',
    }, recordedBy);
}

/**
 * Records a RECEIPT transaction for products created by a batch.
 * @param itemId - The inventory item ID to receive into
 * @param quantity - The quantity produced
 * @param batchId - The linked batch document ID
 * @param recordedBy - UID of the user recording the receipt
 * @returns The newly created transaction ID
 */
export async function receiptFromBatch(
    itemId: string,
    quantity: number,
    batchId: string,
    recordedBy: string
): Promise<string> {
    return recordTransaction({
        itemId,
        transactionType: 'RECEIPT',
        quantity,
        referenceType: 'BATCH',
        referenceId: batchId,
        reason: 'Receipt from batch production',
    }, recordedBy);
}

/**
 * Records an ISSUE transaction for materials consumed by a maintenance job.
 * @param itemId - The inventory item ID to issue from
 * @param quantity - The quantity issued
 * @param jobId - The linked maintenance job document ID
 * @param recordedBy - UID of the user recording the issue
 * @returns The newly created transaction ID
 */
export async function issueToMaintenance(
    itemId: string,
    quantity: number,
    jobId: string,
    recordedBy: string
): Promise<string> {
    return recordTransaction({
        itemId,
        transactionType: 'ISSUE',
        quantity,
        referenceType: 'MAINTENANCE_JOB',
        referenceId: jobId,
        reason: 'Issue to maintenance job',
    }, recordedBy);
}

/**
 * Records a stock ADJUSTMENT transaction (positive or negative) with approval tracking.
 * @param itemId - The inventory item ID to adjust
 * @param quantity - The adjustment quantity (positive to add, negative to subtract)
 * @param reason - The reason for the adjustment
 * @param approvedBy - UID of the user who approved the adjustment
 * @param recordedBy - UID of the user recording the adjustment
 * @returns The newly created transaction ID
 */
export async function adjustStock(
    itemId: string,
    quantity: number,
    reason: string,
    approvedBy: string,
    recordedBy: string,
    callerRole?: UserRole
): Promise<string> {
    assertAuthorized(callerRole, 'inventory:transact');
    return recordTransaction({
        itemId,
        transactionType: 'ADJUSTMENT',
        quantity,
        reason,
        approvedBy,
    }, recordedBy);
}

// ============================================
// CONSTANTS FOR UI
// ============================================

export const INVENTORY_CATEGORIES: { value: InventoryCategory; label: string }[] = [
    { value: 'RAW_MATERIAL', label: 'Raw Material' },
    { value: 'FINISHED_PRODUCT', label: 'Finished Product' },
    { value: 'CONSUMABLE', label: 'Consumable' },
    { value: 'SPARE_PART', label: 'Spare Part' },
];

export const TRANSACTION_TYPES: { value: TransactionType; label: string; color: string }[] = [
    { value: 'RECEIPT', label: 'Receipt', color: 'green' },
    { value: 'ISSUE', label: 'Issue', color: 'red' },
    { value: 'ADJUSTMENT', label: 'Adjustment', color: 'yellow' },
    { value: 'TRANSFER', label: 'Transfer', color: 'blue' },
];

export const COMMON_UNITS = ['KG', 'TONS', 'LITRE', 'KL', 'NOS', 'SET', 'MTR', 'BOX'];
