import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui';
import { useQuery } from '@tanstack/react-query';
import { getBatches } from '../../reactor/services/batchService';
import {
    createQualityCheck,
    QC_CHECK_TYPES,
    DEFAULT_PARAMETERS,
    type QCCheckType,
    type QCParameter,
} from '../services/qualityService';

export default function QualityCheckCreatePage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();

    const { data: batches = [] } = useQuery({
        queryKey: ['batches', 'recent'],
        queryFn: () => getBatches(50),
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [batchId, setBatchId] = useState('');
    const [checkType, setCheckType] = useState<QCCheckType>('VISUAL');
    const [notes, setNotes] = useState('');
    const [parameters, setParameters] = useState<QCParameter[]>(DEFAULT_PARAMETERS['OIL']);

    const selectedBatch = batches.find((b) => b.id === batchId);

    const handleBatchChange = (id: string) => {
        setBatchId(id);
        // Auto-select parameters based on batch output type
        const batch = batches.find((b) => b.id === id);
        if (batch) {
            const mainOutput = batch.outputs?.[0]?.materialCategory;
            const paramKey =
                mainOutput === 'PYROLYSIS_OIL'
                    ? 'OIL'
                    : mainOutput === 'CARBON_BLACK'
                      ? 'CARBON'
                      : mainOutput === 'SCRAP_STEEL'
                        ? 'STEEL'
                        : 'OIL';
            setParameters(DEFAULT_PARAMETERS[paramKey] || DEFAULT_PARAMETERS['OIL']);
        }
    };

    const updateParameter = (index: number, field: keyof QCParameter, value: string | boolean) => {
        const updated = [...parameters];
        updated[index] = { ...updated[index], [field]: value };
        setParameters(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData?.id || !batchId) {
            setError('Please select a batch');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const checkId = await createQualityCheck(
                {
                    batchId,
                    batchNumber: selectedBatch?.batchNumber || batchId,
                    checkType,
                    parameters,
                    notes: notes || undefined,
                },
                userData.id,
                userData.role,
            );

            toast.success('Quality check recorded');
            navigate(`/quality/${checkId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create quality check');
            toast.error('Failed to create quality check');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/quality')} className="text-foreground-muted hover:text-foreground">
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-foreground">New Quality Check</h1>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Batch Selection */}
                <div className="glass-card p-6">
                    <h3 className="text-foreground font-medium mb-4">Batch & Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Batch *</label>
                            <select
                                value={batchId}
                                onChange={(e) => handleBatchChange(e.target.value)}
                                className="input-field w-full"
                                required
                            >
                                <option value="">Select batch...</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.batchNumber} ({b.status})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-foreground-secondary mb-1">Check Type</label>
                            <select
                                value={checkType}
                                onChange={(e) => setCheckType(e.target.value as QCCheckType)}
                                className="input-field w-full"
                            >
                                {QC_CHECK_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Parameters */}
                <div className="glass-card p-6">
                    <h3 className="text-foreground font-medium mb-4">Test Parameters</h3>
                    <div className="space-y-3">
                        {parameters.map((param, i) => (
                            <div key={i} className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-3">
                                    <p className="text-sm text-foreground">{param.name}</p>
                                    <p className="text-xs text-foreground-faint">Expected: {param.expected}</p>
                                </div>
                                <div className="col-span-5">
                                    <input
                                        type="text"
                                        value={param.actual}
                                        onChange={(e) => updateParameter(i, 'actual', e.target.value)}
                                        className="input-field w-full"
                                        placeholder="Actual value..."
                                    />
                                </div>
                                <div className="col-span-4 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateParameter(i, 'passed', true)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            param.passed
                                                ? 'bg-green-500/30 text-green-400 ring-1 ring-green-500'
                                                : 'bg-surface-tertiary text-foreground-muted hover:bg-green-500/10'
                                        }`}
                                    >
                                        Pass
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateParameter(i, 'passed', false)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            !param.passed && param.actual
                                                ? 'bg-red-500/30 text-red-400 ring-1 ring-red-500'
                                                : 'bg-surface-tertiary text-foreground-muted hover:bg-red-500/10'
                                        }`}
                                    >
                                        Fail
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div className="glass-card p-6">
                    <label className="block text-sm text-foreground-secondary mb-1">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input-field w-full"
                        rows={3}
                        placeholder="Additional observations..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving || !batchId}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    {saving && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    Record Quality Check
                </button>
            </form>
        </div>
    );
}
