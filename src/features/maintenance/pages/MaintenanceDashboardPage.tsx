import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets, useJobs, useMaintenanceStats } from '../hooks/useMaintenance';
import {
    ASSET_STATUS_CONFIG,
    JOB_STATUS_CONFIG,
    JOB_PRIORITY_CONFIG,
    JOB_TYPE_CONFIG,
} from '../services/maintenanceService';
import { PageHeader, LoadingSpinner, ErrorAlert, EmptyState } from '../../../components/ui';
import type { AssetStatus, JobStatus } from '../../../types';

type TabType = 'assets' | 'jobs';

export default function MaintenanceDashboardPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<TabType>('assets');
    const [assetStatusFilter, setAssetStatusFilter] = useState<AssetStatus | 'all'>('all');
    const [jobStatusFilter, setJobStatusFilter] = useState<JobStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: stats, isLoading: statsLoading } = useMaintenanceStats();
    const { data: assets = [], isLoading: assetsLoading, error: assetsError } = useAssets();
    const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();

    const filteredAssets = assets.filter(a => {
        if (assetStatusFilter !== 'all' && a.status !== assetStatusFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return a.name.toLowerCase().includes(q) || a.assetCode.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q);
        }
        return true;
    });

    const filteredJobs = jobs.filter(j => {
        if (jobStatusFilter !== 'all' && j.status !== jobStatusFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return j.jobNumber.toLowerCase().includes(q) || j.description.toLowerCase().includes(q);
        }
        return true;
    });

    const isLoading = statsLoading || assetsLoading || jobsLoading;

    return (
        <div>
            <PageHeader
                title="Maintenance"
                subtitle="Asset management & work orders"
                backTo="/dashboard"
                actions={
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/maintenance/assets/new')} className="btn-secondary">
                            + Asset
                        </button>
                        <button onClick={() => navigate('/maintenance/jobs/new')} className="btn-primary">
                            + Work Order
                        </button>
                    </div>
                }
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Stats Cards */}
                {!statsLoading && stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Total Assets</p>
                            <p className="text-2xl font-bold text-foreground">{stats.totalAssets}</p>
                            <p className="text-xs text-green-400">{stats.operationalAssets} operational</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Breakdowns</p>
                            <p className="text-2xl font-bold text-red-400">{stats.breakdownAssets}</p>
                            <p className="text-xs text-foreground-faint">assets down</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Active Jobs</p>
                            <p className="text-2xl font-bold text-foreground">{stats.activeJobs}</p>
                            <p className="text-xs text-red-400">{stats.criticalJobs} critical</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">PM Due</p>
                            <p className="text-2xl font-bold text-yellow-400">{stats.pmDue}</p>
                            <p className="text-xs text-foreground-faint">overdue</p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="glass-card p-1 mb-4 inline-flex gap-1">
                    <button
                        onClick={() => setTab('assets')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === 'assets' ? 'bg-blue-600/20 text-blue-400' : 'text-foreground-muted hover:text-foreground'
                        }`}
                    >
                        Assets ({assets.length})
                    </button>
                    <button
                        onClick={() => setTab('jobs')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === 'jobs' ? 'bg-blue-600/20 text-blue-400' : 'text-foreground-muted hover:text-foreground'
                        }`}
                    >
                        Work Orders ({jobs.length})
                    </button>
                </div>

                {/* Search + Filter */}
                <div className="glass-card p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field"
                            placeholder={tab === 'assets' ? 'Search by name, code, or location...' : 'Search by job number or description...'}
                        />
                        {tab === 'assets' ? (
                            <select
                                value={assetStatusFilter}
                                onChange={(e) => setAssetStatusFilter(e.target.value as AssetStatus | 'all')}
                                className="input-field"
                            >
                                <option value="all">All Statuses</option>
                                {Object.entries(ASSET_STATUS_CONFIG).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        ) : (
                            <select
                                value={jobStatusFilter}
                                onChange={(e) => setJobStatusFilter(e.target.value as JobStatus | 'all')}
                                className="input-field"
                            >
                                <option value="all">All Statuses</option>
                                {Object.entries(JOB_STATUS_CONFIG).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {(assetsError || jobsError) && (
                    <ErrorAlert message="Failed to load maintenance data" />
                )}

                {isLoading && <LoadingSpinner />}

                {/* Assets Table */}
                {!isLoading && tab === 'assets' && (
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-tertiary/50">
                                    <tr>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Asset Code</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Name</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Category</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Location</th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">Criticality</th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredAssets.map((asset) => {
                                        const statusConfig = ASSET_STATUS_CONFIG[asset.status];
                                        return (
                                            <tr
                                                key={asset.id}
                                                className="hover:bg-surface-tertiary/30 cursor-pointer transition-colors"
                                                onClick={() => navigate(`/maintenance/assets/${asset.id}`)}
                                            >
                                                <td className="p-4">
                                                    <span className="text-foreground font-mono">{asset.assetCode}</span>
                                                </td>
                                                <td className="p-4 text-foreground">{asset.name}</td>
                                                <td className="p-4 text-foreground-secondary">{asset.category}</td>
                                                <td className="p-4 text-foreground-muted">{asset.location}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        asset.criticality === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                                        asset.criticality === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'
                                                    }`}>
                                                        {asset.criticality}
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
                        {filteredAssets.length === 0 && (
                            <EmptyState
                                title="No assets found"
                                description={searchQuery || assetStatusFilter !== 'all' ? 'Try adjusting your filters' : 'Register your first asset'}
                                action={!searchQuery && assetStatusFilter === 'all' ? { label: 'Add Asset', onClick: () => navigate('/maintenance/assets/new') } : undefined}
                            />
                        )}
                    </div>
                )}

                {/* Jobs Table */}
                {!isLoading && tab === 'jobs' && (
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
                                                onClick={() => navigate(`/maintenance/jobs/${job.id}`)}
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
                                description={searchQuery || jobStatusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first work order'}
                                action={!searchQuery && jobStatusFilter === 'all' ? { label: 'Create Work Order', onClick: () => navigate('/maintenance/jobs/new') } : undefined}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
