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

const INVENTORY_ITEMS_COLLECTION = 'inventoryItems';
const INVENTORY_TRANSACTIONS_COLLECTION = 'inventoryTransactions';

// Generate item code like INV-RM-0001
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

// Generate transaction ID like TXN-2026-0001
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

// Get all inventory items
export async function getInventoryItems(limitCount: number = 100): Promise<InventoryItem[]> {
    const itemsRef = collection(db, INVENTORY_ITEMS_COLLECTION);
    const q = query(itemsRef, orderBy('code', 'asc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as InventoryItem[];
}

// Get inventory items by category - simplified to avoid composite index
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

// Get inventory item by ID
export async function getInventoryItemById(itemId: string): Promise<InventoryItem | null> {
    const itemRef = doc(db, INVENTORY_ITEMS_COLLECTION, itemId);
    const snapshot = await getDoc(itemRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as InventoryItem;
}

// Get low stock items (below minimum)
export async function getLowStockItems(): Promise<InventoryItem[]> {
    const items = await getInventoryItems();
    return items.filter(item => item.currentStock <= item.minimumStock);
}

// Create inventory item
export interface CreateInventoryItemData {
    name: string;
    category: InventoryCategory;
    unit: string;
    minimumStock: number;
    maximumStock?: number;
    location?: string;
    initialStock?: number;
}

export async function createInventoryItem(
    data: CreateInventoryItemData,
    createdBy: string
): Promise<string> {
    const code = await generateItemCode(data.category);
    const itemId = code.replace(/-/g, '_');
    const itemRef = doc(db, INVENTORY_ITEMS_COLLECTION, itemId);

    const itemDoc: Record<string, any> = {
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

// Update inventory item
export interface UpdateInventoryItemData {
    name?: string;
    unit?: string;
    minimumStock?: number;
    maximumStock?: number;
    location?: string;
}

export async function updateInventoryItem(
    itemId: string,
    data: UpdateInventoryItemData,
    updatedBy: string
): Promise<void> {
    const itemRef = doc(db, INVENTORY_ITEMS_COLLECTION, itemId);

    const updateData: Record<string, any> = {
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    if (data.name) updateData.name = data.name;
    if (data.unit) updateData.unit = data.unit;
    if (data.minimumStock != null) updateData.minimumStock = data.minimumStock;
    if (data.maximumStock != null) updateData.maximumStock = data.maximumStock;
    if (data.location) updateData.location = data.location;

    await updateDoc(itemRef, updateData);
}

// ============================================
// INVENTORY TRANSACTION OPERATIONS
// ============================================

// Get transactions for an item - simplified to avoid composite index
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
        const aTime = a.createdAt && (a.createdAt as any).toMillis ? (a.createdAt as any).toMillis() : 0;
        const bTime = b.createdAt && (b.createdAt as any).toMillis ? (b.createdAt as any).toMillis() : 0;
        return bTime - aTime;
    });
}

// Get recent transactions
export async function getRecentTransactions(limitCount: number = 50): Promise<InventoryTransaction[]> {
    const txnRef = collection(db, INVENTORY_TRANSACTIONS_COLLECTION);
    const q = query(txnRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as InventoryTransaction[];
}

// Record transaction (with atomic stock update)
export interface RecordTransactionData {
    itemId: string;
    transactionType: TransactionType;
    quantity: number;
    referenceType?: 'GATE_ENTRY' | 'BATCH' | 'MAINTENANCE_JOB';
    referenceId?: string;
    reason?: string;
    approvedBy?: string;
}

export async function recordTransaction(
    data: RecordTransactionData,
    recordedBy: string
): Promise<string> {
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
        const txnDoc: Record<string, any> = {
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

// Receipt from gate entry (raw materials in)
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

// Issue to batch (finished products out)
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

// Receipt from batch (products created)
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

// Issue to maintenance
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

// Stock adjustment
export async function adjustStock(
    itemId: string,
    quantity: number,
    reason: string,
    approvedBy: string,
    recordedBy: string
): Promise<string> {
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
