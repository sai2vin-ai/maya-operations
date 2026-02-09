import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast, LoadingSpinner } from '../../../components/ui';
import { useAsset, useUpdateAsset, useJobsByAsset } from '../hooks/useMaintenance';
import {
    ASSET_STATUS_CONFIG,
    ASSET_CATEGORIES,
    ASSET_LOCATIONS,
    JOB_STATUS_CONFIG,
    JOB_PRIORITY_CONFIG,
    JOB_TYPE_CONFIG,
} from '../services/maintenanceService';
import type { AssetStatus, AssetCriticality } from '../../../types';

export default function AssetDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();

    const { data: asset, isLoading } = useAsset(id);
    const { data: jobs = [] } = useJobsByAsset(id);
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
                data: { name, category, location, criticality, pmFrequencyDays: pmFrequencyDays ? parseInt(pmFrequencyDays) : undefined },
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
    const activeJobs = jobs.filter(j => !['COMPLETED', 'CLOSED'].includes(j.status));

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/maintenance')} className="text-foreground-muted hover:text-foreground">
                    ← Back
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">{asset.name}</h1>
                    <p className="text-sm text-foreground-muted font-mono">{asset.assetCode}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>

            {/* Asset Details */}
            <div className="glass-card p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Details</h2>
                    {!editing ? (
                        <button onClick={startEdit} className="btn-secondary text-sm">Edit</button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
                            <button onClick={handleSave} disabled={updateAsset.isPending} className="btn-primary text-sm">Save</button>
                        </div>
                    )}
                </div>

                {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field w-full" />
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field w-full">
                                {ASSET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Location</label>
                            <select value={location} onChange={(e) => setLocation(e.target.value)} className="input-field w-full">
                                {ASSET_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Criticality</label>
                            <select value={criticality} onChange={(e) => setCriticality(e.target.value as AssetCriticality)} className="input-field w-full">
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">PM Frequency (days)</label>
                            <input type="number" value={pmFrequencyDays} onChange={(e) => setPmFrequencyDays(e.target.value)} className="input-field w-full" min="1" />
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
                            <p className="text-foreground">{asset.pmFrequencyDays ? `${asset.pmFrequencyDays} days` : 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">Last PM</p>
                            <p className="text-foreground">{asset.lastPmDate ? new Date((asset.lastPmDate as { toDate: () => Date }).toDate()).toLocaleDateString() : 'Never'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">Next PM</p>
                            <p className="text-foreground">{asset.nextPmDate ? new Date((asset.nextPmDate as { toDate: () => Date }).toDate()).toLocaleDateString() : 'Not scheduled'}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-4 mb-4">
                <h3 className="text-sm font-medium text-foreground-secondary mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => navigate(`/maintenance/jobs/new?assetId=${id}`)}
                        className="btn-primary text-sm"
                    >
                        Create Work Order
                    </button>
                    {asset.status === 'OPERATIONAL' && (
                        <button onClick={() => handleStatusChange('UNDER_MAINTENANCE')} className="btn-secondary text-sm">
                            Mark Under Maintenance
                        </button>
                    )}
                    {(asset.status === 'UNDER_MAINTENANCE' || asset.status === 'BREAKDOWN') && (
                        <button onClick={() => handleStatusChange('OPERATIONAL')} className="btn-secondary text-sm">
                            Mark Operational
                        </button>
                    )}
                    {asset.status !== 'DECOMMISSIONED' && (
                        <button onClick={() => handleStatusChange('DECOMMISSIONED')} className="btn-secondary text-sm text-red-400">
                            Decommission
                        </button>
                    )}
                </div>
            </div>

            {/* Linked Jobs */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Work Orders ({jobs.length})
                        {activeJobs.length > 0 && <span className="text-sm text-yellow-400 ml-2">{activeJobs.length} active</span>}
                    </h2>
                </div>

                {jobs.length === 0 ? (
                    <p className="text-foreground-muted text-center py-4">No work orders for this asset</p>
                ) : (
                    <div className="space-y-2">
                        {jobs.map((job) => {
                            const jStatus = JOB_STATUS_CONFIG[job.status];
                            const jPriority = JOB_PRIORITY_CONFIG[job.priority];
                            const jType = JOB_TYPE_CONFIG[job.jobType];
                            return (
                                <div
                                    key={job.id}
                                    onClick={() => navigate(`/maintenance/jobs/${job.id}`)}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground font-mono text-sm">{job.jobNumber}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${jType.color}`}>{jType.label}</span>
                                        </div>
                                        <p className="text-sm text-foreground-muted truncate">{job.description}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${jPriority.color}`}>{jPriority.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${jStatus.color}`}>{jStatus.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
