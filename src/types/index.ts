// Pyrolysis Ops - TypeScript Type Definitions
// Based on Development Specification v1.0

import { Timestamp } from 'firebase/firestore';

// ============================================
// COMMON TYPES
// ============================================

export interface AuditFields {
    createdAt: Timestamp;
    createdBy: string;
    updatedAt: Timestamp;
    updatedBy: string;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole =
    | 'SUPER_ADMIN'
    | 'PLANT_MANAGER'
    | 'SHIFT_SUPERVISOR'
    | 'GATE_OPERATOR'
    | 'WEIGHBRIDGE_OPERATOR'
    | 'REACTOR_OPERATOR'
    | 'STORES_KEEPER'
    | 'MAINTENANCE_TECH'
    | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User extends AuditFields {
    id: string;
    uid?: string; // Firebase Auth UID
    employeeId: string;
    name: string;
    phone: string;
    email?: string;
    role: UserRole;
    status: UserStatus;
    defaultShift?: 'A' | 'B' | 'C';
    photoUrl?: string;
    allowedDeviceIds?: string[];
}

// ============================================
// DEVICE TYPES
// ============================================

export type DeviceType = 'TABLET' | 'MOBILE' | 'DESKTOP' | 'SCANNER';
export type DeviceStatus = 'REGISTERED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED';
export type OperatingSystem = 'ANDROID' | 'IOS' | 'WINDOWS' | 'MACOS' | 'LINUX';

export interface Device {
    id: string;
    deviceId: string; // Hardware device ID
    name: string;
    deviceType: DeviceType;
    os: OperatingSystem;
    osVersion?: string;
    appVersion?: string;
    fcmToken?: string;
    status: DeviceStatus;
    assignedUserId?: string; // User ID
    lastSeen?: Timestamp;
    location?: string;
    registeredAt?: Timestamp;
    registeredBy?: string;
}

// ============================================
// GATE ENTRY TYPES
// ============================================

export type EntryType = 'IN' | 'OUT';

export type MaterialCategory =
    | 'TW-WHOLE' // Whole waste tyres
    | 'TW-SHRED' // Pre-shredded tyre chips
    | 'CB-STD' // Carbon Black (Standard)
    | 'CB-HG' // Carbon Black (High Grade)
    | 'PO-CRD' // Pyrolysis Oil (Crude)
    | 'SW-MIX' // Steel Wire (Mixed)
    | 'PYROLYSIS_OIL' // Pyrolysis Oil (Reactor Output)
    | 'CARBON_BLACK' // Carbon Black (Reactor Output)
    | 'SCRAP_STEEL'; // Scrap Steel (Reactor Output)

export type GateEntryStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface GateEntry extends AuditFields {
    id: string;
    entryNumber: string;
    entryType: EntryType;
    vehicleNumber: string;
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
    status: GateEntryStatus;
    entryTime: Timestamp;
    exitTime?: Timestamp;
    location?: GeoLocation;
    notes?: string;
}

// ============================================
// WEIGHBRIDGE TYPES
// ============================================

export type WeighbridgeEntryType = 'RM_IN' | 'FG_OUT'; // Raw Material IN, Finished Goods OUT
export type WeighbridgeEntryStatus = 'PENDING' | 'FIRST_WEIGHT' | 'COMPLETED' | 'CANCELLED';

export interface WeighbridgeEntry extends AuditFields {
    id: string;
    entryNumber: string; // WB-2026-00001
    entryType: WeighbridgeEntryType;
    vehicleNumber: string;
    driverName?: string;
    driverPhone?: string;
    partyName?: string; // Supplier for RM_IN, Customer for FG_OUT
    inventoryItemId?: string; // Link to inventory item
    materialName?: string; // Material description
    grossWeight?: number; // Total weight with load (KG)
    tareWeight?: number; // Empty vehicle weight (KG)
    netWeight?: number; // Calculated: gross - tare (KG)
    unit: 'KG' | 'TONS' | 'KL';
    firstWeightTime?: Timestamp;
    secondWeightTime?: Timestamp;
    status: WeighbridgeEntryStatus;
    notes?: string;
}

// ============================================
// REACTOR & BATCH TYPES
// ============================================

export type ReactorStatus = 'IDLE' | 'IN_BATCH' | 'MAINTENANCE' | 'OFFLINE';

export type BatchStatus = 'CREATED' | 'IN_PROGRESS' | 'COOLING' | 'COMPLETED' | 'CANCELLED';

export interface BatchStep {
    stepNumber: number;
    stepName: string;
    completedAt?: Timestamp;
    completedBy?: string;
    photoUrls?: string[]; // Changed: multiple photos support
    notes?: string;
    temperature?: number;
    pressure?: number;
    inputWeight?: number; // For LOADING step
    nitrogenPurged?: boolean; // For VENTING/CARBON_DISCHARGE steps
    pyrolysisReadings?: PyrolysisReading[]; // For PYROLYSIS step
}

// Multi-point readings for PYROLYSIS step
export interface PyrolysisReading {
    timestamp: Timestamp;
    reactorTemp: number;
    reactorPressure: number;
    firstTankTemp?: number;
    firstTankPressure?: number;
    panelTemp?: number;
    panelPressure?: number;
    recordedBy: string;
}

export interface BatchOutput {
    id: string;
    materialCategory: MaterialCategory;
    quantity: number;
    unit: 'KG' | 'TONS';
    photoUrl?: string;
    qualityGrade?: string;
    recordedAt: Timestamp;
    recordedBy: string;
}

export interface Batch extends AuditFields {
    id: string;
    batchNumber: string;
    reactorId: string;
    status: BatchStatus;
    currentStep: number;
    totalSteps: number;
    stepHistory: BatchStep[];
    outputs: BatchOutput[];
    startTime: Timestamp;
    endTime?: Timestamp;
    inputWeight?: number;
    shiftId?: string;
    notes?: string;
    linkedGateEntryIds?: string[]; // Gate entries used for this batch
}

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
    referenceType?: 'GATE_ENTRY' | 'BATCH' | 'MAINTENANCE_JOB' | 'WEIGHBRIDGE_ENTRY';
    referenceId?: string;
    reason?: string;
    approvedBy?: string;
}

