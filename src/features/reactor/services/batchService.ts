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
import { updateReactorStatus, incrementBatchCount } from './reactorService';
import type { Batch, BatchStatus, BatchOutput, MaterialCategory } from '../types';
import type { FirestoreDocData } from '../../../types';

const BATCHES_COLLECTION = 'batches';

// Define the 14-step workflow
export const BATCH_STEPS = [
    { stepNumber: 1, stepName: 'CLEANING', requiresPhoto: true, description: 'Clean jolly and door', canAbort: true },
    { stepNumber: 2, stepName: 'INSPECTION', requiresPhoto: true, description: 'Safety checks - seals, heating elements', canAbort: true },
    { stepNumber: 3, stepName: 'LOADING', requiresPhoto: true, description: 'Load raw material, record input weight', canAbort: true },
    { stepNumber: 4, stepName: 'SEALING', requiresPhoto: true, description: 'Door closing, roller greasing', canAbort: true },
    { stepNumber: 5, stepName: 'OIL_SEAL_LEVEL', requiresPhoto: true, description: 'Oil seal leveling', canAbort: true },
    { stepNumber: 6, stepName: 'WATER_SEAL_LEVEL', requiresPhoto: true, description: 'Water seal leveling', canAbort: true },
    { stepNumber: 7, stepName: 'PRE_HEATING', requiresPhoto: true, description: 'Oil dip photo, record start time', canAbort: 'emergency' },
    { stepNumber: 8, stepName: 'PYROLYSIS', requiresPhoto: true, description: 'Record temp/pressure readings at reactor, tank, panel', canAbort: 'emergency' },
    { stepNumber: 9, stepName: 'COOLING', requiresPhoto: false, description: 'Controlled cooldown', canAbort: false },
    { stepNumber: 10, stepName: 'VENTING', requiresPhoto: true, description: 'Vent at 200°C, nitrogen purging', tempThreshold: 200, canAbort: false },
    { stepNumber: 11, stepName: 'CARBON_DISCHARGE', requiresPhoto: true, description: 'Open at 70°C, nitrogen purge before opening', tempThreshold: 70, canAbort: false },
    { stepNumber: 12, stepName: 'STEEL_DISCHARGE', requiresPhoto: true, description: 'Remove and weigh steel wire', canAbort: false },
    { stepNumber: 13, stepName: 'OIL_TRANSFER', requiresPhoto: true, description: 'Filter oil and transfer to main tank', canAbort: false },
    { stepNumber: 14, stepName: 'COMPLETE', requiresPhoto: false, description: 'Record final weights - oil, carbon, steel', canAbort: false },
];

// Generate batch number like M1-20260128-001 (ReactorNumber-Date-SerialNumber)
async function generateBatchNumber(reactorNumber: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // 20260128
    const prefix = `${reactorNumber}-${dateStr}`;

    const batchesRef = collection(db, BATCHES_COLLECTION);
    const snapshot = await getDocs(batchesRef);

    let maxNumber = 0;
    snapshot.docs.forEach(doc => {
        const batch = doc.data() as Batch;
        if (batch.batchNumber && batch.batchNumber.startsWith(prefix)) {
            const parts = batch.batchNumber.split('-');
            const num = parseInt(parts[parts.length - 1]) || 0;
            if (num > maxNumber) maxNumber = num;
        }
    });

    return `${prefix}-${String(maxNumber + 1).padStart(3, '0')}`;
}

