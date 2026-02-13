import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
    runTransaction,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { assertAuthorized } from '../../../lib/authorization';
import type { MaintenanceJob, JobType, JobPriority, JobStatus, JobPartUsed } from '../../../types';
import { type FirestoreDocData, type UserRole } from '../../../types';

const ASSETS_COLLECTION = 'assets';
const JOBS_COLLECTION = 'maintenanceJobs';
const SPARE_PARTS_COLLECTION = 'spareParts';
const SPARE_PARTS_TRANSACTIONS_COLLECTION = 'sparePartTransactions';

// ============================================
// CONSTANTS
// ============================================

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
    OPEN: { label: 'Open', color: 'bg-blue-500/20 text-blue-400' },
    ASSIGNED: { label: 'Assigned', color: 'bg-indigo-500/20 text-indigo-400' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400' },
    PENDING_PARTS: { label: 'Pending Parts', color: 'bg-orange-500/20 text-orange-400' },
    COMPLETED: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
    CLOSED: { label: 'Closed', color: 'bg-slate-500/20 text-slate-400' },
};

export const JOB_PRIORITY_CONFIG: Record<JobPriority, { label: string; color: string }> = {
    CRITICAL: { label: 'Critical', color: 'bg-red-500/20 text-red-400' },
    HIGH: { label: 'High', color: 'bg-orange-500/20 text-orange-400' },
    MEDIUM: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
    LOW: { label: 'Low', color: 'bg-green-500/20 text-green-400' },
};

export const JOB_TYPE_CONFIG: Record<JobType, { label: string; color: string }> = {
    BREAKDOWN: { label: 'Breakdown', color: 'bg-red-500/20 text-red-400' },
    PREVENTIVE: { label: 'Preventive', color: 'bg-blue-500/20 text-blue-400' },
    CORRECTIVE: { label: 'Corrective', color: 'bg-yellow-500/20 text-yellow-400' },
};

// ============================================
// JOB OPERATIONS
// ============================================

