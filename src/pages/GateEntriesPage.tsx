import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGateEntries, MATERIAL_CATEGORIES, ENTRY_STATUSES, completeGateEntry, cancelGateEntry } from '../services/gateEntryService';
import { useAuth } from '../contexts/AuthContext';
import type { GateEntry, GateEntryStatus } from '../types';

export function GateEntriesPage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const [entries, setEntries] = useState<GateEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | GateEntryStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedEntries = await getGateEntries(100);
            setEntries(fetchedEntries);
        } catch (err: any) {
            setError(err.message || 'Failed to load gate entries');
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = entries.filter(entry => {
        // Status filter
        if (filter !== 'all' && entry.status !== filter) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                entry.vehicleNumber?.toLowerCase().includes(query) ||
                entry.entryNumber?.toLowerCase().includes(query) ||
                entry.supplierName?.toLowerCase().includes(query) ||
                entry.driverName?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const handleComplete = async (entryId: string) => {
        if (!userData?.id) return;
        try {
            await completeGateEntry(entryId, userData.id);
            await loadEntries();
        } catch (err: any) {
            setActionError(err.message || 'Failed to complete entry');
        }
    };

    const handleCancel = async (entryId: string) => {
        if (!userData?.id) return;
        const reason = window.prompt('Enter cancellation reason:');
        if (!reason) return;

        try {
            await cancelGateEntry(entryId, reason, userData.id);
            await loadEntries();
        } catch (err: any) {
            setActionError(err.message || 'Failed to cancel entry');
        }
    };

    const getMaterialLabel = (category?: string) => {
        return MATERIAL_CATEGORIES.find(m => m.value === category)?.label || category || '-';
    };

    const getStatusInfo = (status: GateEntryStatus) => {
        return ENTRY_STATUSES.find(s => s.value === status) || { label: status, color: 'gray' };
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">Gate Operations</h1>
                            <p className="text-sm text-slate-400">{entries.length} entries total</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/gate/new')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">New Entry</span>
                    </button>
                </div>
            </header>

            <main className="p-4">
                {/* Filters */}
                <div className="glass-card p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by vehicle, entry number, supplier..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field w-full"
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('PENDING')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'PENDING' ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setFilter('COMPLETED')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Completed
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Messages */}
                {(error || actionError) && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error || actionError}</p>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Entries List */}
                {!loading && (
                    <div className="space-y-3">
                        {filteredEntries.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </div>
                                <h3 className="text-white font-semibold mb-2">No entries found</h3>
                                <p className="text-slate-400">
                                    {searchQuery ? 'Try a different search term' : 'Record your first gate entry'}
                                </p>
                            </div>
                        ) : (
                            filteredEntries.map((entry) => {
                                const statusInfo = getStatusInfo(entry.status);
                                return (
                                    <div
                                        key={entry.id}
                                        className="glass-card p-4 hover:bg-slate-700/50 transition-all cursor-pointer"
                                        onClick={() => navigate(`/gate/${entry.id}`)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                {/* Entry Type Icon */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${entry.entryType === 'IN'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-orange-500/20 text-orange-400'
                                                    }`}>
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        {entry.entryType === 'IN' ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                                                        ) : (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                        )}
                                                    </svg>
                                                </div>

                                                {/* Entry Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-white font-bold text-lg">{entry.vehicleNumber}</h3>
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${entry.entryType === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                                                            }`}>
                                                            {entry.entryType}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-400 text-sm">{entry.entryNumber}</p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                                                        <span>📦 {getMaterialLabel(entry.materialCategory)}</span>
                                                        {entry.netWeight && <span>⚖️ {entry.netWeight} {entry.unit}</span>}
                                                        <span>🕐 {formatTime(entry.entryTime)}</span>
                                                    </div>
                                                    {entry.supplierName && (
                                                        <p className="text-slate-500 text-xs mt-1">
                                                            🏢 {entry.supplierName} {entry.driverName && `• 👤 ${entry.driverName}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status & Actions */}
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`status-badge ${statusInfo.color === 'green' ? 'status-active' :
                                                        statusInfo.color === 'yellow' ? 'status-pending' :
                                                            'status-inactive'
                                                    }`}>
                                                    {statusInfo.label}
                                                </span>

                                                {entry.status === 'PENDING' && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleComplete(entry.id);
                                                            }}
                                                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                                                            title="Mark as Completed"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCancel(entry.id);
                                                            }}
                                                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                            title="Cancel Entry"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
