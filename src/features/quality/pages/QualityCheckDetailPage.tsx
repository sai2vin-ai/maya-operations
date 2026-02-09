import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast, LoadingSpinner } from '../../../components/ui';
import { useQualityCheck, useUpdateQualityCheck } from '../hooks/useQuality';
import { QC_STATUS_CONFIG, QC_CHECK_TYPES, type QCStatus } from '../services/qualityService';

export default function QualityCheckDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();

    const { data: check, isLoading } = useQualityCheck(id);
    const updateCheck = useUpdateQualityCheck();

    const handleStatusChange = async (newStatus: QCStatus) => {
        if (!id || !userData?.id) return;
        try {
            await updateCheck.mutateAsync({
                checkId: id,
                data: { status: newStatus },
                updatedBy: userData.id,
            });
            toast.success(`Status updated to ${QC_STATUS_CONFIG[newStatus].label}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    if (isLoading) return <LoadingSpinner fullScreen message="Loading..." />;
    if (!check) return <div className="p-6 text-center text-foreground-muted">Quality check not found</div>;

    const statusConfig = QC_STATUS_CONFIG[check.status];
    const typeLabel = QC_CHECK_TYPES.find(t => t.value === check.checkType)?.label || check.checkType;

    const formatDate = (ts: unknown) => {
        if (!ts) return '-';
        const t = ts as { toDate?: () => Date };
        return t?.toDate ? t.toDate().toLocaleString() : '-';
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/quality')} className="text-foreground-muted hover:text-foreground">
                    ← Back
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground font-mono">{check.checkNumber}</h1>
                    <p className="text-sm text-foreground-muted">Batch: {check.batchNumber}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>

            {/* Details */}
            <div className="glass-card p-6 mb-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">Check Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-foreground-muted">Type</p>
                        <p className="text-foreground">{typeLabel}</p>
                    </div>
                    <div>
                        <p className="text-sm text-foreground-muted">Inspector</p>
                        <p className="text-foreground">{check.inspector}</p>
                    </div>
                    <div>
                        <p className="text-sm text-foreground-muted">Inspected</p>
                        <p className="text-foreground text-sm">{formatDate(check.inspectedAt)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-foreground-muted">Batch</p>
                        <button
                            onClick={() => navigate(`/batch/${check.batchId}`)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                            {check.batchNumber} →
                        </button>
                    </div>
                </div>
                {check.notes && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-foreground-muted">Notes</p>
                        <p className="text-foreground">{check.notes}</p>
                    </div>
                )}
            </div>

            {/* Parameters */}
            <div className="glass-card p-6 mb-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">Test Parameters</h2>
                <div className="space-y-3">
                    {check.parameters.map((param, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-surface-tertiary/30">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                param.passed ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                                {param.passed ? (
                                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-foreground font-medium text-sm">{param.name}</p>
                                <p className="text-foreground-faint text-xs">Expected: {param.expected}</p>
                            </div>
                            <div className="text-right">
                                <p className={`font-medium text-sm ${param.passed ? 'text-green-400' : 'text-red-400'}`}>
                                    {param.actual || 'N/A'}
                                </p>
                                <p className="text-xs text-foreground-faint">{param.passed ? 'Passed' : 'Failed'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            {check.status !== 'PASSED' && check.status !== 'FAILED' && (
                <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-foreground-secondary mb-3">Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleStatusChange('PASSED')} className="px-4 py-2 rounded-lg text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30">
                            Mark Passed
                        </button>
                        <button onClick={() => handleStatusChange('FAILED')} className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30">
                            Mark Failed
                        </button>
                        <button onClick={() => handleStatusChange('ON_HOLD')} className="px-4 py-2 rounded-lg text-sm bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                            Put On Hold
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