async function generateJobNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JOB-${year}`;
    const jobsRef = collection(db, JOBS_COLLECTION);
    const q = query(
        jobsRef,
        where('jobNumber', '>=', prefix + '-'),
        where('jobNumber', '<=', prefix + '-\uf8ff'),
        orderBy('jobNumber', 'desc'),
        limit(1),
    );
    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastJob = snapshot.docs[0].data() as MaintenanceJob;
        const num = parseInt(lastJob.jobNumber.split('-')[2]) || 0;
        nextNumber = num + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

export async function getJobs(limitCount = 100): Promise<MaintenanceJob[]> {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const q = query(jobsRef, orderBy('reportedAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as MaintenanceJob[];
}

export async function getJobsByAsset(assetId: string): Promise<MaintenanceJob[]> {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const q = query(jobsRef, where('assetId', '==', assetId));
    const snapshot = await getDocs(q);

    const jobs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as MaintenanceJob[];

    return jobs.sort((a, b) => {
        const aTime = a.reportedAt?.toMillis?.() || 0;
        const bTime = b.reportedAt?.toMillis?.() || 0;
        return bTime - aTime;
    });
}

/** Fetches jobs for multiple asset IDs (for aggregating parent + children). */
export async function getJobsByAssets(assetIds: string[]): Promise<MaintenanceJob[]> {
    if (assetIds.length === 0) return [];

    // Firestore 'in' queries support max 30 values
    const batches: MaintenanceJob[][] = [];
    for (let i = 0; i < assetIds.length; i += 30) {
        const chunk = assetIds.slice(i, i + 30);
        const jobsRef = collection(db, JOBS_COLLECTION);
        const q = query(jobsRef, where('assetId', 'in', chunk));
        const snapshot = await getDocs(q);
        batches.push(
            snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as MaintenanceJob[],
        );
    }

    const all = batches.flat();
    return all.sort((a, b) => {
        const aTime = a.reportedAt?.toMillis?.() || 0;
        const bTime = b.reportedAt?.toMillis?.() || 0;
        return bTime - aTime;
    });
}

export async function getJobById(jobId: string): Promise<MaintenanceJob | null> {
    const jobRef = doc(db, JOBS_COLLECTION, jobId);
    const snapshot = await getDoc(jobRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as MaintenanceJob;
}

export interface CreateJobData {
    assetId: string;
    jobType: JobType;
    priority: JobPriority;
    description: string;
    assignedTo?: string;
}

export async function createJob(data: CreateJobData, reportedBy: string, callerRole?: UserRole): Promise<string> {
    assertAuthorized(callerRole, 'maintenance:create');
    const jobNumber = await generateJobNumber();

    const jobData: FirestoreDocData = {
        jobNumber,
        assetId: data.assetId,
        jobType: data.jobType,
        priority: data.priority,
        status: (data.assignedTo ? 'ASSIGNED' : 'OPEN') as JobStatus,
        description: data.description,
        reportedBy,
        reportedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        createdBy: reportedBy,
        updatedAt: Timestamp.now(),
        updatedBy: reportedBy,
    };

    if (data.assignedTo) {
        jobData.assignedTo = data.assignedTo;
    }

    // If breakdown job, mark asset as BREAKDOWN
    if (data.jobType === 'BREAKDOWN') {
        const assetRef = doc(db, ASSETS_COLLECTION, data.assetId);
        await updateDoc(assetRef, {
            status: 'BREAKDOWN',
            updatedAt: Timestamp.now(),
            updatedBy: reportedBy,
        });
    }

    const jobsRef = collection(db, JOBS_COLLECTION);
    const docRef = await addDoc(jobsRef, jobData);
    return docRef.id;
}

export interface UpdateJobData {
    status?: JobStatus;
    assignedTo?: string;
    rootCause?: string;
    actionTaken?: string;
}

export async function updateJob(
    jobId: string,
    data: UpdateJobData,
    updatedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'maintenance:update');
    const jobRef = doc(db, JOBS_COLLECTION, jobId);

    const updateData: FirestoreDocData = {
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === 'IN_PROGRESS') {
            updateData.startedAt = Timestamp.now();
        }
        if (data.status === 'COMPLETED') {
            updateData.completedAt = Timestamp.now();
        }
    }
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.rootCause !== undefined) updateData.rootCause = data.rootCause;
    if (data.actionTaken !== undefined) updateData.actionTaken = data.actionTaken;

    await updateDoc(jobRef, updateData as Record<string, unknown>);

    // If completed, mark asset back to OPERATIONAL
    if (data.status === 'COMPLETED' || data.status === 'CLOSED') {
        const job = await getJobById(jobId);
        if (job) {
            const assetRef = doc(db, ASSETS_COLLECTION, job.assetId);
            await updateDoc(assetRef, {
                status: 'OPERATIONAL',
                lastPmDate: data.status === 'COMPLETED' ? Timestamp.now() : undefined,
                updatedAt: Timestamp.now(),
                updatedBy,
            });
        }
    }
}

// ============================================
// ISSUE PARTS TO JOB (Atomic Transaction)
// ============================================

export interface IssuePartsToJobData {
    jobId: string;
    parts: { partId: string; quantity: number }[];
}

export async function issuePartsToJob(
    data: IssuePartsToJobData,
    issuedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'maintenance:update');

    await runTransaction(db, async (transaction) => {
        // 1. Read job document
        const jobRef = doc(db, JOBS_COLLECTION, data.jobId);
        const jobSnap = await transaction.get(jobRef);
        if (!jobSnap.exists()) throw new Error('Job not found');
        const job = jobSnap.data() as MaintenanceJob;

        // 2. Read all selected spare part docs
        const partSnaps = await Promise.all(
            data.parts.map((p) => transaction.get(doc(db, SPARE_PARTS_COLLECTION, p.partId))),
        );

        // 3. Validate each part has sufficient stock
        const partDocs = partSnaps.map((snap, i) => {
            if (!snap.exists()) throw new Error(`Spare part ${data.parts[i].partId} not found`);
            const partData = snap.data();
            const requested = data.parts[i].quantity;
            if ((partData.currentStock as number) < requested) {
                throw new Error(
                    `Insufficient stock for ${partData.name}: available ${partData.currentStock}, requested ${requested}`,
                );
            }
            return { ref: snap.ref, data: partData, requested };
        });

        // 4. Build existing partsUsed map for merging
        const existingParts = new Map<string, JobPartUsed>();
        if (job.partsUsed) {
            for (const p of job.partsUsed) {
                existingParts.set(p.partId, { ...p });
            }
        }

        // 5. For each part: deduct stock, create transaction, merge into partsUsed
        for (let i = 0; i < partDocs.length; i++) {
            const { ref: partRef, data: partData, requested } = partDocs[i];
            const partId = data.parts[i].partId;
            const newStock = (partData.currentStock as number) - requested;

            // Deduct stock
            transaction.update(partRef, {
                currentStock: newStock,
                updatedAt: Timestamp.now(),
                updatedBy: issuedBy,
            });

            // Create SparePartTransaction (type=ISSUE) with jobId/jobNumber
            const transactionRef = doc(collection(db, SPARE_PARTS_TRANSACTIONS_COLLECTION));
            transaction.set(transactionRef, {
                partId,
                type: 'ISSUE',
                quantity: requested,
                balanceAfter: newStock,
                reason: `Issued to job ${job.jobNumber}`,
                issuedTo: issuedBy,
                jobId: data.jobId,
                jobNumber: job.jobNumber,
                createdAt: Timestamp.now(),
                createdBy: issuedBy,
                updatedAt: Timestamp.now(),
                updatedBy: issuedBy,
            });

            // Merge into partsUsed (increment quantity if already listed)
            const existing = existingParts.get(partId);
            if (existing) {
                existing.quantity += requested;
            } else {
                existingParts.set(partId, {
                    partId,
                    partNumber: partData.partNumber as string,
                    partName: partData.name as string,
                    quantity: requested,
                    unitPrice: (partData.unitPrice as number) || undefined,
                });
            }
        }

        // 6. Update job's partsUsed array
        transaction.update(jobRef, {
            partsUsed: Array.from(existingParts.values()),
            updatedAt: Timestamp.now(),
            updatedBy: issuedBy,
        });
    });
}

// ============================================
// JOB STATS
// ============================================

export async function getJobStats() {
    const jobs = await getJobs();

    const activeJobs = jobs.filter((j) => !['COMPLETED', 'CLOSED'].includes(j.status));
    const completedThisMonth = jobs.filter((j) => {
        if (j.status !== 'COMPLETED' || !j.completedAt) return false;
        const completed = j.completedAt.toDate ? j.completedAt.toDate() : new Date(j.completedAt as unknown as string);
        const now = new Date();
        return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear();
    });

    return {
        activeJobs: activeJobs.length,
        criticalJobs: activeJobs.filter((j) => j.priority === 'CRITICAL').length,
        pendingParts: activeJobs.filter((j) => j.status === 'PENDING_PARTS').length,
        completedThisMonth: completedThisMonth.length,
    };
}
