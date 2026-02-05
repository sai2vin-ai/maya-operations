// Gate Entry Types
import { Timestamp } from 'firebase/firestore';
import type { AuditFields, GeoLocation } from '../../types';

export type EntryType = 'IN' | 'OUT';

export type MaterialCategory =
    | 'TW-WHOLE'       // Whole waste tyres
    | 'TW-SHRED'       // Pre-shredded tyre chips
    | 'CB-STD'         // Carbon Black (Standard)
    | 'CB-HG'          // Carbon Black (High Grade)
    | 'PO-CRD'         // Pyrolysis Oil (Crude)
    | 'SW-MIX'         // Steel Wire (Mixed)
    | 'PYROLYSIS_OIL'  // Pyrolysis Oil (Reactor Output)
    | 'CARBON_BLACK'   // Carbon Black (Reactor Output)
    | 'SCRAP_STEEL';   // Scrap Steel (Reactor Output)

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
