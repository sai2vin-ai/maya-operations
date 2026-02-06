import { useState, useMemo } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import {
    AUDIT_COLLECTIONS,
    AUDIT_ACTIONS,
    getActionLabel,
    getCollectionLabel,
    getActionColor,
    type AuditFilters,
} from '../types';
import {
    PageHeader,
    LoadingSpinner,
    ErrorAlert,
    EmptyState,
    DateRangeInput,
    getPresetDates,
} from '../../../components/ui';

export default function AuditLogsPage() {
    // Filter state
    const [collection, setCollection] = useState('');
    const [action, setAction] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Build filters object
    const filters: AuditFilters = useMemo(() => ({
        collection: collection || undefined,
        action: action || undefined,
        searchQuery: searchQuery || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
    }), [collection, action, searchQuery, startDate, endDate]);

    // React Query
    const { data: logs = [], isLoading, error, refetch } = useAuditLogs(filters);

    // Format timestamp
    const formatTimestamp = (timestamp: { toDate?: () => Date }) => {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date();
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Format audit data for display
    const formatData = (data: Record<string, unknown> | undefined) => {
        if (!data) return '-';
        const entries = Object.entries(data)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k}: ${v}`)
            .slice(0, 3);
        return entries.join(' | ') || '-';
    };

    // Handle preset selection
    const handlePresetChange = (preset: string) => {
        if (preset !== 'custom') {
            const dates = getPresetDates(preset as Parameters<typeof getPresetDates>[0]);
            setStartDate(dates.startDate);
            setEndDate(dates.endDate);
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setCollection('');
        setAction('');
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
    };

    const hasActiveFilters = collection || action || searchQuery || startDate || endDate;

    return (
        <div className="min-h-screen page-bg">
            <PageHeader
                title="Audit Logs"
                subtitle={`${logs.length} entries${hasActiveFilters ? ' (filtered)' : ''}`}
                backTo="/dashboard"
            />

            <main className="p-4">
                {/* Filters */}
                <div className="glass-card p-4 mb-4 space-y-4">
                    {/* Row 1: Search and Clear */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field w-full"
                            />
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-surface-tertiary text-foreground-secondary rounded-lg hover:bg-surface-hover transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Row 2: Collection and Action filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm text-foreground-muted mb-1">Collection</label>
                            <select
                                value={collection}
                                onChange={(e) => setCollection(e.target.value)}
                                className="input-field w-full"
                            >
                                {AUDIT_COLLECTIONS.map((col) => (
                                    <option key={col.value} value={col.value}>
                                        {col.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-foreground-muted mb-1">Action Type</label>
                            <select
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                className="input-field w-full"
                            >
                                {AUDIT_ACTIONS.map((act) => (
                                    <option key={act.value} value={act.value}>
                                        {act.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Date Range */}
                    <DateRangeInput
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onPresetChange={handlePresetChange}
                    />
                </div>

                {/* Error */}
                {error && (
                    <ErrorAlert
                        message={error?.message || 'Failed to load audit logs'}
                        onDismiss={() => refetch()}
                    />
                )}

                {/* Loading */}
                {isLoading && <LoadingSpinner />}

                {/* Audit Logs Table */}
                {!isLoading && (
                    <>
                        {logs.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg className="w-16 h-16 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                }
                                title="No audit logs found"
                                description={hasActiveFilters ? 'Try adjusting your filters' : 'Audit logs will appear here as actions are performed'}
                            />
                        ) : (
                            <div className="glass-card overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-surface-tertiary/50">
                                            <tr>
                                                <th className="text-left p-3 text-foreground-secondary font-medium">Timestamp</th>
                                                <th className="text-left p-3 text-foreground-secondary font-medium">Action</th>
                                                <th className="text-left p-3 text-foreground-secondary font-medium">Collection</th>
                                                <th className="text-left p-3 text-foreground-secondary font-medium hidden md:table-cell">Details</th>
                                                <th className="text-left p-3 text-foreground-secondary font-medium hidden lg:table-cell">Document ID</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-surface-tertiary/30 transition-colors">
                                                    <td className="p-3 text-foreground-muted text-sm whitespace-nowrap">
                                                        {formatTimestamp(log.timestamp)}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`font-medium ${getActionColor(log.action)}`}>
                                                            {getActionLabel(log.action)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-foreground">
                                                        {getCollectionLabel(log.collection)}
                                                    </td>
                                                    <td className="p-3 text-foreground-muted text-sm hidden md:table-cell max-w-xs truncate">
                                                        {formatData(log.data)}
                                                    </td>
                                                    <td className="p-3 text-foreground-faint font-mono text-xs hidden lg:table-cell">
                                                        {log.documentId}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
