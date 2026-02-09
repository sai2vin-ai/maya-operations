import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs, useJobStats } from '../hooks/useMaintenance';
import {
    JOB_STATUS_CONFIG,
    JOB_PRIORITY_CONFIG,
    JOB_TYPE_CONFIG,
} from '../services/maintenanceService';
import { PageHeader, LoadingSpinner, ErrorAlert, EmptyState } from '../../../components/ui';
import type { JobStatus } from '../../../types';

export default function MaintenanceDashboardPage() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: stats, isLoading: statsLoading } = useJobStats();
    const { data: jobs = [], isLoading: jobsLoading, error } = useJobs();

    const filteredJobs = jobs.filter(j => {
        if (statusFilter !== 'all' && j.status !== statusFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return j.jobNumber.toLowerCase().includes(q) || j.description.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <div>
            <PageHeader
                title="Work Orders"
                subtitle="Maintenance job tracking & management"
                backTo="/dashboard"
                actions={
                    <button onClick={() => navigate('/maintenance/new')} className="btn-primary">
                        + Work Order
                    </button>
                }
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Stats Cards */}
                {!statsLoading && stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Active Jobs</p>
                            <p className="text-2xl font-bold text-foreground">{stats.activeJobs}</p>
                            <p className="text-xs text-foreground-faint">in progress</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Critical</p>
                            <p className="text-2xl font-bold text-red-400">{stats.criticalJobs}</p>
                            <p className="text-xs text-foreground-faint">urgent attention</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Pending Parts</p>
                            <p className="text-2xl font-bold text-orange-400">{stats.pendingParts}</p>
                            <p className="text-xs text-foreground-faint">waiting on store</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Completed</p>
                            <p className="text-2xl font-bold text-green-400">{stats.completedThisMonth}</p>
                            <p className="text-xs text-foreground-faint">this month</p>
                        </div>
                    </div>
                )}

                {/* Search + Filter */}
                <div className="glass-card p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field"
                            placeholder="Search by job number or description..."
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
                            className="input-field"
                        >
                            <option value="all">All Statuses</option>
                            {Object.entries(JOB_STATUS_CONFIG).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <ErrorAlert message="Failed to load work orders" />}
                {jobsLoading && <LoadingSpinner />}

                {/* Jobs Table */}
                {!jobsLoading && (
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-tertiary/50">
                                    <tr>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Job #</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Type</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Description</th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">Priority</th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredJobs.map((job) => {
                                        const statusConfig = JOB_STATUS_CONFIG[job.status];
                                        const priorityConfig = JOB_PRIORITY_CONFIG[job.priority];
                                        const typeConfig = JOB_TYPE_CONFIG[job.jobType];
                                        return (
                                            <tr
                                                key={job.id}
                                                className="hover:bg-surface-tertiary/30 cursor-pointer transition-colors"
                                                onClick={() => navigate(`/maintenance/${job.id}`)}
                                            >
                                                <td className="p-4">
                                                    <span className="text-foreground font-mono">{job.jobNumber}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${typeConfig.color}`}>
                                                        {typeConfig.label}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-foreground-secondary max-w-xs truncate">{job.description}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${priorityConfig.color}`}>
                                                        {priorityConfig.label}
                                                    </span>
                                                </td>
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
                        {filteredJobs.length === 0 && (
                            <EmptyState
                                title="No work orders found"
                                description={searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first work order'}
                                action={!searchQuery && statusFilter === 'all' ? { label: 'Create Work Order', onClick: () => navigate('/maintenance/new') } : undefined}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
