import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    setDoc,
    writeBatch,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { AppNotification } from '../../../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function getNotifications(maxResults = 50): Promise<AppNotification[]> {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
    })) as AppNotification[];
}

export async function getReadNotificationIds(userId: string): Promise<Set<string>> {
    const notifications = await getNotifications(100);
    const readIds = new Set<string>();

    for (const notification of notifications) {
        try {
            const readBySnap = await getDocs(
                query(collection(db, NOTIFICATIONS_COLLECTION, notification.id, 'readBy'), limit(1))
            );
            const userDoc = readBySnap.docs.find(d => d.id === userId);
            if (userDoc) {
                readIds.add(notification.id);
            }
        } catch {
            // Ignore individual read errors
        }
    }

    return readIds;
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
    const readByRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId, 'readBy', userId);
    await setDoc(readByRef, {
        readAt: Timestamp.now(),
    });
}

export async function markAllAsRead(notificationIds: string[], userId: string): Promise<void> {
    const batch = writeBatch(db);

    for (const notificationId of notificationIds) {
        const readByRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId, 'readBy', userId);
        batch.set(readByRef, {
            readAt: Timestamp.now(),
        });
    }

    await batch.commit();
}

export function subscribeToNotifications(
    callback: (notifications: AppNotification[]) => void,
    maxResults = 50
): () => void {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
        })) as AppNotification[];
        callback(notifications);
    });
}
