import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast, LoadingSpinner } from '../../../components/ui';
import { useAsset, useUpdateAsset, useChildAssets, useAssetsByIds } from '../hooks/useAssets';
import { useActiveBatch } from '../../reactor/hooks/useBatches';
import { useJobsByAssetWithChildren } from '../../maintenance/hooks/useMaintenance';
import { useSparePartsByAsset } from '../../spare-parts/hooks/useSpareParts';
import { ASSET_STATUS_CONFIG, ASSET_CATEGORIES, ASSET_LOCATIONS, REACTOR_STATUSES } from '../services/assetService';
import { JOB_STATUS_CONFIG, JOB_PRIORITY_CONFIG, JOB_TYPE_CONFIG } from '../../maintenance/services/maintenanceService';
import type { AssetStatus, AssetCriticality } from '../../../types';

export default function AssetDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();

    const { data: asset, isLoading } = useAsset(id);
    const { data: jobsData } = useJobsByAssetWithChildren(id);
    const jobs = jobsData?.jobs || [];
    const { data: childAssets = [] } = useChildAssets(id);
    const { data: parentAssets = [] } = useAssetsByIds(asset?.parentAssetIds);
    const { data: linkedSpareParts = [] } = useSparePartsByAsset(id);
    const { data: activeBatch } = useActiveBatch(asset?.category === 'REACTOR' ? id : undefined);
    const updateAsset = useUpdateAsset();

    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [criticality, setCriticality] = useState<AssetCriticality>('MEDIUM');
    const [pmFrequencyDays, setPmFrequencyDays] = useState('');

    const startEdit = () => {
        if (!asset) return;
        setName(asset.name);
        setCategory(asset.category);
        setLocation(asset.location);
        setCriticality(asset.criticality);
        setPmFrequencyDays(asset.pmFrequencyDays?.toString() || '');
        setEditing(true);
    };

    const handleSave = async () => {
        if (!id || !userData?.id) return;
        try {
            await updateAsset.mutateAsync({
                assetId: id,
                data: {
                    name,
                    category,
                    location,
                    criticality,
                    pmFrequencyDays: pmFrequencyDays ? parseInt(pmFrequencyDays) : undefined,
                },
                updatedBy: userData.id,
                callerRole: userData.role,
            });
            toast.success('Asset updated successfully');
            setEditing(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update asset');
        }
    };

    const handleStatusChange = async (newStatus: AssetStatus) => {
        if (!id || !userData?.id) return;
        try {
            await updateAsset.mutateAsync({
                assetId: id,
                data: { status: newStatus },
                updatedBy: userData.id,
                callerRole: userData.role,
            });
            toast.success(`Asset marked as ${ASSET_STATUS_CONFIG[newStatus].label}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    if (isLoading) return <LoadingSpinner fullScreen message="Loading asset..." />;
    if (!asset) return <div className="p-6 text-center text-foreground-muted">Asset not found</div>;

    const statusConfig = ASSET_STATUS_CONFIG[asset.status];
    const directJobs = jobs.filter((j) => j.assetId === id);
    const subAssetJobs = jobs.filter((j) => j.assetId !== id);
    const activeJobs = jobs.filter((j) => !['COMPLETED', 'CLOSED'].includes(j.status));
    const isReactor = asset.category === 'REACTOR';
    const reactorStatusInfo = isReactor
        ? REACTOR_STATUSES.find((s) => s.value === asset.reactorStatus) || REACTOR_STATUSES[0]
        : null;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/assets')} className="text-foreground-muted hover:text-foreground">
                    ← Back
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground">{asset.name}</h1>
                        {isReactor && asset.reactorNumber && (
                            <span className="text-lg text-foreground-muted font-mono">({asset.reactorNumber})</span>
                        )}
                    </div>
                    <p className="text-sm text-foreground-muted font-mono">{asset.assetCode}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isReactor && reactorStatusInfo && (
                        <span className={`px-3 py-1 rounded-full text-sm ${reactorStatusInfo.color}`}>
                            {reactorStatusInfo.label}
                        </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm ${statusConfig.color}`}>{statusConfig.label}</span>
                </div>
            </div>

            {/* Reactor Controls (only for reactor-category assets) */}
            {isReactor && (
                <div className="glass-card p-6 mb-4">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Reactor Controls</h2>
                    {activeBatch ? (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <span className="text-foreground-muted text-sm">Active Batch</span>
                                    <p className="text-foreground font-semibold">{activeBatch.batchNumber}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/batch/${activeBatch.id}`)}
                                    className="btn-primary text-sm"
                                >
                                    View Batch
                                </button>
                            </div>
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-foreground-muted mb-1">
                                    <span>
                                        Step {activeBatch.currentStep} of {activeBatch.totalSteps}
                                    </span>
                                    <span>{Math.round((activeBatch.currentStep / activeBatch.totalSteps) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                                        style={{
                                            width: `${(activeBatch.currentStep / activeBatch.totalSteps) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-foreground-faint text-sm">No active batch</p>
                            {asset.reactorStatus === 'IDLE' && (
                                <button
                                    onClick={() => navigate(`/reactor/${id}/new-batch`)}
                                    className="btn-primary text-sm"
                                >
                                    Start New Batch
                                </button>
                            )}
                        </div>
                    )}
                    {asset.totalBatches !== undefined && (
                        <p className="text-xs text-foreground-faint mt-3">
                            Total batches completed: {asset.totalBatches}
                        </p>
                    )}
                </div>
            )}

            {/* Asset Details */}
            <div className="glass-card p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Details</h2>
                    {!editing ? (
                        <button onClick={startEdit} className="btn-secondary text-sm">
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={updateAsset.isPending}
                                className="btn-primary text-sm"
                            >
                                Save
                            </button>
                        </div>
                    )}
                </div>

                {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="input-field w-full"
                            >
                                {ASSET_CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Location</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="input-field w-full"
                            >
                                {ASSET_LOCATIONS.map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Criticality</label>
                            <select
                                value={criticality}
                                onChange={(e) => setCriticality(e.target.value as AssetCriticality)}
                                className="input-field w-full"
                            >
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">PM Frequency (days)</label>
                            <input
                                type="number"
                                value={pmFrequencyDays}
                                onChange={(e) => setPmFrequencyDays(e.target.value)}
                                className="input-field w-full"
                                min="1"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-foreground-muted">Category</p>
                            <p className="text-foreground">{asset.category}</p>
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">Location</p>
                            <p className="text-foreground">{asset.location}</p>
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">Criticality</p>
                            <p className="text-foreground">{asset.criticality}</p>
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">PM Frequency</p>
                            <p className="text-foreground">
                                {asset.pmFrequencyDays ? `${asset.pmFrequencyDays} days` : 'Not set'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">Last PM</p>
                            <p className="text-foreground">
                                {asset.lastPmDate
                                    ? new Date(
                                          (asset.lastPmDate as { toDate: () => Date }).toDate(),
                                      ).toLocaleDateString()
                                    : 'Never'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">Next PM</p>
                            <p className="text-foreground">
                                {asset.nextPmDate
                                    ? new Date(
                                          (asset.nextPmDate as { toDate: () => Date }).toDate(),
                                      ).toLocaleDateString()
                                    : 'Not scheduled'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-4 mb-4">
                <h3 className="text-sm font-medium text-foreground-secondary mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate(`/maintenance/new?assetId=${id}`)} className="btn-primary text-sm">
                        Create Maintenance Task
                    </button>
                    {asset.status === 'OPERATIONAL' && (
                        <button
                            onClick={() => handleStatusChange('UNDER_MAINTENANCE')}
                            className="btn-secondary text-sm"
                        >
                            Mark Under Maintenance
                        </button>
                    )}
                    {(asset.status === 'UNDER_MAINTENANCE' || asset.status === 'BREAKDOWN') && (
                        <button onClick={() => handleStatusChange('OPERATIONAL')} className="btn-secondary text-sm">
                            Mark Operational
                        </button>
                    )}
                    {asset.status !== 'DECOMMISSIONED' && (
                        <button
                            onClick={() => handleStatusChange('DECOMMISSIONED')}
                            className="btn-secondary text-sm text-red-400"
                        >
                            Decommission
                        </button>
                    )}
                </div>
            </div>

            {/* Parent Assets */}
            {parentAssets.length > 0 && (
                <div className="glass-card p-6 mb-4">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        Parent Assets ({parentAssets.length})
                    </h2>
                    <div className="space-y-2">
                        {parentAssets.map((parent) => (
                            <div
                                key={parent.id}
                                onClick={() => navigate(`/assets/${parent.id}`)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <span className="text-foreground font-medium">{parent.name}</span>
                                    <span className="text-foreground-muted text-sm ml-2">({parent.assetCode})</span>
                                </div>
                                <span className="text-xs text-foreground-faint">{parent.category}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sub-Assets */}
            {childAssets.length > 0 && (
                <div className="glass-card p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Sub-Assets ({childAssets.length})</h2>
                        <button
                            onClick={() => navigate(`/assets/new?parentId=${id}`)}
                            className="btn-secondary text-sm"
                        >
                            Add Sub-Asset
                        </button>
                    </div>
                    <div className="space-y-2">
                        {childAssets.map((child) => {
                            const childStatus = ASSET_STATUS_CONFIG[child.status];
                            return (
                                <div
                                    key={child.id}
                                    onClick={() => navigate(`/assets/${child.id}`)}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <span className="text-foreground font-medium">{child.name}</span>
                                        <span className="text-foreground-muted text-sm ml-2">({child.assetCode})</span>
                                    </div>
                                    <span className="text-xs text-foreground-faint">{child.category}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${childStatus.color}`}>
                                        {childStatus.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Show "Add Sub-Asset" even when no children yet */}
            {childAssets.length === 0 && (
                <div className="glass-card p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Sub-Assets</h2>
                        <button
                            onClick={() => navigate(`/assets/new?parentId=${id}`)}
                            className="btn-secondary text-sm"
                        >
                            Add Sub-Asset
                        </button>
                    </div>
                    <p className="text-foreground-faint text-sm mt-2">No sub-assets registered</p>
                </div>
            )}

            {/* Linked Spare Parts */}
            <div className="glass-card p-6 mb-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Linked Spare Parts ({linkedSpareParts.length})
                </h2>
                {linkedSpareParts.length > 0 ? (
                    <div className="space-y-2">
                        {linkedSpareParts.map((part) => (
                            <div
                                key={part.id}
                                onClick={() => navigate(`/spare-parts/${part.id}`)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground font-mono text-sm">{part.partNumber}</span>
                                        <span className="text-foreground-secondary">{part.name}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`text-sm font-medium ${
                                            part.currentStock <= part.minimumStock ? 'text-red-400' : 'text-foreground'
                                        }`}
                                    >
                                        {part.currentStock} {part.unit}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-foreground-muted text-center py-4">No spare parts linked to this asset</p>
                )}
            </div>

            {/* Maintenance Tasks */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Maintenance Tasks ({jobs.length})
                        {activeJobs.length > 0 && (
                            <span className="text-sm text-yellow-400 ml-2">{activeJobs.length} active</span>
                        )}
                    </h2>
                </div>

                {jobs.length === 0 ? (
                    <p className="text-foreground-muted text-center py-4">No maintenance tasks for this asset</p>
                ) : (
                    <div className="space-y-4">
                        {/* Direct tasks */}
                        {directJobs.length > 0 && (
                            <div>
                                {subAssetJobs.length > 0 && (
                                    <h3 className="text-sm font-medium text-foreground-secondary mb-2">Direct Tasks</h3>
                                )}
                                <div className="space-y-2">
                                    {directJobs.map((job) => {
                                        const jStatus = JOB_STATUS_CONFIG[job.status];
                                        const jPriority = JOB_PRIORITY_CONFIG[job.priority];
                                        const jType = JOB_TYPE_CONFIG[job.jobType];
                                        return (
                                            <div
                                                key={job.id}
                                                onClick={() => navigate(`/maintenance/${job.id}`)}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-foreground font-mono text-sm">
                                                            {job.jobNumber}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-xs ${jType.color}`}
                                                        >
                                                            {jType.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-foreground-muted truncate">
                                                        {job.description}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${jPriority.color}`}>
                                                    {jPriority.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${jStatus.color}`}>
                                                    {jStatus.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sub-asset tasks */}
                        {subAssetJobs.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-foreground-secondary mb-2">Sub-Asset Tasks</h3>
                                <div className="space-y-2">
                                    {subAssetJobs.map((job) => {
                                        const jStatus = JOB_STATUS_CONFIG[job.status];
                                        const jPriority = JOB_PRIORITY_CONFIG[job.priority];
                                        const jType = JOB_TYPE_CONFIG[job.jobType];
                                        const subAsset = childAssets.find((c) => c.id === job.assetId);
                                        return (
                                            <div
                                                key={job.id}
                                                onClick={() => navigate(`/maintenance/${job.id}`)}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-foreground font-mono text-sm">
                                                            {job.jobNumber}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-xs ${jType.color}`}
                                                        >
                                                            {jType.label}
                                                        </span>
                                                        {subAsset && (
                                                            <span className="text-xs text-foreground-faint">
                                                                on {subAsset.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-foreground-muted truncate">
                                                        {job.description}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${jPriority.color}`}>
                                                    {jPriority.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${jStatus.color}`}>
                                                    {jStatus.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
