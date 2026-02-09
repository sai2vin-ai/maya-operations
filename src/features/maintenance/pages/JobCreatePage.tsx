import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui';
import { useAssets } from '../hooks/useMaintenance';
import { createJob } from '../services/maintenanceService';
import type { JobType, JobPriority } from '../../../types';

export default function JobCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { userData } = useAuth();
    const toast = useToast();
    const { data: assets = [] } = useAssets();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [assetId, setAssetId] = useState(searchParams.get('assetId') || '');
    const [jobType, setJobType] = useState<JobType>('BREAKDOWN');
    const [priority, setPriority] = useState<JobPriority>('MEDIUM');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData?.id || !assetId || !description) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const jobId = await createJob({
                assetId,
                jobType,
                priority,
                description,
            }, userData.id, userData.role);

            toast.success('Work order created successfully');
            navigate(`/maintenance/jobs/${jobId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create work order');
            toast.error('Failed to create work order');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/maintenance')} className="text-foreground-muted hover:text-foreground">
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-foreground">Create Work Order</h1>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Asset *</label>
                    <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="input-field w-full" required>
                        <option value="">Select asset...</option>
                        {assets.map(a => (
                            <option key={a.id} value={a.id}>{a.assetCode} - {a.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Job Type *</label>
                        <select value={jobType} onChange={(e) => setJobType(e.target.value as JobType)} className="input-field w-full">
                            <option value="BREAKDOWN">Breakdown</option>
                            <option value="PREVENTIVE">Preventive Maintenance</option>
                            <option value="CORRECTIVE">Corrective</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Priority *</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as JobPriority)} className="input-field w-full">
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Description *</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-field w-full"
                        rows={4}
                        placeholder="Describe the issue or maintenance task..."
                        required
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving || !assetId || !description}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Create Work Order
                    </button>
                </div>

                <p className="text-xs text-foreground-faint text-center">
                    Job number will be auto-generated
                </p>
            </form>
        </div>
    );
}
