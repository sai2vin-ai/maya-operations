import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast, LoadingSpinner } from '../../../components/ui';
import { useJob, useUpdateJob, useAsset } from '../hooks/useMaintenance';
import {
    JOB_STATUS_CONFIG,
    JOB_PRIORITY_CONFIG,
    JOB_TYPE_CONFIG,
    ASSET_STATUS_CONFIG,
} from '../services/maintenanceService';
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

    const [rootCause, setRootCause] = useState('');
    const [actionTaken, setActionTaken] = useState('');
    const [showCompletion, setShowCompletion] = useState(false);

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
                        onClick={() => navigate(`/maintenance/assets/${asset.id}`)}
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
