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
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { assertAuthorized } from '../../../lib/authorization';
import type { Asset, MaintenanceJob, AssetStatus, AssetCriticality, JobType, JobPriority, JobStatus } from '../../../types';
import { type FirestoreDocData, type UserRole } from '../../../types';

const ASSETS_COLLECTION = 'assets';
const JOBS_COLLECTION = 'maintenanceJobs';

// ============================================
// CONSTANTS
// ============================================

export const ASSET_CATEGORIES = [
    { value: 'REACTOR', label: 'Reactor' },
    { value: 'PUMP', label: 'Pump' },
    { value: 'CONVEYOR', label: 'Conveyor' },
    { value: 'COMPRESSOR', label: 'Compressor' },
    { value: 'VALVE', label: 'Valve' },
    { value: 'MOTOR', label: 'Motor' },
    { value: 'ELECTRICAL', label: 'Electrical Panel' },
    { value: 'WEIGHBRIDGE', label: 'Weighbridge' },
    { value: 'OTHER', label: 'Other' },
];

export const ASSET_LOCATIONS = [
    'Reactor Bay 1', 'Reactor Bay 2', 'Reactor Bay 3',
    'Gate Area', 'Weighbridge Area', 'Storage Yard',
    'Control Room', 'Workshop', 'Utility Block',
];

export const ASSET_STATUS_CONFIG: Record<AssetStatus, { label: string; color: string }> = {
    OPERATIONAL: { label: 'Operational', color: 'bg-green-500/20 text-green-400' },
    BREAKDOWN: { label: 'Breakdown', color: 'bg-red-500/20 text-red-400' },
    UNDER_MAINTENANCE: { label: 'Under Maintenance', color: 'bg-yellow-500/20 text-yellow-400' },
    DECOMMISSIONED: { label: 'Decommissioned', color: 'bg-slate-500/20 text-slate-400' },
};

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
// ASSET OPERATIONS
// ============================================

async function generateAssetCode(): Promise<string> {
    const prefix = 'AST';
    const assetsRef = collection(db, ASSETS_COLLECTION);
    const q = query(
        assetsRef,
        where('assetCode', '>=', prefix + '-'),
        where('assetCode', '<=', prefix + '-\uf8ff'),
        orderBy('assetCode', 'desc'),
        limit(1)
    );
    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastAsset = snapshot.docs[0].data() as Asset;
        const num = parseInt(lastAsset.assetCode.split('-')[1]) || 0;
        nextNumber = num + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

export async function getAssets(limitCount = 100): Promise<Asset[]> {
    const assetsRef = collection(db, ASSETS_COLLECTION);
    const q = query(assetsRef, orderBy('assetCode', 'asc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
    })) as Asset[];
}

export async function getAssetById(assetId: string): Promise<Asset | null> {
    const assetRef = doc(db, ASSETS_COLLECTION, assetId);
    const snapshot = await getDoc(assetRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Asset;
}

export interface CreateAssetData {
    name: string;
    category: string;
    location: string;
    criticality: AssetCriticality;
    installationDate?: string;
    pmFrequencyDays?: number;
}

export async function createAsset(
    data: CreateAssetData,
    createdBy: string,
    callerRole?: UserRole
): Promise<string> {
    assertAuthorized(callerRole, 'maintenance:create');
    const assetCode = await generateAssetCode();

    const assetData: FirestoreDocData = {
        assetCode,
        name: data.name,
        category: data.category,
        location: data.location,
        criticality: data.criticality,
        status: 'OPERATIONAL' as AssetStatus,
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    if (data.installationDate) {
        assetData.installationDate = Timestamp.fromDate(new Date(data.installationDate));
    }
    if (data.pmFrequencyDays) {
        assetData.pmFrequencyDays = data.pmFrequencyDays;
        const nextPm = new Date();
        nextPm.setDate(nextPm.getDate() + data.pmFrequencyDays);
        assetData.nextPmDate = Timestamp.fromDate(nextPm);
    }

    const assetsRef = collection(db, ASSETS_COLLECTION);
    const docRef = await addDoc(assetsRef, assetData);
    return docRef.id;
}

export interface UpdateAssetData {
    name?: string;
    category?: string;
    location?: string;
    criticality?: AssetCriticality;
    status?: AssetStatus;
    pmFrequencyDays?: number;
}

export async function updateAsset(
    assetId: string,
    data: UpdateAssetData,
    updatedBy: string,
    callerRole?: UserRole
): Promise<void> {
    assertAuthorized(callerRole, 'maintenance:update');
    const assetRef = doc(db, ASSETS_COLLECTION, assetId);

    const updateData: FirestoreDocData = {
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.criticality !== undefined) updateData.criticality = data.criticality;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.pmFrequencyDays !== undefined) {
        updateData.pmFrequencyDays = data.pmFrequencyDays;
        const nextPm = new Date();
        nextPm.setDate(nextPm.getDate() + data.pmFrequencyDays);
        updateData.nextPmDate = Timestamp.fromDate(nextPm);
    }

    await updateDoc(assetRef, updateData as Record<string, unknown>);
}

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
        limit(1)
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

    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
    })) as MaintenanceJob[];
}

export async function getJobsByAsset(assetId: string): Promise<MaintenanceJob[]> {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const q = query(jobsRef, where('assetId', '==', assetId));
    const snapshot = await getDocs(q);

    const jobs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
    })) as MaintenanceJob[];

    return jobs.sort((a, b) => {
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

export async function createJob(
    data: CreateJobData,
    reportedBy: string,
    callerRole?: UserRole
): Promise<string> {
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
    partsUsed?: { itemId: string; quantity: number }[];
}

export async function updateJob(
    jobId: string,
    data: UpdateJobData,
    updatedBy: string,
    callerRole?: UserRole
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
    if (data.partsUsed !== undefined) updateData.partsUsed = data.partsUsed;

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
// DASHBOARD STATS
// ============================================

export async function getMaintenanceStats() {
    const [assets, jobs] = await Promise.all([getAssets(), getJobs()]);

    const activeJobs = jobs.filter(j => !['COMPLETED', 'CLOSED'].includes(j.status));
    const breakdownAssets = assets.filter(a => a.status === 'BREAKDOWN');

    const now = new Date();
    const pmDueAssets = assets.filter(a => {
        if (!a.nextPmDate) return false;
        const nextPm = a.nextPmDate.toDate ? a.nextPmDate.toDate() : new Date(a.nextPmDate as unknown as string);
        return nextPm <= now;
    });

    return {
        totalAssets: assets.length,
        operationalAssets: assets.filter(a => a.status === 'OPERATIONAL').length,
        breakdownAssets: breakdownAssets.length,
        underMaintenance: assets.filter(a => a.status === 'UNDER_MAINTENANCE').length,
        totalJobs: jobs.length,
        activeJobs: activeJobs.length,
        criticalJobs: activeJobs.filter(j => j.priority === 'CRITICAL').length,
        pmDue: pmDueAssets.length,
    };
}
