/**
 * Sync Status Indicator Component
 * Shows online/offline status and pending sync operations
 */

import { useOffline } from '../contexts/OfflineContext';

export function SyncStatusIndicator() {
    const { isOnline, isSyncing, pendingCount, failedCount, syncError, manualSync } = useOffline();

    // Don't show anything if online and no pending operations
    if (isOnline && pendingCount === 0 && failedCount === 0 && !syncError) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`glass-card p-3 shadow-lg border ${!isOnline ? 'border-yellow-500/50 bg-yellow-500/10' :
                    syncError || failedCount > 0 ? 'border-red-500/50 bg-red-500/10' :
                        isSyncing ? 'border-blue-500/50 bg-blue-500/10' :
                            'border-green-500/50 bg-green-500/10'
                }`}>
                <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!isOnline ? 'bg-yellow-500/20' :
                            isSyncing ? 'bg-blue-500/20' :
                                syncError || failedCount > 0 ? 'bg-red-500/20' :
                                    'bg-green-500/20'
                        }`}>
                        {!isOnline ? (
                            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                            </svg>
                        ) : isSyncing ? (
                            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : syncError || failedCount > 0 ? (
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>

                    {/* Status Text */}
                    <div>
                        <p className={`font-medium ${!isOnline ? 'text-yellow-400' :
                                isSyncing ? 'text-blue-400' :
                                    syncError || failedCount > 0 ? 'text-red-400' :
                                        'text-green-400'
                            }`}>
                            {!isOnline ? 'Offline Mode' :
                                isSyncing ? 'Syncing...' :
                                    syncError ? 'Sync Error' :
                                        failedCount > 0 ? 'Sync Failed' :
                                            'Synced'}
                        </p>
                        <p className="text-xs text-slate-400">
                            {!isOnline && pendingCount > 0 && `${pendingCount} pending`}
                            {isOnline && isSyncing && `${pendingCount} remaining`}
                            {isOnline && !isSyncing && failedCount > 0 && `${failedCount} failed`}
                            {isOnline && !isSyncing && pendingCount > 0 && `${pendingCount} pending`}
                        </p>
                    </div>

                    {/* Retry Button */}
                    {isOnline && !isSyncing && (pendingCount > 0 || failedCount > 0) && (
                        <button
                            onClick={manualSync}
                            className="ml-2 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                            title="Retry sync"
                        >
                            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Offline Banner - Shows at top of page when offline
 */
export function OfflineBanner() {
    const { isOnline, pendingCount } = useOffline();

    if (isOnline) return null;

    return (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
            <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                </svg>
                You're offline. Changes will be saved locally and synced when you're back online.
                {pendingCount > 0 && ` (${pendingCount} pending)`}
            </span>
        </div>
    );
}
