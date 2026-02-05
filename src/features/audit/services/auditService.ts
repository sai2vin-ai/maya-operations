import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where,
    Timestamp,
    startAfter,
    type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { AuditLog, AuditFilters } from '../types';

const AUDIT_COLLECTION = 'auditLogs';
const DEFAULT_LIMIT = 50;

/**
 * Get audit logs with optional filters
 */
export async function getAuditLogs(
    filters?: AuditFilters,
    pageSize: number = DEFAULT_LIMIT,
    lastDoc?: QueryDocumentSnapshot
): Promise<{ logs: AuditLog[]; lastDoc: QueryDocumentSnapshot | null }> {
    const auditRef = collection(db, AUDIT_COLLECTION);

    // Build query constraints
    const constraints: Parameters<typeof query>[1][] = [];

    // Filter by collection
    if (filters?.collection) {
        constraints.push(where('collection', '==', filters.collection));
    }

    // Filter by date range
    if (filters?.startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(endOfDay)));
    }

    // Always order by timestamp descending
    constraints.push(orderBy('timestamp', 'desc'));

    // Pagination
    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }

    constraints.push(limit(pageSize));

    const q = query(auditRef, ...constraints);
    const snapshot = await getDocs(q);

    const logs: AuditLog[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as AuditLog[];

    // Apply client-side filters that can't be done in Firestore
    let filteredLogs = logs;

    // Filter by action type (client-side because of complex matching)
    if (filters?.action) {
        filteredLogs = filteredLogs.filter((log) =>
            log.action.includes(filters.action!)
        );
    }

    // Filter by search query (client-side)
    if (filters?.searchQuery) {
        const search = filters.searchQuery.toLowerCase();
        filteredLogs = filteredLogs.filter((log) => {
            const dataStr = JSON.stringify(log.data || {}).toLowerCase();
            return (
                log.action.toLowerCase().includes(search) ||
                log.collection.toLowerCase().includes(search) ||
                log.documentId.toLowerCase().includes(search) ||
                dataStr.includes(search)
            );
        });
    }

    const newLastDoc = snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

    return { logs: filteredLogs, lastDoc: newLastDoc };
}

/**
 * Get audit logs for a specific document
 */
export async function getAuditLogsByDocument(
    collectionName: string,
    documentId: string,
    pageSize: number = 20
): Promise<AuditLog[]> {
    const auditRef = collection(db, AUDIT_COLLECTION);
    const q = query(
        auditRef,
        where('collection', '==', collectionName),
        where('documentId', '==', documentId),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as AuditLog[];
}

/**
 * Get audit logs by user
 */
export async function getAuditLogsByUser(
    userId: string,
    pageSize: number = 50
): Promise<AuditLog[]> {
    const auditRef = collection(db, AUDIT_COLLECTION);
    const q = query(
        auditRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as AuditLog[];
}

/**
 * Get recent audit logs for dashboard
 */
export async function getRecentAuditLogs(count: number = 10): Promise<AuditLog[]> {
    const auditRef = collection(db, AUDIT_COLLECTION);
    const q = query(
        auditRef,
        orderBy('timestamp', 'desc'),
        limit(count)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as AuditLog[];
}

/**
 * Get audit log count for a time period
 */
export async function getAuditLogCount(
    startDate: Date,
    endDate: Date
): Promise<number> {
    const auditRef = collection(db, AUDIT_COLLECTION);
    const q = query(
        auditRef,
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
}
