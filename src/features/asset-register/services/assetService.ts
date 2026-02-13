import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { assertAuthorized } from '../../../lib/authorization';
import type { Asset, AssetStatus, AssetCriticality, ReactorStatus } from '../../../types';
import { type FirestoreDocData, type UserRole } from '../../../types';

const ASSETS_COLLECTION = 'assets';

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
    'Reactor Bay 1',
    'Reactor Bay 2',
    'Reactor Bay 3',
    'Gate Area',
    'Weighbridge Area',
    'Storage Yard',
    'Control Room',
    'Workshop',
    'Utility Block',
];

export const ASSET_STATUS_CONFIG: Record<AssetStatus, { label: string; color: string }> = {
    OPERATIONAL: { label: 'Operational', color: 'bg-green-500/20 text-green-400' },
    BREAKDOWN: { label: 'Breakdown', color: 'bg-red-500/20 text-red-400' },
    UNDER_MAINTENANCE: { label: 'Under Maintenance', color: 'bg-yellow-500/20 text-yellow-400' },
    DECOMMISSIONED: { label: 'Decommissioned', color: 'bg-slate-500/20 text-slate-400' },
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
        limit(1),
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

    return snapshot.docs.map((d) => ({
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
    parentAssetIds?: string[];
    reactorNumber?: string;
}

export async function createAsset(data: CreateAssetData, createdBy: string, callerRole?: UserRole): Promise<string> {
    assertAuthorized(callerRole, 'asset_register:create');
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
    if (data.parentAssetIds && data.parentAssetIds.length > 0) {
        assetData.parentAssetIds = data.parentAssetIds;
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
    parentAssetIds?: string[];
    inputItemIds?: string[];
    outputItemIds?: string[];
}

export async function updateAsset(
    assetId: string,
    data: UpdateAssetData,
    updatedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'asset_register:update');
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
    if (data.parentAssetIds !== undefined) updateData.parentAssetIds = data.parentAssetIds;
    if (data.inputItemIds !== undefined) updateData.inputItemIds = data.inputItemIds;
    if (data.outputItemIds !== undefined) updateData.outputItemIds = data.outputItemIds;

    await updateDoc(assetRef, updateData as Record<string, unknown>);
}

// ============================================
// STATS
// ============================================

export async function getAssetStats() {
    const assets = await getAssets();

    const now = new Date();
    const pmDueAssets = assets.filter((a) => {
        if (!a.nextPmDate) return false;
        const nextPm = a.nextPmDate.toDate ? a.nextPmDate.toDate() : new Date(a.nextPmDate as unknown as string);
        return nextPm <= now;
    });

    return {
        totalAssets: assets.length,
        operationalAssets: assets.filter((a) => a.status === 'OPERATIONAL').length,
        breakdownAssets: assets.filter((a) => a.status === 'BREAKDOWN').length,
        underMaintenance: assets.filter((a) => a.status === 'UNDER_MAINTENANCE').length,
        pmDue: pmDueAssets.length,
    };
}

// ============================================
// REACTOR-SPECIFIC OPERATIONS
// ============================================

export const REACTOR_STATUSES: { value: ReactorStatus; label: string; color: string }[] = [
    { value: 'IDLE', label: 'Idle', color: 'bg-gray-500/20 text-gray-400' },
    { value: 'IN_BATCH', label: 'In Batch', color: 'bg-green-500/20 text-green-400' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-yellow-500/20 text-yellow-400' },
    { value: 'OFFLINE', label: 'Offline', color: 'bg-red-500/20 text-red-400' },
];

export function getReactorStatusInfo(status: ReactorStatus) {
    return REACTOR_STATUSES.find((s) => s.value === status) || REACTOR_STATUSES[0];
}

/** Fetches all assets with category === 'REACTOR'. */
export async function getReactorAssets(): Promise<Asset[]> {
    const assetsRef = collection(db, ASSETS_COLLECTION);
    const q = query(assetsRef, where('category', '==', 'REACTOR'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as Asset[];
}

/** Fetches a single reactor asset by ID. */
export async function getReactorAssetById(assetId: string): Promise<Asset | null> {
    return getAssetById(assetId);
}

/** Fetches reactor assets by reactor status. */
export async function getReactorAssetsByStatus(status: ReactorStatus): Promise<Asset[]> {
    const assetsRef = collection(db, ASSETS_COLLECTION);
    const q = query(assetsRef, where('category', '==', 'REACTOR'), where('reactorStatus', '==', status));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as Asset[];
}

export interface CreateReactorAssetData {
    reactorNumber: string;
    name: string;
    location?: string;
}

/** Creates a reactor asset with deterministic ID. */
export async function createReactorAsset(data: CreateReactorAssetData, createdBy: string): Promise<string> {
    const reactorId = `reactor_${data.reactorNumber}`;
    const reactorRef = doc(db, ASSETS_COLLECTION, reactorId);
    const assetCode = await generateAssetCode();

    const assetData: FirestoreDocData = {
        assetCode,
        name: data.name,
        category: 'REACTOR',
        location: data.location || 'Reactor Bay 1',
        criticality: 'HIGH' as AssetCriticality,
        status: 'OPERATIONAL' as AssetStatus,
        reactorNumber: data.reactorNumber,
        reactorStatus: 'IDLE' as ReactorStatus,
        totalBatches: 0,
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    await setDoc(reactorRef, assetData);
    return reactorId;
}

/** Updates the reactor-specific status on an asset. */
export async function updateReactorStatus(
    assetId: string,
    reactorStatus: ReactorStatus,
    currentBatchId?: string | null,
    updatedBy?: string,
): Promise<void> {
    const assetRef = doc(db, ASSETS_COLLECTION, assetId);

    const updateData: FirestoreDocData = {
        reactorStatus,
        updatedAt: Timestamp.now(),
    };

    if (currentBatchId !== undefined) {
        updateData.currentBatchId = currentBatchId;
    }
    if (updatedBy) {
        updateData.updatedBy = updatedBy;
    }

    await updateDoc(assetRef, updateData as Record<string, unknown>);
}

/** Sets a reactor asset to MAINTENANCE status. */
export async function setReactorMaintenance(assetId: string, updatedBy: string): Promise<void> {
    await updateReactorStatus(assetId, 'MAINTENANCE', undefined, updatedBy);
}

/** Sets a reactor asset to IDLE status. */
export async function setReactorIdle(assetId: string, updatedBy: string): Promise<void> {
    await updateReactorStatus(assetId, 'IDLE', undefined, updatedBy);
}

// ============================================
// HIERARCHY OPERATIONS
// ============================================

/** Fetches all child assets for a given parent asset. */
export async function getChildAssets(parentAssetId: string): Promise<Asset[]> {
    const assetsRef = collection(db, ASSETS_COLLECTION);
    const q = query(assetsRef, where('parentAssetIds', 'array-contains', parentAssetId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as Asset[];
}

/** Fetches multiple assets by their IDs (for resolving parent names). */
export async function getAssetsByIds(ids: string[]): Promise<Asset[]> {
    if (ids.length === 0) return [];

    const results: Asset[] = [];
    for (const id of ids) {
        const asset = await getAssetById(id);
        if (asset) results.push(asset);
    }
    return results;
}
