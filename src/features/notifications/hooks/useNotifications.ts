import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import {
    getNotifications,
    getReadNotificationIds,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
} from '../services/notificationService';
import type { AppNotification } from '../../../types';

export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
    readIds: (userId: string) => [...notificationKeys.all, 'readIds', userId] as const,
};

export function useNotifications() {
    const { userData } = useAuth();

    return useQuery({
        queryKey: notificationKeys.lists(),
        queryFn: () => getNotifications(50),
        select: (notifications) => {
            if (!userData?.role) return notifications;
            return notifications.filter(n =>
                n.targetRoles.includes(userData.role)
            );
        },
    });
}

export function useReadNotificationIds() {
    const { userData } = useAuth();
    const userId = userData?.id || '';

    return useQuery({
        queryKey: notificationKeys.readIds(userId),
        queryFn: () => getReadNotificationIds(userId),
        enabled: !!userId,
    });
}

export function useUnreadCount() {
    const { data: notifications } = useNotifications();
    const { data: readIds } = useReadNotificationIds();

    if (!notifications || !readIds) return 0;
    return notifications.filter(n => !readIds.has(n.id)).length;
}

export function useMarkAsRead() {
    const queryClient = useQueryClient();
    const { userData } = useAuth();

    return useMutation({
        mutationFn: (notificationId: string) =>
            markAsRead(notificationId, userData?.id || ''),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.readIds(userData?.id || '') });
        },
    });
}

export function useMarkAllAsRead() {
    const queryClient = useQueryClient();
    const { userData } = useAuth();
    const { data: notifications } = useNotifications();

    return useMutation({
        mutationFn: () => {
            const ids = notifications?.map((n: AppNotification) => n.id) || [];
            return markAllAsRead(ids, userData?.id || '');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.readIds(userData?.id || '') });
        },
    });
}

export function useRealtimeNotifications() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const unsubscribe = subscribeToNotifications(() => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        });

        return unsubscribe;
    }, [queryClient]);
}
