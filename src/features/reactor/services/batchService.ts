import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    runTransaction,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';

import type { Batch, BatchStatus, BatchOutput, MaterialCategory } from '../types';
import type { FirestoreDocData, UserRole } from '../../../types';
import { BATCH_STEPS } from '../../../config/batchSteps';
import { assertAuthorized } from '../../../lib/authorization';
import { batchSchema, parseDocs, parseDoc } from '../../../lib/schemas';

// Re-export for backward compatibility
export { BATCH_STEPS } from '../../../config/batchSteps';

const BATCHES_COLLECTION = 'batches';

/**
 * Generates a sequential batch number in the format {reactor}-{date}-{serial}.
 * Queries existing batches to determine the next serial for the given reactor and date.
 * @param reactorNumber - The reactor identifier (e.g., "M1")
 * @returns The next available batch number (e.g., "M1-20260128-001")
 */
async function generateBatchNumber(reactorNumber: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // 20260128
    const prefix = `${reactorNumber}-${dateStr}`;

    const batchesRef = collection(db, BATCHES_COLLECTION);
    const q = query(
        batchesRef,
        where('batchNumber', '>=', prefix),
        where('batchNumber', '<=', prefix + '\uf8ff'),
        orderBy('batchNumber', 'desc'),
        limit(1),
    );
    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastBatch = snapshot.docs[0].data() as Batch;
        const parts = lastBatch.batchNumber.split('-');
        const num = parseInt(parts[parts.length - 1]) || 0;
        nextNumber = num + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Fetches batches ordered by start time, with an optional limit.
 * @param limitCount - Maximum number of batches to return (default: 50)
 * @returns Array of batches sorted newest first
 */
export async function getBatches(limitCount: number = 50): Promise<Batch[]> {
    const batchesRef = collection(db, BATCHES_COLLECTION);
    const q = query(batchesRef, orderBy('startTime', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(batchSchema, raw, 'getBatches') as Batch[];
}

/**
 * Fetches a single batch by its document ID.
 * @param batchId - The Firestore document ID
 * @returns The batch object, or null if not found
 */
export async function getBatchById(batchId: string): Promise<Batch | null> {
    const batchRef = doc(db, BATCHES_COLLECTION, batchId);
    const snapshot = await getDoc(batchRef);

    if (!snapshot.exists()) {
        return null;
    }

    return parseDoc(batchSchema, { id: snapshot.id, ...snapshot.data() }, 'getBatchById') as Batch;
}

/**
 * Fetches all batches for a specific reactor, sorted newest first.
 * @param reactorId - The reactor document ID to filter by
 * @returns Array of batches belonging to the reactor
 */
export async function getBatchesByReactor(reactorId: string): Promise<Batch[]> {
    const batchesRef = collection(db, BATCHES_COLLECTION);
    const q = query(batchesRef, where('reactorId', '==', reactorId), orderBy('startTime', 'desc'));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(batchSchema, raw, 'getBatchesByReactor') as Batch[];
}

/**
 * Finds the currently active batch (CREATED, IN_PROGRESS, or COOLING) for a reactor.
 * @param reactorId - The reactor document ID
 * @returns The active batch, or null if no batch is running
 */
export async function getActiveBatch(reactorId: string): Promise<Batch | null> {
    const batchesRef = collection(db, BATCHES_COLLECTION);
    const q = query(
        batchesRef,
        where('reactorId', '==', reactorId),
        where('status', 'in', ['CREATED', 'IN_PROGRESS', 'COOLING']),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const d = snapshot.docs[0];
    return parseDoc(batchSchema, { id: d.id, ...d.data() }, 'getActiveBatch') as Batch;
}

export interface CreateBatchData {
    reactorId: string;
    reactorNumber: string;
    inputWeight?: number;
    shiftId?: string;
    notes?: string;
}

/**
 * Creates a new batch with an auto-generated batch number and sets the reactor status to IN_BATCH.
 * @param data - Batch creation data including reactor ID and optional input weight
 * @param createdBy - UID of the user creating the batch
 * @returns The newly created batch's document ID
 */
export async function createBatch(data: CreateBatchData, createdBy: string, callerRole?: UserRole): Promise<string> {
    assertAuthorized(callerRole, 'batch:create');
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

    // Atomically create batch and update reactor status
    const reactorRef = doc(db, 'reactors', data.reactorId);
    await runTransaction(db, async (transaction) => {
        const reactorSnap = await transaction.get(reactorRef);
        if (!reactorSnap.exists()) {
            throw new Error(`Reactor '${data.reactorId}' does not exist`);
        }
        if (reactorSnap.data()?.status === 'IN_BATCH') {
            throw new Error('Reactor already has an active batch');
        }
        transaction.set(batchRef, batchDoc);
        transaction.update(reactorRef, {
            status: 'IN_BATCH',
            currentBatchId: batchId,
            updatedAt: Timestamp.now(),
            updatedBy: createdBy,
        });
    });

    return batchId;
}

/**
 * Uploads a step photo to Firebase Storage under the batch's folder.
 * @param file - The image blob to upload
 * @param batchNumber - The batch number used for the storage path
 * @param stepNumber - The step number included in the filename
 * @returns The download URL of the uploaded photo
 */
export async function uploadStepPhoto(file: Blob, batchNumber: string, stepNumber: number): Promise<string> {
    const timestamp = Date.now();
    const path = `batches/${batchNumber}/step_${stepNumber}_${timestamp}.jpg`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);

    return await getDownloadURL(storageRef);
}

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

export interface PyrolysisReadingData {
    reactorTemp: number;
    reactorPressure: number;
    firstTankTemp?: number;
    firstTankPressure?: number;
    panelTemp?: number;
    panelPressure?: number;
}

/**
 * Completes a workflow step for a batch. Advances the batch status based on the step number
 * (IN_PROGRESS for steps 1-8, COOLING for 9-13, COMPLETED for 14). On completion of the
 * final step, uses a Firestore transaction to atomically update the batch and reset the reactor.
 * @param batchId - The batch document ID
 * @param stepData - Step completion data including readings, photos, and optional pyrolysis data
 * @param completedBy - UID of the user completing the step
 */
export async function completeStep(
    batchId: string,
    stepData: CompleteStepData,
    completedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'batch:complete_step');
    const batch = await getBatchById(batchId);
    if (!batch) throw new Error('Batch not found');

    const expectedStep = batch.currentStep + 1;
    if (stepData.stepNumber !== expectedStep) {
        throw new Error(
            `Expected step ${expectedStep}, but received step ${stepData.stepNumber}. Steps must be completed in order.`,
        );
    }

    const stepInfo = BATCH_STEPS.find((s) => s.stepNumber === stepData.stepNumber);
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
        newStep.pyrolysisReadings = stepData.pyrolysisReadings.map((r) => ({
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

    // Use transaction for batch completion + reactor update to prevent partial state
    if (newStatus === 'COMPLETED' && batch.reactorId) {
        const reactorRef = doc(db, 'reactors', batch.reactorId);
        await runTransaction(db, async (transaction) => {
            const reactorSnap = await transaction.get(reactorRef);
            const currentBatches = reactorSnap.exists() ? reactorSnap.data()?.totalBatches || 0 : 0;

            transaction.update(batchRef, updateData);
            transaction.update(reactorRef, {
                totalBatches: currentBatches + 1,
                currentBatchId: null,
                status: 'IDLE',
                updatedAt: Timestamp.now(),
            });
        });
    } else {
        await updateDoc(batchRef, updateData);
    }
}

export interface RecordOutputData {
    materialCategory: MaterialCategory;
    quantity: number;
    unit: 'KG' | 'TONS';
    qualityGrade?: string;
    photoUrl?: string;
    inventoryItemId?: string;
}

/**
 * Records a material output for a batch (e.g., carbon black, oil, steel wire). If an
 * inventory item ID is provided, automatically creates a receipt transaction in inventory.
 * @param batchId - The batch document ID
 * @param outputData - Output details including material category, quantity, and optional inventory link
 * @param recordedBy - UID of the user recording the output
 */
export async function recordOutput(
    batchId: string,
    outputData: RecordOutputData,
    recordedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'batch:complete_step');
    const batch = await getBatchById(batchId);
    if (!batch) throw new Error('Batch not found');

    const outputIndex = (batch.outputs || []).length + 1;
    const output: BatchOutput = {
        id: `${batchId}_output_${String(outputIndex).padStart(3, '0')}`,
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
        const quantityKg = outputData.unit === 'TONS' ? outputData.quantity * 1000 : outputData.quantity;
        await receiptFromBatch(outputData.inventoryItemId, quantityKg, batchId, recordedBy);
    }
}

/**
 * Cancels a batch and atomically resets the associated reactor to IDLE status.
 * @param batchId - The batch document ID to cancel
 * @param reason - The reason for cancellation, stored in the notes field
 * @param cancelledBy - UID of the user cancelling the batch
 */
export async function cancelBatch(
    batchId: string,
    reason: string,
    cancelledBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'batch:cancel');
    const batch = await getBatchById(batchId);
    if (!batch) throw new Error('Batch not found');

    const batchRef = doc(db, BATCHES_COLLECTION, batchId);
    const existingNotes = batch.notes ? `${batch.notes}\n` : '';
    const batchUpdate = {
        status: 'CANCELLED',
        notes: `${existingNotes}Cancelled: ${reason}`,
        endTime: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: cancelledBy,
    };

    // Always use transaction to atomically cancel batch + reset reactor
    if (!batch.reactorId) {
        throw new Error('Batch has no associated reactor — cannot cancel safely');
    }
    const reactorRef = doc(db, 'reactors', batch.reactorId);
    await runTransaction(db, async (transaction) => {
        transaction.update(batchRef, batchUpdate);
        transaction.update(reactorRef, {
            status: 'IDLE',
            currentBatchId: null,
            updatedAt: Timestamp.now(),
            updatedBy: cancelledBy,
        });
    });
}

// Batch statuses for UI
export const BATCH_STATUSES: { value: BatchStatus; label: string; color: string }[] = [
    { value: 'CREATED', label: 'Created', color: 'blue' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'green' },
    { value: 'COOLING', label: 'Cooling', color: 'yellow' },
    { value: 'COMPLETED', label: 'Completed', color: 'gray' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
];

/**
 * Returns the display label and color for a batch status.
 * @param status - The batch status value
 * @returns Status info object with value, label, and color
 */
export function getBatchStatusInfo(status: BatchStatus) {
    return BATCH_STATUSES.find((s) => s.value === status) || BATCH_STATUSES[0];
}
