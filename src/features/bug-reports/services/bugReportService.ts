import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    Timestamp,
    getCountFromServer,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import type { BugReport, BugReportStatus, CreateBugReportData } from '../types';
import type { FirestoreDocData } from '../../../types';
import { assertAuthorized } from '../../../lib/authorization';
import type { UserRole } from '../../../types';

const BUG_REPORTS_COLLECTION = 'bugReports';

async function getNextReportNumber(): Promise<string> {
    const colRef = collection(db, BUG_REPORTS_COLLECTION);
    const snapshot = await getCountFromServer(colRef);
    const count = snapshot.data().count;
    return `BR-${String(count + 1).padStart(3, '0')}`;
}

export async function createBugReport(
    data: CreateBugReportData,
    createdBy: { userId: string; displayName: string; role: string },
    file?: File,
    callerRole?: UserRole,
): Promise<string> {
    assertAuthorized(callerRole, 'bug_reports:create');

    const reportNumber = await getNextReportNumber();

    let screenshotUrl: string | undefined;
    if (file) {
        const storageRef = ref(storage, `bug-reports/${reportNumber}/${file.name}`);
        await uploadBytes(storageRef, file);
        screenshotUrl = await getDownloadURL(storageRef);
    }

    const reportDoc: FirestoreDocData = {
        reportNumber,
        title: data.title.trim(),
        description: data.description.trim(),
        priority: data.priority,
        status: 'open',
        pageUrl: data.pageUrl,
        browserInfo: data.browserInfo,
        createdBy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    if (screenshotUrl) {
        reportDoc.screenshotUrl = screenshotUrl;
    }

    const docRef = await addDoc(collection(db, BUG_REPORTS_COLLECTION), reportDoc);
    return docRef.id;
}

export async function getBugReports(): Promise<BugReport[]> {
    const colRef = collection(db, BUG_REPORTS_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as BugReport[];
}

export async function getBugReport(id: string): Promise<BugReport | null> {
    const docRef = doc(db, BUG_REPORTS_COLLECTION, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    return { id: snapshot.id, ...snapshot.data() } as BugReport;
}

export async function updateBugReportStatus(
    id: string,
    status: BugReportStatus,
    adminNotes?: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'bug_reports:manage');

    const docRef = doc(db, BUG_REPORTS_COLLECTION, id);
    const updateData: FirestoreDocData = {
        status,
        updatedAt: Timestamp.now(),
    };

    if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
    }

    if (status === 'resolved') {
        updateData.resolvedAt = Timestamp.now();
    }

    await updateDoc(docRef, updateData);
}
