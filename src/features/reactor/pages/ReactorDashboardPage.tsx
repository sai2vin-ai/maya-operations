import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReactorAssets } from '../../asset-register/services/assetService';
import { getActiveBatch, getBatchStatusInfo, getMonthlyBatchCount } from '../services/batchService';
import type { Asset } from '../../../types';
import type { Batch } from '../types';

interface ReactorWithBatch extends Asset {
    activeBatch?: Batch | null;
    monthlyBatchCount?: number;
}

export default function ReactorDashboardPage() {
    const navigate = useNavigate();
    const [reactors, setReactors] = useState<ReactorWithBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentMonth = new Date().toLocaleDateString([], { month: 'long', year: 'numeric' });

    useEffect(() => {
        loadReactors();
    }, []);

    const loadReactors = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedReactors = await getReactorAssets();

            const reactorsWithData = await Promise.all(
                fetchedReactors.map(async (reactor) => {
                    const [activeBatch, monthlyBatchCount] = await Promise.all([
                        getActiveBatch(reactor.id),
                        getMonthlyBatchCount(reactor.id),
                    ]);
                    return { ...reactor, activeBatch, monthlyBatchCount };
                }),
            );

            setReactors(reactorsWithData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load reactors');
        } finally {
            setLoading(false);
        }
    };

    // Summary stats
    const totalMonthlyBatches = reactors.reduce((sum, r) => sum + (r.monthlyBatchCount || 0), 0);
    const activeCount = reactors.filter((r) => r.reactorStatus === 'IN_BATCH').length;
    const idleCount = reactors.filter((r) => r.reactorStatus === 'IDLE').length;

    return (
        <div>
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-foreground-muted"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Reactor Dashboard</h1>
                            <p className="text-sm text-foreground-muted">{reactors.length} reactors configured</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-4 max-w-7xl mx-auto">
                {/* Error */}
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && reactors.length > 0 && (
                    <>
                        {/* Monthly Summary Bar */}
                        <div className="glass-card p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-medium text-foreground-muted">{currentMonth}</h2>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span className="text-foreground-muted">{activeCount} Active</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        <span className="text-foreground-muted">{idleCount} Idle</span>
                                    </div>
                                    <div className="text-foreground font-semibold">
                                        {totalMonthlyBatches} batches this month
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reactors Table */}
                        <div className="glass-card overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-tertiary/50">
                                        <th className="text-left p-4 text-foreground-secondary font-medium text-sm">
                                            Reactor
                                        </th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium text-sm">
                                            Status
                                        </th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium text-sm">
                                            Active Batch
                                        </th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium text-sm">
                                            Progress
                                        </th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium text-sm">
                                            This Month
                                        </th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium text-sm">
                                            Total
                                        </th>
                                        <th className="text-right p-4 text-foreground-secondary font-medium text-sm">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {reactors.map((reactor) => {
                                        const rStatus = reactor.reactorStatus || 'IDLE';
                                        const batch = reactor.activeBatch;
                                        const progress = batch
                                            ? Math.round((batch.currentStep / batch.totalSteps) * 100)
                                            : 0;

                                        return (
                                            <tr
                                                key={reactor.id}
                                                className="hover:bg-surface-tertiary/30 transition-colors"
                                            >
                                                {/* Reactor */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                                                rStatus === 'IN_BATCH'
                                                                    ? 'bg-green-500/20'
                                                                    : rStatus === 'MAINTENANCE'
                                                                      ? 'bg-yellow-500/20'
                                                                      : rStatus === 'OFFLINE'
                                                                        ? 'bg-red-500/20'
                                                                        : 'bg-gray-500/20'
                                                            }`}
                                                        >
                                                            {rStatus === 'IN_BATCH'
                                                                ? '🔥'
                                                                : rStatus === 'MAINTENANCE'
                                                                  ? '🔧'
                                                                  : rStatus === 'OFFLINE'
                                                                    ? '❌'
                                                                    : '⏸️'}
                                                        </div>
                                                        <div>
                                                            <p className="text-foreground font-semibold">
                                                                {reactor.reactorNumber}
                                                            </p>
                                                            <p className="text-foreground-faint text-xs">
                                                                {reactor.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="p-4">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            rStatus === 'IN_BATCH'
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : rStatus === 'MAINTENANCE'
                                                                  ? 'bg-yellow-500/20 text-yellow-400'
                                                                  : rStatus === 'OFFLINE'
                                                                    ? 'bg-red-500/20 text-red-400'
                                                                    : 'bg-gray-500/20 text-gray-400'
                                                        }`}
                                                    >
                                                        {rStatus === 'IN_BATCH'
                                                            ? 'Running'
                                                            : rStatus.charAt(0) + rStatus.slice(1).toLowerCase()}
                                                    </span>
                                                </td>

                                                {/* Active Batch */}
                                                <td className="p-4">
                                                    {batch ? (
                                                        <button
                                                            onClick={() => navigate(`/batch/${batch.id}`)}
                                                            className="text-blue-400 hover:text-blue-300 font-mono text-sm hover:underline"
                                                        >
                                                            {batch.batchNumber}
                                                        </button>
                                                    ) : (
                                                        <span className="text-foreground-faint text-sm">—</span>
                                                    )}
                                                    {batch && (
                                                        <span
                                                            className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                                                batch.status === 'IN_PROGRESS'
                                                                    ? 'bg-green-500/20 text-green-400'
                                                                    : batch.status === 'COOLING'
                                                                      ? 'bg-yellow-500/20 text-yellow-400'
                                                                      : 'bg-blue-500/20 text-blue-400'
                                                            }`}
                                                        >
                                                            {getBatchStatusInfo(batch.status).label}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Progress */}
                                                <td className="p-4">
                                                    {batch ? (
                                                        <div className="flex items-center gap-2 min-w-[120px]">
                                                            <div className="flex-1 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-500 transition-all rounded-full"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-foreground-muted text-xs w-12 text-right">
                                                                {batch.currentStep}/{batch.totalSteps}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-foreground-faint text-sm">—</span>
                                                    )}
                                                </td>

                                                {/* This Month */}
                                                <td className="p-4 text-center">
                                                    <span className="text-foreground font-semibold">
                                                        {reactor.monthlyBatchCount || 0}
                                                    </span>
                                                </td>

                                                {/* Total */}
                                                <td className="p-4 text-center">
                                                    <span className="text-foreground-secondary">
                                                        {reactor.totalBatches || 0}
                                                    </span>
                                                </td>

                                                {/* Action */}
                                                <td className="p-4 text-right">
                                                    {rStatus === 'IDLE' && !batch ? (
                                                        <button
                                                            onClick={() => navigate(`/reactor/${reactor.id}/new-batch`)}
                                                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                                                        >
                                                            New Batch
                                                        </button>
                                                    ) : batch ? (
                                                        <button
                                                            onClick={() => navigate(`/batch/${batch.id}`)}
                                                            className="px-3 py-1.5 bg-surface-tertiary hover:bg-surface-tertiary/80 text-foreground-secondary text-sm rounded-lg transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {!loading && reactors.length === 0 && (
                    <div className="glass-card p-8 text-center">
                        <div className="w-16 h-16 bg-surface-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔥</span>
                        </div>
                        <h3 className="text-foreground font-semibold mb-2">No Reactors Configured</h3>
                        <p className="text-foreground-muted mb-4">Reactors are managed through the Asset Register</p>
                        <button onClick={() => navigate('/assets/new?category=REACTOR')} className="btn-primary">
                            Add Reactor in Asset Register
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
