import type { AuditFields } from '../../types';

// ============================================
// INVENTORY TYPES
// ============================================

export type InventoryCategory = 'RAW_MATERIAL' | 'FINISHED_PRODUCT' | 'CONSUMABLE' | 'SPARE_PART';

export interface InventoryItem extends AuditFields {
    id: string;
    code: string;
    name: string;
    category: InventoryCategory;
    unit: string;
    currentStock: number;
    minimumStock: number;
    maximumStock?: number;
    location?: string;
}

export type TransactionType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'TRANSFER';

export interface InventoryTransaction extends AuditFields {
    id: string;
    itemId: string;
    transactionType: TransactionType;
    quantity: number;
    balanceAfter: number;
    referenceType?: 'GATE_ENTRY' | 'BATCH' | 'MAINTENANCE_JOB';
    referenceId?: string;
    reason?: string;
    approvedBy?: string;
}