// ============================================
// SPARE PARTS TYPES
// ============================================

export type SparePartCategory =
    | 'MOTOR'
    | 'PUMP'
    | 'VALVE'
    | 'BEARING'
    | 'BELT'
    | 'SEAL'
    | 'ELECTRICAL'
    | 'HYDRAULIC'
    | 'PNEUMATIC'
    | 'GENERAL';

export interface SparePart extends AuditFields {
    id: string;
    partNumber: string; // Unique part identifier (e.g., SP-001)
    fileNumber?: string; // File/catalog number
    name: string;
    description?: string;
    category: SparePartCategory;
    unit: string; // PCS, SET, MTR, etc.
    currentStock: number;
    minimumStock: number;
    usedFor?: string; // Purpose/machine type description
    machineIds?: string[]; // Linked machine/asset IDs
    location?: string; // Storage location (e.g., Rack A-1)
    unitPrice?: number;
}

export type SparePartTransactionType = 'RECEIPT' | 'ISSUE';

export interface SparePartTransaction extends AuditFields {
    id: string;
    partId: string;
    type: SparePartTransactionType;
    quantity: number;
    balanceAfter: number;
    machineId?: string; // If issued to specific machine
    machineName?: string; // Machine name for display
    reason?: string;
    issuedTo?: string; // Person who drew the part
}

// ============================================
// ASSET & MAINTENANCE TYPES
// ============================================

export type AssetCriticality = 'HIGH' | 'MEDIUM' | 'LOW';
export type AssetStatus = 'OPERATIONAL' | 'BREAKDOWN' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED';

export interface Asset extends AuditFields {
    id: string;
    assetCode: string;
    name: string;
    category: string;
    location: string;
    criticality: AssetCriticality;
    status: AssetStatus;
    installationDate?: Timestamp;
    lastPmDate?: Timestamp;
    nextPmDate?: Timestamp;
    pmFrequencyDays?: number;
    // Hierarchy
    parentAssetIds?: string[];
    // Reactor-specific (only when category === 'REACTOR')
    reactorNumber?: string;
    reactorStatus?: ReactorStatus;
    currentBatchId?: string;
    totalBatches?: number;
    lastMaintenanceDate?: Timestamp;
    // I/O materials (only for reactors)
    inputItemIds?: string[];
    outputItemIds?: string[];
}

export type JobType = 'BREAKDOWN' | 'PREVENTIVE' | 'CORRECTIVE';
export type JobStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_PARTS' | 'COMPLETED' | 'CLOSED';
export type JobPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface JobPartUsed {
    partId: string; // Firestore doc ID in spareParts collection
    partNumber: string; // Denormalized for display
    partName: string; // Denormalized for display
    quantity: number;
    unitPrice?: number; // Snapshot at time of issue
}

export interface MaintenanceJob extends AuditFields {
    id: string;
    jobNumber: string;
    assetId: string;
    jobType: JobType;
    priority: JobPriority;
    status: JobStatus;
    description: string;
    reportedBy: string;
    reportedAt: Timestamp;
    assignedTo?: string;
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    rootCause?: string;
    actionTaken?: string;
    partsUsed?: JobPartUsed[];
}

// ============================================
// SHIFT TYPES
// ============================================

export type ShiftType = 'A' | 'B' | 'C';

export interface Shift extends AuditFields {
    id: string;
    shiftType: ShiftType;
    date: Timestamp;
    supervisorId: string;
    startTime: Timestamp;
    endTime?: Timestamp;
    handoverNotes?: string;
    incomingSupervisorId?: string;
    handoverAcknowledged?: boolean;
    handoverAcknowledgedAt?: Timestamp;
}

// ============================================
// FIRESTORE HELPERS
// ============================================

// Helper type for Firestore document data (building documents with optional fields)
export type FirestoreDocData = Record<string, unknown>;

// Helper to safely get timestamp millis
export function getTimestampMillis(ts: unknown): number {
    if (
        ts &&
        typeof ts === 'object' &&
        'toMillis' in ts &&
        typeof (ts as { toMillis: () => number }).toMillis === 'function'
    ) {
        return (ts as { toMillis: () => number }).toMillis();
    }
    return 0;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'alert';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    targetRoles: UserRole[];
    entityType?: string; // 'gateEntry', 'batch', 'reactor', etc.
    entityId?: string; // Document ID for navigation
    createdAt: Timestamp;
    expiresAt?: Timestamp;
}

// ============================================
// OFFLINE SYNC TYPES
// ============================================

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface OfflineQueueItem {
    id: string;
    collection: string;
    documentId: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    data: Record<string, unknown>;
    timestamp: number;
    syncStatus: SyncStatus;
    retryCount: number;
    error?: string;
}
