import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBatches } from '../services/batchService';
import { getReactorAssets } from '../../asset-register/services/assetService';
import { PageHeader, LoadingSpinner } from '../../../components/ui';

export default function BatchAnalyticsPage() {
    const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

    const { data: batches = [], isLoading: batchesLoading } = useQuery({
        queryKey: ['batches', 'analytics'],
        queryFn: () => getBatches(500),
    });

    const { data: reactors = [] } = useQuery({
        queryKey: ['assets', 'reactors'],
        queryFn: getReactorAssets,
    });

    const analytics = useMemo(() => {
        const now = new Date();
        const cutoff = new Date();
        if (period === 'week') cutoff.setDate(now.getDate() - 7);
        else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
        else cutoff.setMonth(now.getMonth() - 3);

        const periodBatches = batches.filter((b) => {
            const ts = b.startTime as { toDate?: () => Date };
            const d = ts?.toDate ? ts.toDate() : new Date(b.startTime as unknown as string);
            return d >= cutoff;
        });

        const completed = periodBatches.filter((b) => b.status === 'COMPLETED');
        const cancelled = periodBatches.filter((b) => b.status === 'CANCELLED');

        // Calculate average cycle time (start to completion)
        let totalCycleHours = 0;
        let cycleCount = 0;
        completed.forEach((b) => {
            const startTs = b.startTime as { toDate?: () => Date };
            const endTs = b.endTime as { toDate?: () => Date };
            const start = startTs?.toDate ? startTs.toDate() : null;
            const end = endTs?.toDate ? endTs.toDate() : null;
            if (start && end) {
                totalCycleHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                cycleCount++;
            }
        });
        const avgCycleHours = cycleCount > 0 ? totalCycleHours / cycleCount : 0;

        // Output totals
        let totalOil = 0,
            totalCarbon = 0,
            totalSteel = 0;
        completed.forEach((b) => {
            if (b.outputs) {
                b.outputs.forEach((o) => {
                    if (o.materialCategory === 'PYROLYSIS_OIL') totalOil += o.quantity || 0;
                    if (o.materialCategory === 'CARBON_BLACK') totalCarbon += o.quantity || 0;
                    if (o.materialCategory === 'SCRAP_STEEL') totalSteel += o.quantity || 0;
                });
            }
        });

        // Per-reactor breakdown
        const reactorStats = reactors.map((r) => {
            const rBatches = completed.filter((b) => b.reactorId === r.id);
            let rOil = 0,
                rCarbon = 0,
                rSteel = 0;
            rBatches.forEach((b) => {
                if (b.outputs) {
                    b.outputs.forEach((o) => {
                        if (o.materialCategory === 'PYROLYSIS_OIL') rOil += o.quantity || 0;
                        if (o.materialCategory === 'CARBON_BLACK') rCarbon += o.quantity || 0;
                        if (o.materialCategory === 'SCRAP_STEEL') rSteel += o.quantity || 0;
                    });
                }
            });
            return {
                reactorId: r.id,
                reactorNumber: r.reactorNumber || r.id,
                batchCount: rBatches.length,
                oil: rOil,
                carbon: rCarbon,
                steel: rSteel,
            };
        });

        return {
            totalBatches: periodBatches.length,
            completed: completed.length,
            cancelled: cancelled.length,
            completionRate: periodBatches.length > 0 ? Math.round((completed.length / periodBatches.length) * 100) : 0,
            avgCycleHours: Math.round(avgCycleHours * 10) / 10,
            totalOil,
            totalCarbon,
            totalSteel,
            reactorStats,
        };
    }, [batches, reactors, period]);

    return (
        <div>
            <PageHeader
                title="Batch Analytics"
                subtitle="Yield analysis, cycle time, and production trends"
                backTo="/reactor"
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Period Selector */}
                <div className="glass-card p-1 mb-4 inline-flex gap-1">
                    {(['week', 'month', 'quarter'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                period === p
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : 'text-foreground-muted hover:text-foreground'
                            }`}
                        >
                            {p === 'week' ? 'Last 7 Days' : p === 'month' ? 'Last 30 Days' : 'Last 90 Days'}
                        </button>
                    ))}
                </div>

                {batchesLoading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <div className="glass-card p-4">
                                <p className="text-sm text-foreground-muted">Total Batches</p>
                                <p className="text-2xl font-bold text-foreground">{analytics.totalBatches}</p>
                                <p className="text-xs text-green-400">{analytics.completed} completed</p>
                            </div>
                            <div className="glass-card p-4">
                                <p className="text-sm text-foreground-muted">Completion Rate</p>
                                <p className="text-2xl font-bold text-foreground">{analytics.completionRate}%</p>
                                <p className="text-xs text-red-400">{analytics.cancelled} cancelled</p>
                            </div>
                            <div className="glass-card p-4">
                                <p className="text-sm text-foreground-muted">Avg Cycle Time</p>
                                <p className="text-2xl font-bold text-foreground">{analytics.avgCycleHours}h</p>
                                <p className="text-xs text-foreground-faint">start to completion</p>
                            </div>
                            <div className="glass-card p-4">
                                <p className="text-sm text-foreground-muted">Batches/Day</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {(
                                        analytics.completed / (period === 'week' ? 7 : period === 'month' ? 30 : 90)
                                    ).toFixed(1)}
                                </p>
                                <p className="text-xs text-foreground-faint">avg daily output</p>
                            </div>
                        </div>

                        {/* Production Output */}
                        <h3 className="text-lg font-semibold text-foreground mb-3">Production Output</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="glass-card p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                                        <span className="text-lg">🛢️</span>
                                    </div>
                                    <div>
                                        <p className="text-foreground-muted text-sm">Pyrolysis Oil</p>
                                        <p className="text-xl font-bold text-foreground">
                                            {analytics.totalOil.toLocaleString()} L
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-500/20 rounded-xl flex items-center justify-center">
                                        <span className="text-lg">⚫</span>
                                    </div>
                                    <div>
                                        <p className="text-foreground-muted text-sm">Carbon Black</p>
                                        <p className="text-xl font-bold text-foreground">
                                            {analytics.totalCarbon.toLocaleString()} KG
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <span className="text-lg">🔩</span>
                                    </div>
                                    <div>
                                        <p className="text-foreground-muted text-sm">Steel Wire</p>
                                        <p className="text-xl font-bold text-foreground">
                                            {analytics.totalSteel.toLocaleString()} KG
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Per Reactor Breakdown */}
                        <h3 className="text-lg font-semibold text-foreground mb-3">Reactor Performance</h3>
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface-tertiary/50">
                                        <tr>
                                            <th className="text-left p-4 text-foreground-secondary font-medium">
                                                Reactor
                                            </th>
                                            <th className="text-right p-4 text-foreground-secondary font-medium">
                                                Batches
                                            </th>
                                            <th className="text-right p-4 text-foreground-secondary font-medium">
                                                Oil (L)
                                            </th>
                                            <th className="text-right p-4 text-foreground-secondary font-medium">
                                                Carbon (KG)
                                            </th>
                                            <th className="text-right p-4 text-foreground-secondary font-medium">
                                                Steel (KG)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {analytics.reactorStats.map((r) => (
                                            <tr
                                                key={r.reactorId}
                                                className="hover:bg-surface-tertiary/30 transition-colors"
                                            >
                                                <td className="p-4 text-foreground font-medium">{r.reactorNumber}</td>
                                                <td className="p-4 text-right text-foreground">{r.batchCount}</td>
                                                <td className="p-4 text-right text-yellow-400">
                                                    {r.oil.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right text-foreground-secondary">
                                                    {r.carbon.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right text-blue-400">
                                                    {r.steel.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {analytics.reactorStats.length === 0 && (
                                <div className="p-8 text-center text-foreground-muted">No reactor data available</div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
