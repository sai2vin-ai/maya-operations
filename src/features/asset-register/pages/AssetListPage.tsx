import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets, useAssetStats } from '../hooks/useAssets';
import { ASSET_STATUS_CONFIG } from '../services/assetService';
import { PageHeader, LoadingSpinner, ErrorAlert, EmptyState } from '../../../components/ui';
import type { AssetStatus } from '../../../types';

export default function AssetListPage() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: stats, isLoading: statsLoading } = useAssetStats();
    const { data: assets = [], isLoading: assetsLoading, error } = useAssets();

    const filteredAssets = assets.filter(a => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return a.name.toLowerCase().includes(q) || a.assetCode.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <div>
            <PageHeader
                title="Asset Register"
                subtitle="Plant asset lifecycle management"
                backTo="/dashboard"
                actions={
                    <button onClick={() => navigate('/assets/new')} className="btn-primary">
                        + Register Asset
                    </button>
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
                            <p className="text-sm text-foreground-muted">Operational</p>
                            <p className="text-2xl font-bold text-green-400">{stats.operationalAssets}</p>
                            <p className="text-xs text-foreground-faint">running</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Breakdowns</p>
                            <p className="text-2xl font-bold text-red-400">{stats.breakdownAssets}</p>
                            <p className="text-xs text-foreground-faint">assets down</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">PM Due</p>
                            <p className="text-2xl font-bold text-yellow-400">{stats.pmDue}</p>
                            <p className="text-xs text-foreground-faint">overdue</p>
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
                            placeholder="Search by name, code, or location..."
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'all')}
                            className="input-field"
                        >
                            <option value="all">All Statuses</option>
                            {Object.entries(ASSET_STATUS_CONFIG).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <ErrorAlert message="Failed to load assets" />}
                {assetsLoading && <LoadingSpinner />}

                {/* Assets Table */}
                {!assetsLoading && (
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
                                                onClick={() => navigate(`/assets/${asset.id}`)}
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
                                description={searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Register your first asset'}
                                action={!searchQuery && statusFilter === 'all' ? { label: 'Register Asset', onClick: () => navigate('/assets/new') } : undefined}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