// Get all batches
export async function getBatches(limitCount: number = 50): Promise<Batch[]> {
    const batchesRef = collection(db, BATCHES_COLLECTION);
    const q = query(batchesRef, orderBy('startTime', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Batch[];
}

// Get batch by ID
export async function getBatchById(batchId: string): Promise<Batch | null> {
    const batchRef = doc(db, BATCHES_COLLECTION, batchId);
    const snapshot = await getDoc(batchRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as Batch;
}

// Get batches by reactor
export async function getBatchesByReactor(reactorId: string): Promise<Batch[]> {
    const batchesRef = collection(db, BATCHES_COLLECTION);
    const q = query(batchesRef, where('reactorId', '==', reactorId), orderBy('startTime', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Batch[];
}

// Get active batch for reactor
export async function getActiveBatch(reactorId: string): Promise<Batch | null> {
    const batchesRef = collection(db, BATCHES_COLLECTION);
    const q = query(
        batchesRef,
        where('reactorId', '==', reactorId),
        where('status', 'in', ['CREATED', 'IN_PROGRESS', 'COOLING'])
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Batch;
}

// Create new batch
export interface CreateBatchData {
    reactorId: string;
    reactorNumber: string;
    inputWeight?: number;
    shiftId?: string;
    notes?: string;
}

export async function createBatch(data: CreateBatchData, createdBy: string): Promise<string> {
    const batchNumber = await generateBatchNumber(data.reactorNumber);
    const batchId = batchNumber.replace(/-/g, '_');
    const batchRef = doc(db, BATCHES_COLLECTION, batchId);

    // Build batch doc, only including defined values
    const batchDoc: FirestoreDocData = {
        batchNumber,
        reactorId: data.reactorId,
        status: 'CREATED',
        currentStep: 0,
        totalSteps: BATCH_STEPS.length,
        stepHistory: [],
        outputs: [],
        startTime: Timestamp.now(),
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    // Only add optional fields if they have values
    if (data.inputWeight != null) batchDoc.inputWeight = data.inputWeight;
    if (data.shiftId) batchDoc.shiftId = data.shiftId;
    if (data.notes) batchDoc.notes = data.notes;

    await setDoc(batchRef, batchDoc);

    // Update reactor status
    await updateReactorStatus(data.reactorId, 'IN_BATCH', batchId, createdBy);

    return batchId;
}

// Upload step photo
export async function uploadStepPhoto(file: Blob, batchNumber: string, stepNumber: number): Promise<string> {
    const timestamp = Date.now();
    const path = `batches/${batchNumber}/step_${stepNumber}_${timestamp}.jpg`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);

    return await getDownloadURL(storageRef);
}

// Complete a step
export interface CompleteStepData {
    stepNumber: number;
    notes?: string;
    photoUrls?: string[];
    temperature?: number;
    pressure?: number;
    inputWeight?: number;
    nitrogenPurged?: boolean;
    pyrolysisReadings?: PyrolysisReadingData[];
    gateEntryIds?: string[];
}

// Pyrolysis reading data for step 8
export interface PyrolysisReadingData {
    reactorTemp: number;
    reactorPressure: number;
    firstTankTemp?: number;
    firstTankPressure?: number;
    panelTemp?: number;
    panelPressure?: number;
}

export async function completeStep(
    batchId: string,
    stepData: CompleteStepData,
    completedBy: string
): Promise<void> {
    const batch = await getBatchById(batchId);
    if (!batch) throw new Error('Batch not found');

    const stepInfo = BATCH_STEPS.find(s => s.stepNumber === stepData.stepNumber);
    if (!stepInfo) throw new Error('Invalid step number');

    // Build step object without undefined values
    const newStep: FirestoreDocData = {
        stepNumber: stepData.stepNumber,
        stepName: stepInfo.stepName,
        completedAt: Timestamp.now(),
        completedBy,
    };

    // Only add optional fields if they have values
    if (stepData.notes) newStep.notes = stepData.notes;
    if (stepData.photoUrls && stepData.photoUrls.length > 0) newStep.photoUrls = stepData.photoUrls;
    if (stepData.temperature != null) newStep.temperature = stepData.temperature;
    if (stepData.pressure != null) newStep.pressure = stepData.pressure;
    if (stepData.inputWeight != null) newStep.inputWeight = stepData.inputWeight;
    if (stepData.nitrogenPurged != null) newStep.nitrogenPurged = stepData.nitrogenPurged;
    if (stepData.pyrolysisReadings && stepData.pyrolysisReadings.length > 0) {
        newStep.pyrolysisReadings = stepData.pyrolysisReadings.map(r => ({
            ...r,
            timestamp: Timestamp.now(),
            recordedBy: completedBy,
        }));
    }

    const updatedHistory = [...(batch.stepHistory || []), newStep];
    const newCurrentStep = stepData.stepNumber;

    // Determine new status based on workflow phase
    let newStatus: BatchStatus = 'IN_PROGRESS';
    if (stepData.stepNumber >= 9 && stepData.stepNumber < 14) {
        // Steps 9-13: Cooling phase (COOLING, VENTING, DISCHARGE steps)
        newStatus = 'COOLING';
    } else if (stepData.stepNumber === 14) {
        newStatus = 'COMPLETED';
    }

    const batchRef = doc(db, BATCHES_COLLECTION, batchId);
    const updateData: FirestoreDocData = {
        currentStep: newCurrentStep,
        stepHistory: updatedHistory,
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: completedBy,
    };

    // Save linked gate entries from LOADING step
    if (stepData.stepNumber === 3 && stepData.gateEntryIds && stepData.gateEntryIds.length > 0) {
        updateData.linkedGateEntryIds = stepData.gateEntryIds;
    }

    if (newStatus === 'COMPLETED') {
        updateData.endTime = Timestamp.now();
    }

    await updateDoc(batchRef, updateData);

    // If batch completed, update reactor
    if (newStatus === 'COMPLETED' && batch.reactorId) {
        await incrementBatchCount(batch.reactorId);
    }
}

// Record batch output
export interface RecordOutputData {
    materialCategory: MaterialCategory;
    quantity: number;
    unit: 'KG' | 'TONS';
    qualityGrade?: string;
    photoUrl?: string;
    inventoryItemId?: string;
}

export async function recordOutput(
    batchId: string,
    outputData: RecordOutputData,
    recordedBy: string
): Promise<void> {
    const batch = await getBatchById(batchId);
    if (!batch) throw new Error('Batch not found');

    const output: BatchOutput = {
        id: `output_${Date.now()}`,
        materialCategory: outputData.materialCategory,
        quantity: outputData.quantity,
        unit: outputData.unit,
        qualityGrade: outputData.qualityGrade,
        photoUrl: outputData.photoUrl,
        recordedAt: Timestamp.now(),
        recordedBy,
    };

    const updatedOutputs = [...(batch.outputs || []), output];

    const batchRef = doc(db, BATCHES_COLLECTION, batchId);
    await updateDoc(batchRef, {
        outputs: updatedOutputs,
        updatedAt: Timestamp.now(),
        updatedBy: recordedBy,
    });

    // Create inventory receipt if linked to inventory item
    if (outputData.inventoryItemId) {
        const { receiptFromBatch } = await import('../../inventory/services/inventoryService');
        // Convert to KG if needed
        const quantityKg = outputData.unit === 'TONS'
            ? outputData.quantity * 1000
            : outputData.quantity;
        await receiptFromBatch(
            outputData.inventoryItemId,
            quantityKg,
            batchId,
            recordedBy
        );
    }
}

// Cancel batch
export async function cancelBatch(batchId: string, reason: string, cancelledBy: string): Promise<void> {
    const batch = await getBatchById(batchId);
    if (!batch) throw new Error('Batch not found');

    const batchRef = doc(db, BATCHES_COLLECTION, batchId);
    await updateDoc(batchRef, {
        status: 'CANCELLED',
        notes: `Cancelled: ${reason}`,
        endTime: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: cancelledBy,
    });

    // Reset reactor to idle
    if (batch.reactorId) {
        await updateReactorStatus(batch.reactorId, 'IDLE', undefined, cancelledBy);
    }
}

// Batch statuses for UI
export const BATCH_STATUSES: { value: BatchStatus; label: string; color: string }[] = [
    { value: 'CREATED', label: 'Created', color: 'blue' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'green' },
    { value: 'COOLING', label: 'Cooling', color: 'yellow' },
    { value: 'COMPLETED', label: 'Completed', color: 'gray' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
];

// Get status info
export function getBatchStatusInfo(status: BatchStatus) {
    return BATCH_STATUSES.find(s => s.value === status) || BATCH_STATUSES[0];
}
