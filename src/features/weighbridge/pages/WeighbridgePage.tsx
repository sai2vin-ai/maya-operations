import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTodayEntries, usePendingEntries } from '../hooks/useWeighbridge';
import type { WeighbridgeEntry } from '../types';
import {
    PageHeader,
    LoadingSpinner,
    ErrorAlert,
} from '../../../components/ui';

export default function WeighbridgePage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'RM_IN' | 'FG_OUT'>('all');

    // React Query hooks
    const { data: entries = [], isLoading, error, refetch } = useTodayEntries();
    const { data: pendingEntries = [] } = usePendingEntries();

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
            case 'FIRST_WEIGHT': return 'bg-blue-500/20 text-blue-400 border-blue-500';
            case 'COMPLETED': return 'bg-green-500/20 text-green-400 border-green-500';
            case 'CANCELLED': return 'bg-red-500/20 text-red-400 border-red-500';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500';
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'RM_IN': return 'bg-cyan-500/20 text-cyan-400';
            case 'FG_OUT': return 'bg-orange-500/20 text-orange-400';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

    const filteredEntries = filter === 'all'
        ? entries
        : entries.filter((e: WeighbridgeEntry) => e.entryType === filter);

    const todayRmIn = entries.filter((e: WeighbridgeEntry) => e.entryType === 'RM_IN' && e.status === 'COMPLETED');
    const todayFgOut = entries.filter((e: WeighbridgeEntry) => e.entryType === 'FG_OUT' && e.status === 'COMPLETED');
    const totalRmInWeight = todayRmIn.reduce((sum: number, e: WeighbridgeEntry) => sum + (e.netWeight || 0), 0);
    const totalFgOutWeight = todayFgOut.reduce((sum: number, e: WeighbridgeEntry) => sum + (e.netWeight || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <PageHeader
                title="Weighbridge"
                subtitle={`Today's entries | ${entries.length} total`}
                backTo="/dashboard"
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Error */}
                {error && (
                    <ErrorAlert
                        message={error.message || 'Failed to load entries'}
                        onDismiss={() => refetch()}
                    />
                )}

                {/* Loading */}
                {isLoading && <LoadingSpinner />}

                {!isLoading && (
                    <>
                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => navigate('/weighbridge/new?type=RM_IN')}
                                className="glass-card p-6 text-left hover:bg-slate-700/50 transition-all group"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">📥</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-1">Raw Material IN</h3>
                                <p className="text-slate-400">Record incoming raw materials</p>
                                <p className="text-cyan-400 mt-2">{todayRmIn.length} entries | {(totalRmInWeight / 1000).toFixed(2)} TONS today</p>
                            </button>

                            <button
                                onClick={() => navigate('/weighbridge/new?type=FG_OUT')}
                                className="glass-card p-6 text-left hover:bg-slate-700/50 transition-all group"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">📤</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-1">Finished Goods OUT</h3>
                                <p className="text-slate-400">Record outgoing finished goods</p>
                                <p className="text-orange-400 mt-2">{todayFgOut.length} entries | {(totalFgOutWeight / 1000).toFixed(2)} TONS today</p>
                            </button>
                        </div>

                        {/* Pending Entries */}
                        {pendingEntries.length > 0 && (
                            <div className="glass-card p-6 mb-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Pending Second Weight</h2>
                                <div className="space-y-2">
                                    {pendingEntries.map((entry: WeighbridgeEntry) => (
                                        <div
                                            key={entry.id}
                                            onClick={() => navigate(`/weighbridge/${entry.id}`)}
                                            className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded text-xs ${getTypeBadge(entry.entryType)}`}>
                                                    {entry.entryType === 'RM_IN' ? 'IN' : 'OUT'}
                                                </span>
                                                <div>
                                                    <span className="text-white font-medium">{entry.vehicleNumber}</span>
                                                    <span className="text-slate-500 text-sm ml-2">{entry.entryNumber}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-400">
                                                    {entry.grossWeight ? `Gross: ${entry.grossWeight} KG` : ''}
                                                    {entry.tareWeight ? `Tare: ${entry.tareWeight} KG` : ''}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full border text-xs ${getStatusBadge(entry.status)}`}>
                                                    {entry.status === 'FIRST_WEIGHT' ? 'Awaiting 2nd Weight' : entry.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('RM_IN')}
                                className={`px-4 py-2 rounded-lg ${filter === 'RM_IN' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                            >
                                RM IN
                            </button>
                            <button
                                onClick={() => setFilter('FG_OUT')}
                                className={`px-4 py-2 rounded-lg ${filter === 'FG_OUT' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                            >
                                FG OUT
                            </button>
                        </div>

                        {/* Entries List */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Today's Entries</h2>
                            {filteredEntries.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-700/50">
                                            <tr>
                                                <th className="text-left p-3 text-slate-300 font-medium">Entry #</th>
                                                <th className="text-left p-3 text-slate-300 font-medium">Type</th>
                                                <th className="text-left p-3 text-slate-300 font-medium">Vehicle</th>
                                                <th className="text-left p-3 text-slate-300 font-medium">Material</th>
                                                <th className="text-right p-3 text-slate-300 font-medium">Net Weight</th>
                                                <th className="text-left p-3 text-slate-300 font-medium">Time</th>
                                                <th className="text-left p-3 text-slate-300 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {filteredEntries.map((entry: WeighbridgeEntry) => (
                                                <tr
                                                    key={entry.id}
                                                    className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                                                    onClick={() => navigate(`/weighbridge/${entry.id}`)}
                                                >
                                                    <td className="p-3 text-white font-mono">{entry.entryNumber}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded text-xs ${getTypeBadge(entry.entryType)}`}>
                                                            {entry.entryType === 'RM_IN' ? '📥 IN' : '📤 OUT'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-white">{entry.vehicleNumber}</td>
                                                    <td className="p-3 text-slate-300">{entry.materialName || '-'}</td>
                                                    <td className="p-3 text-right text-white font-medium">
                                                        {entry.netWeight ? `${entry.netWeight.toLocaleString()} KG` : '-'}
                                                    </td>
                                                    <td className="p-3 text-slate-400">{formatDate(entry.createdAt)}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded-full border text-xs ${getStatusBadge(entry.status)}`}>
                                                            {entry.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-8">No entries today. Create one to get started!</p>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
