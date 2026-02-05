import type { AuditFields } from '../../types';

// ============================================
// SPARE PARTS TYPES
// ============================================

export type SparePartCategory = 'MOTOR' | 'PUMP' | 'VALVE' | 'BEARING' | 'BELT' | 'SEAL' | 'ELECTRICAL' | 'HYDRAULIC' | 'PNEUMATIC' | 'GENERAL';

export interface SparePart extends AuditFields {
    id: string;
    partNumber: string;       // Unique part identifier (e.g., SP-001)
    fileNumber?: string;      // File/catalog number
    name: string;
    description?: string;
    category: SparePartCategory;
    unit: string;             // PCS, SET, MTR, etc.
    currentStock: number;
    minimumStock: number;
    usedFor?: string;         // Purpose/machine type description
    machineIds?: string[];    // Linked machine/asset IDs
    location?: string;        // Storage location (e.g., Rack A-1)
    unitPrice?: number;
}

export type SparePartTransactionType = 'RECEIPT' | 'ISSUE';

export interface SparePartTransaction extends AuditFields {
    id: string;
    partId: string;
    type: SparePartTransactionType;
    quantity: number;
    balanceAfter: number;
    machineId?: string;       // If issued to specific machine
    machineName?: string;     // Machine name for display
    reason?: string;
    issuedTo?: string;        // Person who drew the part
}
