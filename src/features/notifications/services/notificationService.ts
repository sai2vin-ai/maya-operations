import {
    collection,
    collectionGroup,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    setDoc,
    writeBatch,
    onSnapshot,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { AppNotification } from '../../../types';
import { parseDocs, appNotificationSchema } from '../../../lib/schemas';

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function getNotifications(maxResults = 50): Promise<AppNotification[]> {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('createdAt', 'desc'), limit(maxResults));

    const snapshot = await getDocs(q);
    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(appNotificationSchema, raw, 'getNotifications') as AppNotification[];
}

export async function getReadNotificationIds(userId: string): Promise<Set<string>> {
    // Use collection group query to fetch all readBy docs for this user in a single read.
    // Each readBy doc stores userId field + readAt, and the doc ID is the userId.
    const readByQuery = query(collectionGroup(db, 'readBy'), where('userId', '==', userId));
    const snapshot = await getDocs(readByQuery);

    const readIds = new Set<string>();
    for (const docSnap of snapshot.docs) {
        // doc path: notifications/{notificationId}/readBy/{userId}
        const notificationId = docSnap.ref.parent.parent?.id;
        if (notificationId) readIds.add(notificationId);
    }

    return readIds;
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
    const readByRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId, 'readBy', userId);
    await setDoc(readByRef, {
        userId,
        readAt: Timestamp.now(),
    });
}

export async function markAllAsRead(notificationIds: string[], userId: string): Promise<void> {
    const batch = writeBatch(db);

    for (const notificationId of notificationIds) {
        const readByRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId, 'readBy', userId);
        batch.set(readByRef, {
            userId,
            readAt: Timestamp.now(),
        });
    }

    await batch.commit();
}

export function subscribeToNotifications(
    callback: (notifications: AppNotification[]) => void,
    maxResults = 50,
): () => void {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('createdAt', 'desc'), limit(maxResults));

    return onSnapshot(q, (snapshot) => {
        const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const notifications = parseDocs(appNotificationSchema, raw, 'subscribeToNotifications') as AppNotification[];
        callback(notifications);
    });
}
