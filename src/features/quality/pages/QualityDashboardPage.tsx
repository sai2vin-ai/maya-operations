import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQualityChecks, useQCStats } from '../hooks/useQuality';
import { QC_STATUS_CONFIG, QC_CHECK_TYPES, type QCStatus } from '../services/qualityService';
import { PageHeader, LoadingSpinner, EmptyState } from '../../../components/ui';

export default function QualityDashboardPage() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<QCStatus | 'all'>('all');

    const { data: checks = [], isLoading } = useQualityChecks();
    const { data: stats } = useQCStats();

    const filteredChecks = statusFilter === 'all'
        ? checks
        : checks.filter(c => c.status === statusFilter);

    const formatDate = (ts: unknown) => {
        if (!ts) return '-';
        const t = ts as { toDate?: () => Date };
        return t?.toDate ? t.toDate().toLocaleString() : '-';
    };

    return (
        <div>
            <PageHeader
                title="Quality Control"
                subtitle="Quality checks and inspection results"
                backTo="/dashboard"
                actions={
                    <button onClick={() => navigate('/quality/new')} className="btn-primary">
                        + New QC Check
                    </button>
                }
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Total (30d)</p>
                            <p className="text-2xl font-bold text-foreground">{stats.totalChecks}</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Passed</p>
                            <p className="text-2xl font-bold text-green-400">{stats.passed}</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Failed</p>
                            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Pending</p>
                            <p className="text-2xl font-bold text-blue-400">{stats.pending}</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Pass Rate</p>
                            <p className={`text-2xl font-bold ${stats.passRate >= 90 ? 'text-green-400' : stats.passRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {stats.passRate}%
                            </p>
                        </div>
                    </div>
                )}

                {/* Filter */}
                <div className="glass-card p-4 mb-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as QCStatus | 'all')}
                        className="input-field"
                    >
                        <option value="all">All Statuses</option>
                        {Object.entries(QC_STATUS_CONFIG).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>
                </div>

                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-tertiary/50">
                                    <tr>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Check #</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Batch</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Type</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Date</th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredChecks.map((check) => {
                                        const statusConfig = QC_STATUS_CONFIG[check.status];
                                        const typeLabel = QC_CHECK_TYPES.find(t => t.value === check.checkType)?.label || check.checkType;
                                        return (
                                            <tr
                                                key={check.id}
                                                className="hover:bg-surface-tertiary/30 cursor-pointer transition-colors"
                                                onClick={() => navigate(`/quality/${check.id}`)}
                                            >
                                                <td className="p-4 text-foreground font-mono">{check.checkNumber}</td>
                                                <td className="p-4 text-foreground-secondary">{check.batchNumber}</td>
                                                <td className="p-4 text-foreground-muted">{typeLabel}</td>
                                                <td className="p-4 text-foreground-muted text-sm">{formatDate(check.inspectedAt)}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredChecks.length === 0 && (
                            <EmptyState
                                title="No quality checks found"
                                description="Create your first quality check"
                                action={{ label: 'New QC Check', onClick: () => navigate('/quality/new') }}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
