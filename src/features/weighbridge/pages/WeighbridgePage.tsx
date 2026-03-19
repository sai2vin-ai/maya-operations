import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTodayEntries, usePendingEntries, useWeighbridgeHistory } from '../hooks/useWeighbridge';
import type { WeighbridgeEntry } from '../types';
import { PageHeader, LoadingSpinner, ErrorAlert } from '../../../components/ui';

type ViewMode = 'today' | 'history';

export default function WeighbridgePage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'RM_IN' | 'FG_OUT'>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('today');

    // Date range for history view (default: last 7 days)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // React Query hooks
    const {
        data: todayEntries = [],
        isLoading: todayLoading,
        error: todayError,
        refetch: refetchToday,
    } = useTodayEntries();
    const { data: pendingEntries = [] } = usePendingEntries();
    const {
        data: historyEntries = [],
        isLoading: historyLoading,
        error: historyError,
        refetch: refetchHistory,
    } = useWeighbridgeHistory(
        viewMode === 'history' ? new Date(startDate) : null,
        viewMode === 'history' ? new Date(endDate) : null,
    );

    const entries = viewMode === 'today' ? todayEntries : historyEntries;
    const isLoading = viewMode === 'today' ? todayLoading : historyLoading;
    const error = viewMode === 'today' ? todayError : historyError;
    const refetch = viewMode === 'today' ? refetchToday : refetchHistory;

    const formatTime = (timestamp: unknown) => {
        if (!timestamp) return '-';
        const ts = timestamp as { toDate?: () => Date };
        const date = ts.toDate ? ts.toDate() : new Date(timestamp as string | number);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateTime = (timestamp: unknown) => {
        if (!timestamp) return '-';
        const ts = timestamp as { toDate?: () => Date };
        const date = ts.toDate ? ts.toDate() : new Date(timestamp as string | number);
        return (
            date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
            case 'FIRST_WEIGHT':
                return 'bg-blue-500/20 text-blue-400 border-blue-500';
            case 'COMPLETED':
                return 'bg-green-500/20 text-green-400 border-green-500';
            case 'CANCELLED':
                return 'bg-red-500/20 text-red-400 border-red-500';
            default:
                return 'bg-slate-500/20 text-foreground-muted border-slate-500';
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'RM_IN':
                return 'bg-cyan-500/20 text-cyan-400';
            case 'FG_OUT':
                return 'bg-orange-500/20 text-orange-400';
            default:
                return 'bg-slate-500/20 text-foreground-muted';
        }
    };

    const filteredEntries =
        filter === 'all' ? entries : entries.filter((e: WeighbridgeEntry) => e.entryType === filter);

    const todayRmIn = todayEntries.filter((e: WeighbridgeEntry) => e.entryType === 'RM_IN' && e.status === 'COMPLETED');
    const todayFgOut = todayEntries.filter(
        (e: WeighbridgeEntry) => e.entryType === 'FG_OUT' && e.status === 'COMPLETED',
    );
    const totalRmInWeight = todayRmIn.reduce((sum: number, e: WeighbridgeEntry) => sum + (e.netWeight || 0), 0);
    const totalFgOutWeight = todayFgOut.reduce((sum: number, e: WeighbridgeEntry) => sum + (e.netWeight || 0), 0);

    return (
        <div>
            <PageHeader
                title="Weighbridge"
                subtitle={
                    viewMode === 'today'
                        ? `Today's entries | ${todayEntries.length} total`
                        : `${filteredEntries.length} entries found`
                }
                backTo="/dashboard"
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Error */}
                {error && (
                    <ErrorAlert message={error.message || 'Failed to load entries'} onDismiss={() => refetch()} />
                )}

                {/* Loading */}
                {isLoading && <LoadingSpinner />}

                {!isLoading && (
                    <>
                        {/* Quick Actions - always visible */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => navigate('/weighbridge/new?type=RM_IN')}
                                className="glass-card p-6 text-left hover:bg-surface-tertiary/50 transition-all group"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">📥</span>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-1">Raw Material IN</h3>
                                <p className="text-foreground-muted">Record incoming raw materials</p>
                                <p className="text-cyan-400 mt-2">
                                    {todayRmIn.length} entries | {(totalRmInWeight / 1000).toFixed(2)} TONS today
                                </p>
                            </button>

                            <button
                                onClick={() => navigate('/weighbridge/new?type=FG_OUT')}
                                className="glass-card p-6 text-left hover:bg-surface-tertiary/50 transition-all group"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">📤</span>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-1">Finished Goods OUT</h3>
                                <p className="text-foreground-muted">Record outgoing finished goods</p>
                                <p className="text-orange-400 mt-2">
                                    {todayFgOut.length} entries | {(totalFgOutWeight / 1000).toFixed(2)} TONS today
                                </p>
                            </button>
                        </div>

                        {/* Pending Entries */}
                        {pendingEntries.length > 0 && (
                            <div className="glass-card p-6 mb-6">
                                <h2 className="text-lg font-semibold text-foreground mb-4">Pending Second Weight</h2>
                                <div className="space-y-2">
                                    {pendingEntries.map((entry: WeighbridgeEntry) => (
                                        <div
                                            key={entry.id}
                                            onClick={() => navigate(`/weighbridge/${entry.id}`)}
                                            className="flex items-center justify-between p-3 bg-surface-tertiary/30 rounded-lg cursor-pointer hover:bg-surface-tertiary/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs ${getTypeBadge(entry.entryType)}`}
                                                >
                                                    {entry.entryType === 'RM_IN' ? 'IN' : 'OUT'}
                                                </span>
                                                <div>
                                                    <span className="text-foreground font-medium">
                                                        {entry.vehicleNumber}
                                                    </span>
                                                    <span className="text-foreground-faint text-sm ml-2">
                                                        {entry.entryNumber}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-foreground-muted">
                                                    {entry.grossWeight ? `Gross: ${entry.grossWeight} KG` : ''}
                                                    {entry.tareWeight ? `Tare: ${entry.tareWeight} KG` : ''}
                                                </span>
                                                <span
                                                    className={`px-2 py-1 rounded-full border text-xs ${getStatusBadge(entry.status)}`}
                                                >
                                                    {entry.status === 'FIRST_WEIGHT'
                                                        ? 'Awaiting 2nd Weight'
                                                        : entry.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* View Mode Tabs */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex gap-1 bg-surface-tertiary/50 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('today')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'today'
                                            ? 'bg-blue-500 text-foreground'
                                            : 'text-foreground-secondary hover:text-foreground'
                                    }`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => setViewMode('history')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'history'
                                            ? 'bg-blue-500 text-foreground'
                                            : 'text-foreground-secondary hover:text-foreground'
                                    }`}
                                >
                                    History
                                </button>
                            </div>

                            {/* Type Filter */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-blue-500 text-foreground' : 'bg-surface-tertiary text-foreground-secondary'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('RM_IN')}
                                    className={`px-4 py-2 rounded-lg text-sm ${filter === 'RM_IN' ? 'bg-cyan-500 text-foreground' : 'bg-surface-tertiary text-foreground-secondary'}`}
                                >
                                    RM IN
                                </button>
                                <button
                                    onClick={() => setFilter('FG_OUT')}
                                    className={`px-4 py-2 rounded-lg text-sm ${filter === 'FG_OUT' ? 'bg-orange-500 text-foreground' : 'bg-surface-tertiary text-foreground-secondary'}`}
                                >
                                    FG OUT
                                </button>
                            </div>
                        </div>

                        {/* Date Range Picker - History mode only */}
                        {viewMode === 'history' && (
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-foreground-muted">From</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        max={endDate}
                                        className="input-field text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-foreground-muted">To</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="input-field text-sm"
                                    />
                                </div>
                                {/* Quick date presets */}
                                <div className="flex gap-1">
                                    {[
                                        { label: '7d', days: 7 },
                                        { label: '30d', days: 30 },
                                        { label: '90d', days: 90 },
                                    ].map(({ label, days }) => (
                                        <button
                                            key={label}
                                            onClick={() => {
                                                const end = new Date();
                                                const start = new Date();
                                                start.setDate(start.getDate() - days);
                                                setStartDate(start.toISOString().split('T')[0]);
                                                setEndDate(end.toISOString().split('T')[0]);
                                            }}
                                            className="px-3 py-1.5 rounded-md text-xs bg-surface-tertiary text-foreground-secondary hover:text-foreground hover:bg-surface-tertiary/80 transition-colors"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Entries List */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">
                                {viewMode === 'today' ? "Today's Entries" : 'Entry History'}
                            </h2>
                            {filteredEntries.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-surface-tertiary/50">
                                            <tr>
                                                <th className="text-left p-3 text-foreground-secondary font-medium">
                                                    Entry #
                                                </th>
                                                <th className="text-left p-3 text-foreground-secondary font-medium">
                                                    Type
                                                </th>
                                                <th className="text-left p-3 text-foreground-secondary font-medium">
                                                    Vehicle
                                                </th>
                                                <th className="text-left p-3 text-foreground-secondary font-medium">
                                                    Material
                                                </th>
                                                <th className="text-right p-3 text-foreground-secondary font-medium">
                                                    Net Weight
                                                </th>
                                                <th className="text-left p-3 text-foreground-secondary font-medium">
                                                    {viewMode === 'today' ? 'Time' : 'Date'}
                                                </th>
                                                <th className="text-left p-3 text-foreground-secondary font-medium">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {filteredEntries.map((entry: WeighbridgeEntry) => (
                                                <tr
                                                    key={entry.id}
                                                    className="hover:bg-surface-tertiary/30 cursor-pointer transition-colors"
                                                    onClick={() => navigate(`/weighbridge/${entry.id}`)}
                                                >
                                                    <td className="p-3 text-foreground font-mono">
                                                        {entry.entryNumber}
                                                    </td>
                                                    <td className="p-3">
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs ${getTypeBadge(entry.entryType)}`}
                                                        >
                                                            {entry.entryType === 'RM_IN' ? '📥 IN' : '📤 OUT'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-foreground">{entry.vehicleNumber}</td>
                                                    <td className="p-3 text-foreground-secondary">
                                                        {entry.materialName || '-'}
                                                    </td>
                                                    <td className="p-3 text-right text-foreground font-medium">
                                                        {entry.netWeight
                                                            ? `${entry.netWeight.toLocaleString()} KG`
                                                            : '-'}
                                                    </td>
                                                    <td className="p-3 text-foreground-muted">
                                                        {viewMode === 'today'
                                                            ? formatTime(entry.createdAt)
                                                            : formatDateTime(entry.createdAt)}
                                                    </td>
                                                    <td className="p-3">
                                                        <span
                                                            className={`px-2 py-1 rounded-full border text-xs ${getStatusBadge(entry.status)}`}
                                                        >
                                                            {entry.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-foreground-faint text-center py-8">
                                    {viewMode === 'today'
                                        ? 'No entries today. Create one to get started!'
                                        : 'No entries found for the selected date range.'}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
