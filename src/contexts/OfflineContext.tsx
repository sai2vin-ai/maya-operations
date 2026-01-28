/**
 * Offline Context
 * Provides offline/online status and sync functionality to the app
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    initSyncService,
    destroySyncService,
    syncPendingOperations,
    onSyncStateChange,
} from '../services/syncService';
import { getQueueStats, isOnline as checkIsOnline } from '../services/offlineQueue';

interface OfflineContextType {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
    syncError: string | null;
    manualSync: () => Promise<void>;
    refreshStats: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function useOffline(): OfflineContextType {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
}

interface OfflineProviderProps {
    children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
    const [isOnline, setIsOnline] = useState(checkIsOnline());
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [syncError, setSyncError] = useState<string | null>(null);

    // Refresh queue stats
    const refreshStats = useCallback(async () => {
        try {
            const stats = await getQueueStats();
            setPendingCount(stats.pending);
            setFailedCount(stats.failed);
        } catch (error) {
            console.error('Failed to get queue stats:', error);
        }
    }, []);

    // Manual sync trigger
    const manualSync = useCallback(async () => {
        setSyncError(null);
        const result = await syncPendingOperations();
        await refreshStats();
        if (result.failed > 0) {
            setSyncError(`${result.failed} operations failed to sync`);
        }
    }, [refreshStats]);

    // Initialize sync service
    useEffect(() => {
        initSyncService();

        // Listen for sync state changes
        const unsubscribeSyncState = onSyncStateChange((syncing, error) => {
            setIsSyncing(syncing);
            if (error) setSyncError(error);
            refreshStats();
        });

        // Listen for online/offline
        const handleOnline = () => {
            setIsOnline(true);
            setSyncError(null);
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial stats
        refreshStats();

        return () => {
            destroySyncService();
            unsubscribeSyncState();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [refreshStats]);

    // Refresh stats periodically when syncing or when there are pending operations
    useEffect(() => {
        if (isSyncing || pendingCount > 0) {
            const interval = setInterval(refreshStats, 2000);
            return () => clearInterval(interval);
        }
    }, [isSyncing, pendingCount, refreshStats]);

    const value: OfflineContextType = {
        isOnline,
        isSyncing,
        pendingCount,
        failedCount,
        syncError,
        manualSync,
        refreshStats,
    };

    return (
        <OfflineContext.Provider value={value}>
            {children}
        </OfflineContext.Provider>
    );
}
