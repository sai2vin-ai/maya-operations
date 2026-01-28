import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReactors, getReactorStatusInfo, createReactor } from '../services/reactorService';
import { getActiveBatch, getBatchStatusInfo } from '../services/batchService';
import { useAuth } from '../contexts/AuthContext';
import type { Reactor, Batch } from '../types';

interface ReactorWithBatch extends Reactor {
    activeBatch?: Batch | null;
}

export function ReactorDashboardPage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const [reactors, setReactors] = useState<ReactorWithBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddReactor, setShowAddReactor] = useState(false);
    const [newReactorNumber, setNewReactorNumber] = useState('');
    const [newReactorName, setNewReactorName] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadReactors();
    }, []);

    const loadReactors = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedReactors = await getReactors();

            // Load active batch for each reactor
            const reactorsWithBatches = await Promise.all(
                fetchedReactors.map(async (reactor) => {
                    const activeBatch = await getActiveBatch(reactor.id);
                    return { ...reactor, activeBatch };
                })
            );

            setReactors(reactorsWithBatches);
        } catch (err: any) {
            setError(err.message || 'Failed to load reactors');
        } finally {
            setLoading(false);
        }
    };

    const handleAddReactor = async () => {
        if (!newReactorNumber.trim() || !newReactorName.trim()) return;

        try {
            setAdding(true);
            await createReactor({
                reactorNumber: newReactorNumber,
                name: newReactorName,
            }, userData?.id || '');

            setNewReactorNumber('');
            setNewReactorName('');
            setShowAddReactor(false);
            await loadReactors();
        } catch (err: any) {
            setError(err.message || 'Failed to add reactor');
        } finally {
            setAdding(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IDLE': return 'from-gray-500 to-gray-600';
            case 'IN_BATCH': return 'from-green-500 to-green-600';
            case 'MAINTENANCE': return 'from-yellow-500 to-yellow-600';
            case 'OFFLINE': return 'from-red-500 to-red-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'IDLE': return '⏸️';
            case 'IN_BATCH': return '🔥';
            case 'MAINTENANCE': return '🔧';
            case 'OFFLINE': return '❌';
            default: return '❓';
        }
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
                            <h1 className="text-xl font-bold text-white">Reactor Dashboard</h1>
                            <p className="text-sm text-slate-400">{reactors.length} reactors configured</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAddReactor(!showAddReactor)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Reactor
                    </button>
                </div>
            </header>

            <main className="p-4">
                {/* Error */}
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Add Reactor Form */}
                {showAddReactor && (
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Add New Reactor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Reactor Number (e.g., R1)"
                                value={newReactorNumber}
                                onChange={(e) => setNewReactorNumber(e.target.value)}
                                className="input-field"
                            />
                            <input
                                type="text"
                                placeholder="Reactor Name"
                                value={newReactorName}
                                onChange={(e) => setNewReactorName(e.target.value)}
                                className="input-field"
                            />
                            <button
                                onClick={handleAddReactor}
                                disabled={adding || !newReactorNumber || !newReactorName}
                                className="btn-primary"
                            >
                                {adding ? 'Adding...' : 'Add Reactor'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Reactors Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reactors.length === 0 ? (
                            <div className="col-span-full glass-card p-8 text-center">
                                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">🔥</span>
                                </div>
                                <h3 className="text-white font-semibold mb-2">No Reactors Configured</h3>
                                <p className="text-slate-400">Add your first reactor to get started</p>
                            </div>
                        ) : (
                            reactors.map((reactor) => {
                                const statusInfo = getReactorStatusInfo(reactor.status);
                                return (
                                    <div
                                        key={reactor.id}
                                        className="glass-card overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
                                        onClick={() => {
                                            if (reactor.activeBatch) {
                                                navigate(`/batch/${reactor.activeBatch.id}`);
                                            }
                                        }}
                                    >
                                        {/* Status Header */}
                                        <div className={`bg-gradient-to-r ${getStatusColor(reactor.status)} p-4`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl">{getStatusIcon(reactor.status)}</span>
                                                    <div>
                                                        <h3 className="text-white font-bold text-xl">{reactor.reactorNumber}</h3>
                                                        <p className="text-white/80 text-sm">{reactor.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="bg-white/20 px-2 py-1 rounded text-white text-sm">
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            {/* Active Batch Info */}
                                            {reactor.activeBatch ? (
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-slate-400 text-sm">Active Batch</span>
                                                        <span className={`status-badge ${reactor.activeBatch.status === 'IN_PROGRESS' ? 'status-active' :
                                                            reactor.activeBatch.status === 'COOLING' ? 'status-pending' :
                                                                'status-inactive'
                                                            }`}>
                                                            {getBatchStatusInfo(reactor.activeBatch.status).label}
                                                        </span>
                                                    </div>
                                                    <p className="text-white font-semibold">{reactor.activeBatch.batchNumber}</p>

                                                    {/* Progress Bar */}
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                            <span>Step {reactor.activeBatch.currentStep} of {reactor.activeBatch.totalSteps}</span>
                                                            <span>{Math.round((reactor.activeBatch.currentStep / reactor.activeBatch.totalSteps) * 100)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                                                                style={{ width: `${(reactor.activeBatch.currentStep / reactor.activeBatch.totalSteps) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mb-4">
                                                    <p className="text-slate-500 text-sm">No active batch</p>
                                                    {reactor.status === 'IDLE' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/reactor/${reactor.id}/new-batch`);
                                                            }}
                                                            className="mt-3 btn-primary w-full"
                                                        >
                                                            Start New Batch
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                                                <div>
                                                    <span className="text-slate-400 text-xs">Total Batches</span>
                                                    <p className="text-white font-semibold">{reactor.totalBatches || 0}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 text-xs">Last Maintenance</span>
                                                    <p className="text-white font-semibold text-sm">
                                                        {reactor.lastMaintenanceDate?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                                    </p>
                                                </div>
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
