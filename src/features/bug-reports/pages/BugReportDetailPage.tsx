import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    PageHeader,
    LoadingSpinner,
    StatusBadge,
} from '../../../components/ui';
import { useBugReport, useUpdateBugReportStatus } from '../hooks/useBugReports';
import { useAuth } from '../../../contexts/AuthContext';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../types';
import type { BugReportStatus } from '../types';

export default function BugReportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { userData } = useAuth();
    const { data: report, isLoading } = useBugReport(id);
    const updateStatusMutation = useUpdateBugReportStatus();

    const [newStatus, setNewStatus] = useState<BugReportStatus | ''>('');
    const [adminNotes, setAdminNotes] = useState('');

    const isAdmin = userData?.role === 'SUPER_ADMIN' || userData?.role === 'PLANT_MANAGER';

    const handleStatusUpdate = () => {
        if (!id || !newStatus) return;

        updateStatusMutation.mutate({
            id,
            status: newStatus,
            adminNotes: adminNotes.trim() || undefined,
            callerRole: userData?.role,
        }, {
            onSuccess: () => {
                setNewStatus('');
                setAdminNotes('');
            },
        });
    };

    if (isLoading) return <LoadingSpinner fullScreen message="Loading report..." />;

    if (!report) {
        return (
            <div className="min-h-screen page-bg">
                <PageHeader title="Bug Report Not Found" backTo="/bug-reports" />
                <div className="px-4 py-8 text-center text-foreground-muted">
                    This bug report does not exist or has been removed.
                </div>
            </div>
        );
    }

    const createdDate = report.createdAt?.toDate?.()
        ? report.createdAt.toDate().toLocaleString()
        : '-';
    const resolvedDate = report.resolvedAt?.toDate?.()
        ? report.resolvedAt.toDate().toLocaleString()
        : null;

    return (
        <div className="min-h-screen page-bg">
            <PageHeader
                title={report.reportNumber}
                subtitle={report.title}
                backTo="/bug-reports"
            />

            <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
                {/* Header Info */}
                <div className="glass-card p-6">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <StatusBadge status={STATUS_LABELS[report.status]} />
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[report.priority]}`}>
                            {PRIORITY_LABELS[report.priority]}
                        </span>
                        <span className="text-sm text-foreground-muted">
                            Reported by {report.createdBy.displayName} ({report.createdBy.role})
                        </span>
                        <span className="text-sm text-foreground-faint">{createdDate}</span>
                    </div>

                    <h2 className="text-xl font-semibold text-foreground mb-4">{report.title}</h2>

                    <div className="bg-surface-secondary rounded-lg p-4 mb-4">
                        <p className="text-foreground-secondary whitespace-pre-wrap">{report.description}</p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-foreground-muted">Page URL:</span>
                            <p className="text-foreground-secondary break-all">{report.pageUrl}</p>
                        </div>
                        <div>
                            <span className="text-foreground-muted">Browser:</span>
                            <p className="text-foreground-secondary break-all text-xs">{report.browserInfo}</p>
                        </div>
                    </div>

                    {resolvedDate && (
                        <div className="mt-4 text-sm">
                            <span className="text-foreground-muted">Resolved:</span>
                            <span className="text-foreground-secondary ml-2">{resolvedDate}</span>
                        </div>
                    )}
                </div>

                {/* Screenshot */}
                {report.screenshotUrl && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Screenshot</h3>
                        <a href={report.screenshotUrl} target="_blank" rel="noopener noreferrer">
                            <img
                                src={report.screenshotUrl}
                                alt="Bug report screenshot"
                                className="max-w-full rounded-lg border border-border hover:opacity-90 transition-opacity"
                            />
                        </a>
                    </div>
                )}

                {/* Admin Notes */}
                {report.adminNotes && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Admin Notes</h3>
                        <p className="text-foreground-secondary whitespace-pre-wrap">{report.adminNotes}</p>
                    </div>
                )}

                {/* Admin Controls */}
                {isAdmin && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Update Status</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    New Status
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as BugReportStatus)}
                                    className="input-field"
                                >
                                    <option value="">Select status...</option>
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="input-field min-h-[80px]"
                                    placeholder="Add notes about the resolution or next steps..."
                                />
                            </div>

                            <button
                                onClick={handleStatusUpdate}
                                disabled={!newStatus || updateStatusMutation.isPending}
                                className="btn-primary disabled:opacity-50"
                            >
                                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
