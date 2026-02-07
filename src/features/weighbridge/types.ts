import { Timestamp } from 'firebase/firestore';
import type { AuditFields } from '../../types';

// ============================================
// WEIGHBRIDGE TYPES
// ============================================

export type WeighbridgeEntryType = 'RM_IN' | 'FG_OUT';  // Raw Material IN, Finished Goods OUT
export type WeighbridgeEntryStatus = 'PENDING' | 'FIRST_WEIGHT' | 'COMPLETED' | 'CANCELLED';

export interface WeighbridgeEntry extends AuditFields {
    id: string;
    entryNumber: string;           // WB-2026-00001
    entryType: WeighbridgeEntryType;
    vehicleNumber: string;
    driverName?: string;
    driverPhone?: string;
    partyName?: string;            // Supplier for RM_IN, Customer for FG_OUT
    inventoryItemId?: string;      // Link to inventory item
    gateEntryId?: string;          // Link to gate entry (external vehicles)
    batchId?: string;              // Link to production batch (internal vehicles)
    materialName?: string;         // Material description
    grossWeight?: number;          // Total weight with load (KG)
    tareWeight?: number;           // Empty vehicle weight (KG)
    netWeight?: number;            // Calculated: gross - tare (KG)
    unit: 'KG' | 'TONS' | 'KL';
    firstWeightTime?: Timestamp;
    secondWeightTime?: Timestamp;
    status: WeighbridgeEntryStatus;
    notes?: string;
}
