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
import { type FirestoreDocData, type UserRole } from '../../../types';
import { parseDoc, parseDocs, qualityCheckSchema } from '../../../lib/schemas';

const QC_CHECKS_COLLECTION = 'qualityChecks';

export type QCStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'ON_HOLD';
export type QCCheckType = 'VISUAL' | 'MEASUREMENT' | 'CHEMICAL' | 'PHYSICAL';

export interface QualityCheck {
    id: string;
    checkNumber: string;
    batchId: string;
    batchNumber: string;
    checkType: QCCheckType;
    status: QCStatus;
    parameters: QCParameter[];
    inspector: string;
    inspectedAt: Timestamp;
    notes?: string;
    createdAt: Timestamp;
    createdBy: string;
    updatedAt: Timestamp;
    updatedBy: string;
}

export interface QCParameter {
    name: string;
    expected: string;
    actual: string;
    passed: boolean;
}

export const QC_STATUS_CONFIG: Record<QCStatus, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'bg-blue-500/20 text-blue-400' },
    PASSED: { label: 'Passed', color: 'bg-green-500/20 text-green-400' },
    FAILED: { label: 'Failed', color: 'bg-red-500/20 text-red-400' },
    ON_HOLD: { label: 'On Hold', color: 'bg-yellow-500/20 text-yellow-400' },
};

export const QC_CHECK_TYPES: { value: QCCheckType; label: string }[] = [
    { value: 'VISUAL', label: 'Visual Inspection' },
    { value: 'MEASUREMENT', label: 'Measurement' },
    { value: 'CHEMICAL', label: 'Chemical Analysis' },
    { value: 'PHYSICAL', label: 'Physical Test' },
];

export const DEFAULT_PARAMETERS: Record<string, QCParameter[]> = {
    OIL: [
        { name: 'Color', expected: 'Dark Brown', actual: '', passed: false },
        { name: 'Viscosity', expected: '< 5 cSt', actual: '', passed: false },
        { name: 'Water Content', expected: '< 1%', actual: '', passed: false },
        { name: 'Density', expected: '0.85-0.95 g/ml', actual: '', passed: false },
    ],
    CARBON: [
        { name: 'Particle Size', expected: '< 100 mesh', actual: '', passed: false },
        { name: 'Moisture', expected: '< 2%', actual: '', passed: false },
        { name: 'Ash Content', expected: '< 15%', actual: '', passed: false },
    ],
    STEEL: [
        { name: 'Contamination', expected: 'None', actual: '', passed: false },
        { name: 'Rust Level', expected: 'Minimal', actual: '', passed: false },
    ],
};

async function generateCheckNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `QC-${year}`;
    const checksRef = collection(db, QC_CHECKS_COLLECTION);
    const q = query(
        checksRef,
        where('checkNumber', '>=', prefix + '-'),
        where('checkNumber', '<=', prefix + '-\uf8ff'),
        orderBy('checkNumber', 'desc'),
        limit(1),
    );
    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const last = snapshot.docs[0].data() as QualityCheck;
        const num = parseInt(last.checkNumber.split('-')[2]) || 0;
        nextNumber = num + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

export async function getQualityChecks(limitCount = 100): Promise<QualityCheck[]> {
    const checksRef = collection(db, QC_CHECKS_COLLECTION);
    const q = query(checksRef, orderBy('inspectedAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(qualityCheckSchema, raw, 'getQualityChecks') as QualityCheck[];
}

export async function getQualityChecksByBatch(batchId: string): Promise<QualityCheck[]> {
    const checksRef = collection(db, QC_CHECKS_COLLECTION);
    const q = query(checksRef, where('batchId', '==', batchId));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(qualityCheckSchema, raw, 'getQualityChecksByBatch') as QualityCheck[];
}

export async function getQualityCheckById(checkId: string): Promise<QualityCheck | null> {
    const checkRef = doc(db, QC_CHECKS_COLLECTION, checkId);
    const snapshot = await getDoc(checkRef);
    if (!snapshot.exists()) return null;
    return parseDoc(qualityCheckSchema, { id: snapshot.id, ...snapshot.data() }, 'getQualityCheckById') as QualityCheck;
}

export interface CreateQualityCheckData {
    batchId: string;
    batchNumber: string;
    checkType: QCCheckType;
    parameters: QCParameter[];
    notes?: string;
}

export async function createQualityCheck(
    data: CreateQualityCheckData,
    inspector: string,
    callerRole?: UserRole,
): Promise<string> {
    assertAuthorized(callerRole, 'quality:create');
    const checkNumber = await generateCheckNumber();
    const allPassed = data.parameters.every((p) => p.passed);
    const anyFailed = data.parameters.some((p) => !p.passed && p.actual);

    const checkData: FirestoreDocData = {
        checkNumber,
        batchId: data.batchId,
        batchNumber: data.batchNumber,
        checkType: data.checkType,
        status: anyFailed ? 'FAILED' : allPassed ? 'PASSED' : 'PENDING',
        parameters: data.parameters,
        inspector,
        inspectedAt: Timestamp.now(),
        notes: data.notes || null,
        createdAt: Timestamp.now(),
        createdBy: inspector,
        updatedAt: Timestamp.now(),
        updatedBy: inspector,
    };

    const checksRef = collection(db, QC_CHECKS_COLLECTION);
    const docRef = await addDoc(checksRef, checkData);
    return docRef.id;
}

export async function updateQualityCheck(
    checkId: string,
    data: { status?: QCStatus; parameters?: QCParameter[]; notes?: string },
    updatedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'quality:update');
    const checkRef = doc(db, QC_CHECKS_COLLECTION, checkId);
    const updateData: FirestoreDocData = {
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    if (data.status) updateData.status = data.status;
    if (data.parameters) updateData.parameters = data.parameters;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    await updateDoc(checkRef, updateData as Record<string, unknown>);
}

export async function getQCStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const checksRef = collection(db, QC_CHECKS_COLLECTION);
    const q = query(
        checksRef,
        where('inspectedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('inspectedAt', 'desc'),
        limit(500),
    );
    const snapshot = await getDocs(q);
    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const recentChecks = parseDocs(qualityCheckSchema, raw, 'getQCStats') as QualityCheck[];

    return {
        totalChecks: recentChecks.length,
        passed: recentChecks.filter((c) => c.status === 'PASSED').length,
        failed: recentChecks.filter((c) => c.status === 'FAILED').length,
        pending: recentChecks.filter((c) => c.status === 'PENDING').length,
        passRate:
            recentChecks.length > 0
                ? Math.round((recentChecks.filter((c) => c.status === 'PASSED').length / recentChecks.length) * 100)
                : 0,
    };
}
