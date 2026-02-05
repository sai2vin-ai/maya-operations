// Reactor & Batch Types
import { Timestamp } from 'firebase/firestore';
import type { AuditFields } from '../../types';

export type ReactorStatus = 'IDLE' | 'IN_BATCH' | 'MAINTENANCE' | 'OFFLINE';

export interface Reactor extends AuditFields {
    id: string;
    reactorNumber: string;
    name: string;
    status: ReactorStatus;
    currentBatchId?: string;
    lastMaintenanceDate?: Timestamp;
    totalBatches?: number;
}

export type BatchStatus =
    | 'CREATED'
    | 'IN_PROGRESS'
    | 'COOLING'
    | 'COMPLETED'
    | 'CANCELLED';

export interface BatchStep {
    stepNumber: number;
    stepName: string;
    completedAt?: Timestamp;
    completedBy?: string;
    photoUrls?: string[];
    notes?: string;
    temperature?: number;
    pressure?: number;
    inputWeight?: number;
    nitrogenPurged?: boolean;
    pyrolysisReadings?: PyrolysisReading[];
}

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

export type MaterialCategory =
    | 'TW-WHOLE'
    | 'TW-SHRED'
    | 'CB-STD'
    | 'CB-HG'
    | 'PO-CRD'
    | 'SW-MIX'
    | 'PYROLYSIS_OIL'
    | 'CARBON_BLACK'
    | 'SCRAP_STEEL';

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
    linkedGateEntryIds?: string[];
}
