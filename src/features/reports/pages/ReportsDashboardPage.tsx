import { useState, useMemo } from 'react';
import { useOperationsSummary, useProductionReport } from '../hooks/useReports';
import {
    exportReportSummary,
    exportToCSV,
    getGateEntriesForExport,
    getWeighbridgeForExport,
    getInventoryForExport,
    printReport,
} from '../services/reportService';
import { useRecentAuditLogs } from '../../audit/hooks/useAuditLogs';
import { getActionLabel, getActionColor } from '../../audit/types';
import type { ReportFilters } from '../types';
import {
    PageHeader,
    LoadingSpinner,
    ErrorAlert,
    DateRangeInput,
    getPresetDates,
} from '../../../components/ui';

export default function ReportsDashboardPage() {
    // Date state - default to this month
    const defaultDates = getPresetDates('month');
    const [startDate, setStartDate] = useState(defaultDates.startDate);
    const [endDate, setEndDate] = useState(defaultDates.endDate);

    // Build filters
    const filters: ReportFilters = useMemo(() => ({
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
    }), [startDate, endDate]);

    // Queries
    const { data: summary, isLoading: summaryLoading, error: summaryError } = useOperationsSummary(filters);
    const { data: production, isLoading: productionLoading } = useProductionReport(filters);
    const { data: recentLogs = [], isLoading: logsLoading } = useRecentAuditLogs(10);

    const isLoading = summaryLoading || productionLoading || logsLoading;

    // Format timestamp
    const formatTimestamp = (timestamp: { toDate?: () => Date }) => {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date();
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Handle preset selection
    const handlePresetChange = (preset: string) => {
        if (preset !== 'custom') {
            const dates = getPresetDates(preset as Parameters<typeof getPresetDates>[0]);
            setStartDate(dates.startDate);
            setEndDate(dates.endDate);
        }
    };

    // Export handlers
    const handleExportSummary = () => {
        if (summary) {
            exportReportSummary(summary, filters);
        }
    };

    const handleExportProduction = () => {
        if (production && production.length > 0) {
            const data = production.map(p => ({
                'Batch Number': p.batchNumber,
                'Reactor': p.reactorId,
                'Completed At': p.completedAt.toISOString(),
                'Oil (L)': p.outputs.oil,
                'Carbon (KG)': p.outputs.carbon,
                'Steel (KG)': p.outputs.steel,
            }));
            exportToCSV(data, 'production_report');
        }
    };

    return (
        <div>
            <PageHeader
                title="Reports Dashboard"
                subtitle="Operations summary and analytics"
                backTo="/dashboard"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportSummary}
                            disabled={!summary}
                            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>
                    </div>
                }
            />

            <main className="p-4">
                {/* Date Range Selector */}
                <div className="glass-card p-4 mb-6">
                    <h3 className="text-foreground font-medium mb-3">Report Period</h3>
                    <DateRangeInput
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onPresetChange={handlePresetChange}
                    />
                </div>

                {/* Error */}
                {summaryError && (
                    <ErrorAlert message="Failed to load report data" />
                )}

                {/* Loading */}
                {isLoading && <LoadingSpinner />}

                {/* Summary Stats */}
                {!isLoading && summary && (
                    <>
                        {/* Operations Summary */}
                        <h3 className="text-lg font-semibold text-foreground mb-4">Operations Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-foreground-muted text-sm font-medium">Total Users</h4>
                                    <span className="status-badge status-active">{summary.activeUsers} Active</span>
                                </div>
                                <p className="text-3xl font-bold text-foreground">{summary.totalUsers}</p>
                                <p className="text-sm text-foreground-faint mt-1">registered users</p>
                            </div>

                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-foreground-muted text-sm font-medium">Batches</h4>
                                    <span className="status-badge status-pending">{summary.inProgressBatches} Running</span>
                                </div>
                                <p className="text-3xl font-bold text-foreground">{summary.totalBatches}</p>
                                <p className="text-sm text-foreground-faint mt-1">{summary.completedBatches} completed</p>
                            </div>

                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-foreground-muted text-sm font-medium">Gate Entries</h4>
                                    <span className="status-badge status-active">{summary.completedGateEntries} Done</span>
                                </div>
                                <p className="text-3xl font-bold text-foreground">{summary.totalGateEntries}</p>
                                <p className="text-sm text-foreground-faint mt-1">in period</p>
                            </div>

                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-foreground-muted text-sm font-medium">Low Stock</h4>
                                    {summary.inventoryStats.lowStockItems > 0 ? (
                                        <span className="status-badge status-inactive">Alert</span>
                                    ) : (
                                        <span className="status-badge status-active">OK</span>
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-foreground">{summary.inventoryStats.lowStockItems}</p>
                                <p className="text-sm text-foreground-faint mt-1">items need restock</p>
                            </div>
                        </div>

                        {/* Production Summary */}
                        <h3 className="text-lg font-semibold text-foreground mb-4">Production Output</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">🛢️</span>
                                    </div>
                                    <div>
                                        <p className="text-foreground-muted text-sm">Pyrolysis Oil</p>
                                        <p className="text-2xl font-bold text-foreground">{summary.totalProduction.oil.toLocaleString()} L</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">⚫</span>
                                    </div>
                                    <div>
                                        <p className="text-foreground-muted text-sm">Carbon Black</p>
                                        <p className="text-2xl font-bold text-foreground">{summary.totalProduction.carbon.toLocaleString()} KG</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">🔩</span>
                                    </div>
                                    <div>
                                        <p className="text-foreground-muted text-sm">Steel Wire</p>
                                        <p className="text-2xl font-bold text-foreground">{summary.totalProduction.steel.toLocaleString()} KG</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Production Details Table */}
                        {production && production.length > 0 && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">Production Details</h3>
                                    <button
                                        onClick={handleExportProduction}
                                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export
                                    </button>
                                </div>
                                <div className="glass-card overflow-hidden mb-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-surface-tertiary/50">
                                                <tr>
                                                    <th className="text-left p-3 text-foreground-secondary font-medium">Batch</th>
                                                    <th className="text-left p-3 text-foreground-secondary font-medium">Reactor</th>
                                                    <th className="text-left p-3 text-foreground-secondary font-medium">Completed</th>
                                                    <th className="text-right p-3 text-foreground-secondary font-medium">Oil (L)</th>
                                                    <th className="text-right p-3 text-foreground-secondary font-medium">Carbon (KG)</th>
                                                    <th className="text-right p-3 text-foreground-secondary font-medium">Steel (KG)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {production.slice(0, 10).map((item, index) => (
                                                    <tr key={index} className="hover:bg-surface-tertiary/30 transition-colors">
                                                        <td className="p-3 text-foreground font-mono">{item.batchNumber}</td>
                                                        <td className="p-3 text-foreground-muted">{item.reactorId}</td>
                                                        <td className="p-3 text-foreground-muted text-sm">
                                                            {item.completedAt.toLocaleDateString()}
                                                        </td>
                                                        <td className="p-3 text-yellow-400 text-right">{item.outputs.oil}</td>
                                                        <td className="p-3 text-foreground-secondary text-right">{item.outputs.carbon}</td>
                                                        <td className="p-3 text-blue-400 text-right">{item.outputs.steel}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Export Section */}
                        <h3 className="text-lg font-semibold text-foreground mb-4">Export Reports</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <ExportCard
                                title="Gate Entries"
                                description="Vehicle entry/exit records"
                                onCSV={async () => {
                                    const data = await getGateEntriesForExport(filters);
                                    exportToCSV(data, 'gate_entries');
                                }}
                                onPrint={async () => {
                                    const data = await getGateEntriesForExport(filters);
                                    printReport('Gate Entries Report', data);
                                }}
                            />
                            <ExportCard
                                title="Weighbridge"
                                description="Weighing records"
                                onCSV={async () => {
                                    const data = await getWeighbridgeForExport(filters);
                                    exportToCSV(data, 'weighbridge_records');
                                }}
                                onPrint={async () => {
                                    const data = await getWeighbridgeForExport(filters);
                                    printReport('Weighbridge Records', data);
                                }}
                            />
                            <ExportCard
                                title="Inventory"
                                description="Current stock levels"
                                onCSV={async () => {
                                    const data = await getInventoryForExport();
                                    exportToCSV(data, 'inventory_report');
                                }}
                                onPrint={async () => {
                                    const data = await getInventoryForExport();
                                    printReport('Inventory Report', data);
                                }}
                            />
                            <ExportCard
                                title="Production"
                                description="Batch output details"
                                onCSV={handleExportProduction}
                                onPrint={() => {
                                    if (production && production.length > 0) {
                                        const data = production.map(p => ({
                                            'Batch': p.batchNumber,
                                            'Reactor': p.reactorId,
                                            'Completed': p.completedAt.toLocaleDateString(),
                                            'Oil (L)': p.outputs.oil,
                                            'Carbon (KG)': p.outputs.carbon,
                                            'Steel (KG)': p.outputs.steel,
                                        }));
                                        printReport('Production Report', data);
                                    }
                                }}
                            />
                        </div>

                        {/* Recent Activity */}
                        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                        <div className="glass-card overflow-hidden">
                            {recentLogs.length === 0 ? (
                                <div className="p-6 text-center text-foreground-muted">
                                    No recent activity
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-700">
                                    {recentLogs.map((log) => (
                                        <div key={log.id} className="p-4 hover:bg-surface-tertiary/30 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        log.action.includes('CREATED') ? 'bg-green-400' :
                                                        log.action.includes('COMPLETED') ? 'bg-blue-400' :
                                                        log.action.includes('INACTIVE') || log.action.includes('REVOKED') ? 'bg-red-400' :
                                                        'bg-slate-400'
                                                    }`} />
                                                    <span className={`font-medium ${getActionColor(log.action)}`}>
                                                        {getActionLabel(log.action)}
                                                    </span>
                                                </div>
                                                <span className="text-foreground-faint text-sm">
                                                    {formatTimestamp(log.timestamp)}
                                                </span>
                                            </div>
                                            {log.data && (
                                                <p className="text-foreground-muted text-sm mt-1 ml-5">
                                                    {Object.entries(log.data)
                                                        .filter(([, v]) => v !== undefined && v !== null)
                                                        .slice(0, 3)
                                                        .map(([k, v]) => `${k}: ${v}`)
                                                        .join(' | ')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function ExportCard({ title, description, onCSV, onPrint }: {
    title: string;
    description: string;
    onCSV: () => void;
    onPrint: () => void;
}) {
    return (
        <div className="glass-card p-4">
            <h4 className="text-foreground font-medium mb-1">{title}</h4>
            <p className="text-foreground-faint text-xs mb-3">{description}</p>
            <div className="flex gap-2">
                <button onClick={onCSV} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                    CSV
                </button>
                <button onClick={onPrint} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                    Print/PDF
                </button>
            </div>
        </div>
    );
}
