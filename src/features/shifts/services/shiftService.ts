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
import type { Shift, ShiftType } from '../../../types';
import { type FirestoreDocData, type UserRole } from '../../../types';
import { parseDoc, parseDocs, shiftSchema } from '../../../lib/schemas';

const SHIFTS_COLLECTION = 'shifts';

export const SHIFT_TYPES: { value: ShiftType; label: string; time: string }[] = [
    { value: 'A', label: 'Shift A (Morning)', time: '06:00 - 14:00' },
    { value: 'B', label: 'Shift B (Afternoon)', time: '14:00 - 22:00' },
    { value: 'C', label: 'Shift C (Night)', time: '22:00 - 06:00' },
];

export async function getShifts(limitCount = 50): Promise<Shift[]> {
    const shiftsRef = collection(db, SHIFTS_COLLECTION);
    const q = query(shiftsRef, orderBy('date', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(shiftSchema, raw, 'getShifts') as Shift[];
}

export async function getShiftById(shiftId: string): Promise<Shift | null> {
    const shiftRef = doc(db, SHIFTS_COLLECTION, shiftId);
    const snapshot = await getDoc(shiftRef);
    if (!snapshot.exists()) return null;
    return parseDoc(shiftSchema, { id: snapshot.id, ...snapshot.data() }, 'getShiftById') as Shift;
}

export async function getActiveShift(): Promise<Shift | null> {
    const shiftsRef = collection(db, SHIFTS_COLLECTION);
    const q = query(shiftsRef, where('endTime', '==', null), orderBy('date', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return parseDoc(shiftSchema, { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }, 'getActiveShift') as Shift;
}

export interface StartShiftData {
    shiftType: ShiftType;
    supervisorId: string;
}

export async function startShift(data: StartShiftData, createdBy: string, callerRole?: UserRole): Promise<string> {
    assertAuthorized(callerRole, 'shifts:create');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const shiftData: FirestoreDocData = {
        shiftType: data.shiftType,
        date: Timestamp.fromDate(new Date(dateStr)),
        supervisorId: data.supervisorId,
        startTime: Timestamp.now(),
        endTime: null,
        handoverNotes: null,
        incomingSupervisorId: null,
        handoverAcknowledged: false,
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    const shiftsRef = collection(db, SHIFTS_COLLECTION);
    const docRef = await addDoc(shiftsRef, shiftData);
    return docRef.id;
}

export interface EndShiftData {
    handoverNotes: string;
    incomingSupervisorId?: string;
}

export async function endShift(
    shiftId: string,
    data: EndShiftData,
    updatedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'shifts:update');
    const shiftRef = doc(db, SHIFTS_COLLECTION, shiftId);

    const updateData: FirestoreDocData = {
        endTime: Timestamp.now(),
        handoverNotes: data.handoverNotes,
        updatedAt: Timestamp.now(),
        updatedBy,
    };

    if (data.incomingSupervisorId) {
        updateData.incomingSupervisorId = data.incomingSupervisorId;
    }

    await updateDoc(shiftRef, updateData as Record<string, unknown>);
}

export async function acknowledgeHandover(shiftId: string, userId: string, callerRole?: UserRole): Promise<void> {
    assertAuthorized(callerRole, 'shifts:update');
    const shiftRef = doc(db, SHIFTS_COLLECTION, shiftId);
    await updateDoc(shiftRef, {
        handoverAcknowledged: true,
        handoverAcknowledgedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: userId,
    });
}
