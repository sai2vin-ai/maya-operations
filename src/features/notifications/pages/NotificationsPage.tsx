import { useNavigate } from 'react-router-dom';
import {
    useNotifications,
    useReadNotificationIds,
    useMarkAsRead,
    useMarkAllAsRead,
    useRealtimeNotifications,
} from '../hooks/useNotifications';
import type { AppNotification, NotificationType } from '../../../types';

const TYPE_CONFIG: Record<NotificationType, { color: string; bg: string; icon: string }> = {
    info: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    success: { color: 'text-green-400', bg: 'bg-green-500/20', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    alert: { color: 'text-red-400', bg: 'bg-red-500/20', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

const ENTITY_ROUTES: Record<string, string> = {
    gateEntry: '/gate',
    batch: '/batch',
    reactor: '/reactor',
    user: '/users',
    device: '/devices',
};

function getRelativeTime(timestamp: unknown): string {
    if (!timestamp) return '';
    const ts = timestamp as { toDate?: () => Date };
    const date = ts.toDate ? ts.toDate() : new Date(timestamp as string | number);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { data: notifications, isLoading } = useNotifications();
    const { data: readIds } = useReadNotificationIds();
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    useRealtimeNotifications();

    const handleNotificationClick = (notification: AppNotification) => {
        if (readIds && !readIds.has(notification.id)) {
            markAsRead.mutate(notification.id);
        }

        if (notification.entityType && notification.entityId) {
            const baseRoute = ENTITY_ROUTES[notification.entityType];
            if (baseRoute) {
                navigate(`${baseRoute}/${notification.entityId}`);
            }
        }
    };

    const unreadCount = notifications?.filter(n => readIds && !readIds.has(n.id)).length || 0;

    return (
        <div className="">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
                            <p className="text-sm text-foreground-muted">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                            </p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllAsRead.mutate()}
                            disabled={markAllAsRead.isPending}
                            className="btn-secondary text-sm"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
            </header>

            <main className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : !notifications || notifications.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <svg className="w-16 h-16 text-foreground-faint mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <h3 className="text-lg font-semibold text-foreground mb-1">No notifications</h3>
                        <p className="text-foreground-muted">You're all caught up! Notifications will appear here when there's activity.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((notification) => {
                            const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
                            const isUnread = readIds && !readIds.has(notification.id);
                            const isClickable = notification.entityType && notification.entityId;

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`glass-card p-4 flex items-start gap-3 transition-colors ${
                                        isClickable ? 'cursor-pointer hover:bg-surface-hover' : ''
                                    } ${isUnread ? 'border-l-2 border-l-blue-500' : ''}`}
                                >
                                    {/* Type Icon */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                                        <svg className={`w-5 h-5 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                                        </svg>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm font-semibold ${isUnread ? 'text-foreground' : 'text-foreground-secondary'}`}>
                                                {notification.title}
                                            </h4>
                                            {isUnread && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-sm text-foreground-muted mt-0.5 truncate">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-foreground-faint mt-1">
                                            {getRelativeTime(notification.createdAt)}
                                        </p>
                                    </div>

                                    {/* Arrow for clickable */}
                                    {isClickable && (
                                        <svg className="w-4 h-4 text-foreground-faint flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
