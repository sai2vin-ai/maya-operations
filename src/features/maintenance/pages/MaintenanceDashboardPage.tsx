import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs, useJobStats } from '../hooks/useMaintenance';
import { JOB_STATUS_CONFIG, JOB_PRIORITY_CONFIG, JOB_TYPE_CONFIG } from '../services/maintenanceService';
import { PageHeader, LoadingSpinner, ErrorAlert, EmptyState } from '../../../components/ui';
import type { MaintenanceJob } from '../../../types';

type Tab = 'open' | 'completed';

const OPEN_STATUSES = new Set(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS']);
const COMPLETED_STATUSES = new Set(['COMPLETED', 'CLOSED']);

export default function MaintenanceDashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('open');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: stats, isLoading: statsLoading } = useJobStats();
    const { data: jobs = [], isLoading: jobsLoading, error } = useJobs();

    const filterByTab = (job: MaintenanceJob) => {
        if (activeTab === 'open') return OPEN_STATUSES.has(job.status);
        return COMPLETED_STATUSES.has(job.status);
    };

    const filterBySearch = (job: MaintenanceJob) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return job.jobNumber.toLowerCase().includes(q) || job.description.toLowerCase().includes(q);
    };

    const filteredJobs = jobs.filter((j) => filterByTab(j) && filterBySearch(j));

    const openCount = jobs.filter((j) => OPEN_STATUSES.has(j.status)).length;
    const completedCount = jobs.filter((j) => COMPLETED_STATUSES.has(j.status)).length;

    return (
        <div>
            <PageHeader
                title="Maintenance"
                subtitle="Task tracking & management"
                backTo="/dashboard"
                actions={
                    <button onClick={() => navigate('/maintenance/new')} className="btn-primary">
                        + New Task
                    </button>
                }
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Stats Cards */}
                {!statsLoading && stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Active Tasks</p>
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

                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-surface-secondary/50 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => setActiveTab('open')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'open'
                                ? 'bg-surface-tertiary text-foreground shadow-sm'
                                : 'text-foreground-muted hover:text-foreground'
                        }`}
                    >
                        Open Tasks
                        {openCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                                {openCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'completed'
                                ? 'bg-surface-tertiary text-foreground shadow-sm'
                                : 'text-foreground-muted hover:text-foreground'
                        }`}
                    >
                        Completed
                        {completedCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                                {completedCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="glass-card p-4 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field w-full"
                        placeholder="Search by job number or description..."
                    />
                </div>

                {error && <ErrorAlert message="Failed to load maintenance tasks" />}
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
                                        <th className="text-left p-4 text-foreground-secondary font-medium">
                                            Description
                                        </th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">
                                            Priority
                                        </th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">
                                            Status
                                        </th>
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
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs ${typeConfig.color}`}
                                                    >
                                                        {typeConfig.label}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-foreground-secondary max-w-xs truncate">
                                                    {job.description}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs ${priorityConfig.color}`}
                                                    >
                                                        {priorityConfig.label}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}
                                                    >
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
                                title={
                                    activeTab === 'open'
                                        ? 'No open maintenance tasks'
                                        : 'No completed maintenance tasks'
                                }
                                description={
                                    searchQuery
                                        ? 'Try adjusting your search'
                                        : activeTab === 'open'
                                          ? 'All caught up!'
                                          : 'No tasks completed yet'
                                }
                                action={
                                    activeTab === 'open' && !searchQuery
                                        ? {
                                              label: 'Create Maintenance Task',
                                              onClick: () => navigate('/maintenance/new'),
                                          }
                                        : undefined
                                }
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
