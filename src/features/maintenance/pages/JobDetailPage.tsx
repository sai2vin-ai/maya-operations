import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast, LoadingSpinner } from '../../../components/ui';
import { useJob, useUpdateJob, useIssuePartsToJob } from '../hooks/useMaintenance';
import { useAsset } from '../../asset-register/hooks/useAssets';
import SparePartsPicker from '../components/SparePartsPicker';
import {
    JOB_STATUS_CONFIG,
    JOB_PRIORITY_CONFIG,
    JOB_TYPE_CONFIG,
} from '../services/maintenanceService';
import { ASSET_STATUS_CONFIG } from '../../asset-register/services/assetService';
import type { JobStatus } from '../../../types';

const STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
    OPEN: ['ASSIGNED', 'IN_PROGRESS', 'CLOSED'],
    ASSIGNED: ['IN_PROGRESS', 'CLOSED'],
    IN_PROGRESS: ['PENDING_PARTS', 'COMPLETED', 'CLOSED'],
    PENDING_PARTS: ['IN_PROGRESS', 'CLOSED'],
    COMPLETED: ['CLOSED'],
    CLOSED: [],
};

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();

    const { data: job, isLoading } = useJob(id);
    const { data: asset } = useAsset(job?.assetId);
    const updateJob = useUpdateJob();
    const issueParts = useIssuePartsToJob();

    const [rootCause, setRootCause] = useState('');
    const [actionTaken, setActionTaken] = useState('');
    const [showCompletion, setShowCompletion] = useState(false);
    const [showPartsPicker, setShowPartsPicker] = useState(false);

    const handleStatusChange = async (newStatus: JobStatus) => {
        if (!id || !userData?.id) return;

        if (newStatus === 'COMPLETED') {
            setShowCompletion(true);
            return;
        }

        try {
            await updateJob.mutateAsync({
                jobId: id,
                data: { status: newStatus },
                updatedBy: userData.id,
                callerRole: userData.role,
            });
            toast.success(`Job status updated to ${JOB_STATUS_CONFIG[newStatus].label}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    const handleIssueParts = async (parts: { partId: string; quantity: number }[]) => {
        if (!id || !userData?.id) return;
        try {
            await issueParts.mutateAsync({
                data: { jobId: id, parts },
                issuedBy: userData.id,
                callerRole: userData.role,
            });
            toast.success('Parts issued successfully');
            setShowPartsPicker(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to issue parts');
        }
    };

    const handleComplete = async () => {
        if (!id || !userData?.id) return;
        try {
            await updateJob.mutateAsync({
                jobId: id,
                data: {
                    status: 'COMPLETED',
                    rootCause: rootCause || undefined,
                    actionTaken: actionTaken || undefined,
                },
                updatedBy: userData.id,
                callerRole: userData.role,
            });
            toast.success('Job completed successfully');
            setShowCompletion(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to complete job');
        }
    };

    if (isLoading) return <LoadingSpinner fullScreen message="Loading job..." />;
    if (!job) return <div className="p-6 text-center text-foreground-muted">Job not found</div>;

    const statusConfig = JOB_STATUS_CONFIG[job.status];
    const priorityConfig = JOB_PRIORITY_CONFIG[job.priority];
    const typeConfig = JOB_TYPE_CONFIG[job.jobType];
    const nextStatuses = STATUS_TRANSITIONS[job.status];

    const formatDate = (ts: unknown) => {
        if (!ts) return 'N/A';
        const t = ts as { toDate?: () => Date };
        const date = t.toDate ? t.toDate() : new Date(ts as string | number);
        return date.toLocaleString();
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/maintenance')} className="text-foreground-muted hover:text-foreground">
                    ← Back
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground font-mono">{job.jobNumber}</h1>
                    <p className="text-sm text-foreground-muted">{job.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>

            {/* Job Info */}
            <div className="glass-card p-6 mb-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">Job Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-foreground-muted">Type</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${typeConfig.color}`}>{typeConfig.label}</span>
                    </div>
                    <div>
                        <p className="text-sm text-foreground-muted">Priority</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${priorityConfig.color}`}>{priorityConfig.label}</span>
                    </div>
                    <div>
                        <p className="text-sm text-foreground-muted">Reported</p>
                        <p className="text-foreground text-sm">{formatDate(job.reportedAt)}</p>
                    </div>
                    {job.startedAt && (
                        <div>
                            <p className="text-sm text-foreground-muted">Started</p>
                            <p className="text-foreground text-sm">{formatDate(job.startedAt)}</p>
                        </div>
                    )}
                    {job.completedAt && (
                        <div>
                            <p className="text-sm text-foreground-muted">Completed</p>
                            <p className="text-foreground text-sm">{formatDate(job.completedAt)}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-foreground-muted">Description</p>
                        <p className="text-foreground text-sm">{job.description}</p>
                    </div>
                    {job.rootCause && (
                        <div>
                            <p className="text-sm text-foreground-muted">Root Cause</p>
                            <p className="text-foreground text-sm">{job.rootCause}</p>
                        </div>
                    )}
                    {job.actionTaken && (
                        <div>
                            <p className="text-sm text-foreground-muted">Action Taken</p>
                            <p className="text-foreground text-sm">{job.actionTaken}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Linked Asset */}
            {asset && (
                <div className="glass-card p-4 mb-4">
                    <h3 className="text-sm font-medium text-foreground-secondary mb-2">Linked Asset</h3>
                    <div
                        onClick={() => navigate(`/assets/${asset.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                    >
                        <div className="flex-1">
                            <p className="text-foreground font-mono text-sm">{asset.assetCode}</p>
                            <p className="text-sm text-foreground-muted">{asset.name} - {asset.location}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${ASSET_STATUS_CONFIG[asset.status].color}`}>
                            {ASSET_STATUS_CONFIG[asset.status].label}
                        </span>
                    </div>
                </div>
            )}

            {/* Issue Parts Action */}
            {(job.status === 'IN_PROGRESS' || job.status === 'PENDING_PARTS') && (
                <div className="glass-card p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-foreground-secondary">Spare Parts</h3>
                            <p className="text-xs text-foreground-faint">Issue parts from store to this job</p>
                        </div>
                        <button
                            onClick={() => setShowPartsPicker(true)}
                            className="btn-primary text-sm"
                        >
                            Issue Parts
                        </button>
                    </div>
                </div>
            )}

            {/* Parts Picker Modal */}
            {showPartsPicker && (
                <SparePartsPicker
                    onIssueParts={handleIssueParts}
                    onClose={() => setShowPartsPicker(false)}
                    isPending={issueParts.isPending}
                />
            )}

            {/* Parts Used */}
            {job.partsUsed && job.partsUsed.length > 0 && (
                <div className="glass-card p-6 mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Parts Used</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-tertiary/50">
                                <tr>
                                    <th className="text-left p-3 text-foreground-secondary font-medium text-sm">Part #</th>
                                    <th className="text-left p-3 text-foreground-secondary font-medium text-sm">Name</th>
                                    <th className="text-center p-3 text-foreground-secondary font-medium text-sm">Qty</th>
                                    <th className="text-right p-3 text-foreground-secondary font-medium text-sm">Unit Price</th>
                                    <th className="text-right p-3 text-foreground-secondary font-medium text-sm">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {job.partsUsed.map((part) => (
                                    <tr key={part.partId}>
                                        <td className="p-3 font-mono text-sm text-foreground">{part.partNumber}</td>
                                        <td className="p-3 text-foreground-secondary text-sm">{part.partName}</td>
                                        <td className="p-3 text-center text-foreground">{part.quantity}</td>
                                        <td className="p-3 text-right text-foreground-muted text-sm">
                                            {part.unitPrice ? `R${part.unitPrice.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="p-3 text-right text-foreground text-sm">
                                            {part.unitPrice ? `R${(part.quantity * part.unitPrice).toFixed(2)}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {job.partsUsed.some(p => p.unitPrice) && (
                                <tfoot>
                                    <tr className="border-t border-slate-600">
                                        <td colSpan={4} className="p-3 text-right text-foreground-secondary font-medium text-sm">Total Cost</td>
                                        <td className="p-3 text-right text-foreground font-bold text-sm">
                                            R{job.partsUsed.reduce((sum, p) => sum + (p.unitPrice ? p.quantity * p.unitPrice : 0), 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* Status Actions */}
            {nextStatuses.length > 0 && (
                <div className="glass-card p-4 mb-4">
                    <h3 className="text-sm font-medium text-foreground-secondary mb-3">Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                        {nextStatuses.map((status) => {
                            const config = JOB_STATUS_CONFIG[status];
                            return (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={updateJob.isPending}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${config.color} hover:opacity-80`}
                                >
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Completion Form */}
            {showCompletion && (
                <div className="glass-card p-6 mb-4 border border-green-500/30">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Complete Job</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Root Cause</label>
                            <textarea
                                value={rootCause}
                                onChange={(e) => setRootCause(e.target.value)}
                                className="input-field w-full"
                                rows={3}
                                placeholder="What caused the issue?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Action Taken</label>
                            <textarea
                                value={actionTaken}
                                onChange={(e) => setActionTaken(e.target.value)}
                                className="input-field w-full"
                                rows={3}
                                placeholder="What was done to fix it?"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowCompletion(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleComplete} disabled={updateJob.isPending} className="btn-primary">
                                {updateJob.isPending ? 'Completing...' : 'Complete Job'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
