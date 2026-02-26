import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
    getBatchById,
    completeStep,
    uploadStepPhoto,
    recordOutput,
    cancelBatch,
    BATCH_STEPS,
    getBatchStatusInfo,
    type CompleteStepData,
} from '../services/batchService';
import { MATERIAL_CATEGORIES, getGateEntries } from '../../gate/services/gateEntryService';
import { getInventoryItemsByCategory } from '../../inventory/services/inventoryService';
import { InputDialog, ErrorBoundary } from '../../../components/ui';
import { CameraCapture } from '../components/CameraCapture';
import { OutputForm } from '../components/OutputForm';
import { PyrolysisReadings, type ReadingRow } from '../components/PyrolysisReadings';
import type { Batch, MaterialCategory } from '../types';
import type { InventoryItem } from '../../inventory/types';
import type { GateEntry } from '../../gate/types';

export default function BatchWorkflowPage() {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();

    const [batch, setBatch] = useState<Batch | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    // Step completion form
    const [stepNotes, setStepNotes] = useState('');
    const [stepTemp, setStepTemp] = useState('');
    const [stepPressure, setStepPressure] = useState('');
    const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
    const [photoBlobs, setPhotoBlobs] = useState<Blob[]>([]);

    // Step-specific fields
    const [inputWeight, setInputWeight] = useState('');
    const [nitrogenPurged, setNitrogenPurged] = useState(false);
    const [pyrolysisReadings, setPyrolysisReadings] = useState<ReadingRow[]>([]);
    const [selectedGateEntryIds, setSelectedGateEntryIds] = useState<string[]>([]);
    const [availableGateEntries, setAvailableGateEntries] = useState<GateEntry[]>([]);

    // Output recording
    const [showOutputForm, setShowOutputForm] = useState(false);
    const [finishedProductItems, setFinishedProductItems] = useState<InventoryItem[]>([]);

    useEffect(() => {
        if (batchId) {
            loadBatch(batchId);
        }
        loadFinishedProducts();
        loadGateEntries();
    }, [batchId]);

    const loadFinishedProducts = async () => {
        try {
            const items = await getInventoryItemsByCategory('FINISHED_PRODUCT');
            setFinishedProductItems(items);
        } catch (err) {
            console.error('Failed to load inventory items:', err);
        }
    };

    const loadGateEntries = async () => {
        try {
            const entries = await getGateEntries(50);
            const completed = entries.filter((e) => e.status === 'COMPLETED');
            setAvailableGateEntries(completed);
        } catch (err) {
            console.error('Failed to load gate entries:', err);
        }
    };

    const loadBatch = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const fetchedBatch = await getBatchById(id);
            if (fetchedBatch) {
                setBatch(fetchedBatch);
            } else {
                setError('Batch not found');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load batch');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoCaptured = useCallback((blob: Blob, dataUrl: string) => {
        setPhotoBlobs((prev) => [...prev, blob]);
        setCapturedPhotos((prev) => [...prev, dataUrl]);
    }, []);

    const clearPhotos = useCallback(() => {
        setCapturedPhotos([]);
        setPhotoBlobs([]);
    }, []);

    const handleCompleteStep = useCallback(async () => {
        if (!batch || !userData?.id) return;

        const nextStep = batch.currentStep + 1;
        const stepInfo = BATCH_STEPS.find((s) => s.stepNumber === nextStep);
        if (nextStep > BATCH_STEPS.length || !stepInfo) return;

        try {
            setSaving(true);
            setError(null);

            // Upload photos if captured
            const photoUrls: string[] = [];
            for (const blob of photoBlobs) {
                if (batch.batchNumber) {
                    const url = await uploadStepPhoto(blob, batch.batchNumber, nextStep);
                    photoUrls.push(url);
                }
            }

            const stepData: CompleteStepData = {
                stepNumber: nextStep,
                notes: stepNotes || undefined,
                photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
                temperature: stepTemp ? parseFloat(stepTemp) : undefined,
                pressure: stepPressure ? parseFloat(stepPressure) : undefined,
            };

            // Step-specific fields
            if (nextStep === 3 && inputWeight) {
                stepData.inputWeight = parseFloat(inputWeight);
            }
            if (nextStep === 3 && selectedGateEntryIds.length > 0) {
                stepData.gateEntryIds = selectedGateEntryIds;
            }
            if ((nextStep === 10 || nextStep === 11) && nitrogenPurged) {
                stepData.nitrogenPurged = nitrogenPurged;
            }
            if (nextStep === 8 && pyrolysisReadings.length > 0) {
                stepData.pyrolysisReadings = pyrolysisReadings.map((r) => ({
                    reactorTemp: parseFloat(r.reactorTemp) || 0,
                    reactorPressure: parseFloat(r.reactorPressure) || 0,
                    firstTankTemp: r.firstTankTemp ? parseFloat(r.firstTankTemp) : undefined,
                    firstTankPressure: r.firstTankPressure ? parseFloat(r.firstTankPressure) : undefined,
                    panelTemp: r.panelTemp ? parseFloat(r.panelTemp) : undefined,
                    panelPressure: r.panelPressure ? parseFloat(r.panelPressure) : undefined,
                }));
            }

            await completeStep(batch.id, stepData, userData.id, userData.role);

            setSuccess(`Step ${nextStep} completed!`);
            setStepNotes('');
            setStepTemp('');
            setStepPressure('');
            setCapturedPhotos([]);
            setPhotoBlobs([]);
            setInputWeight('');
            setNitrogenPurged(false);
            setPyrolysisReadings([]);
            setSelectedGateEntryIds([]);

            await loadBatch(batch.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to complete step');
        } finally {
            setSaving(false);
        }
    }, [
        batch,
        userData,
        photoBlobs,
        stepNotes,
        stepTemp,
        stepPressure,
        inputWeight,
        selectedGateEntryIds,
        nitrogenPurged,
        pyrolysisReadings,
    ]);

    const handleRecordOutput = useCallback(
        async (data: {
            materialCategory: MaterialCategory;
            quantity: number;
            unit: 'KG' | 'TONS';
            qualityGrade?: string;
            inventoryItemId?: string;
        }) => {
            if (!batch || !userData?.id) return;

            try {
                setSaving(true);
                setError(null);

                await recordOutput(batch.id, data, userData.id, userData.role);

                const inventoryNote = data.inventoryItemId ? ' & inventory updated!' : '!';
                setSuccess(`Output recorded${inventoryNote}`);
                setShowOutputForm(false);

                await loadBatch(batch.id);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to record output');
            } finally {
                setSaving(false);
            }
        },
        [batch, userData],
    );

    const handleCancelBatchConfirm = useCallback(
        async (reason: string) => {
            if (!batch || !userData?.id) return;

            try {
                setSaving(true);
                await cancelBatch(batch.id, reason, userData.id, userData.role);
                setCancelDialogOpen(false);
                navigate('/reactor');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to cancel batch');
            } finally {
                setSaving(false);
            }
        },
        [batch, userData, navigate],
    );

    const currentStepInfo = batch ? BATCH_STEPS.find((s) => s.stepNumber === batch.currentStep + 1) : null;
    const isCompleted = batch?.status === 'COMPLETED';
    const isCancelled = batch?.status === 'CANCELLED';

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="glass-card p-8 text-center max-w-md">
                    <h2 className="text-xl font-bold text-foreground mb-2">Batch Not Found</h2>
                    <button onClick={() => navigate('/reactor')} className="btn-primary">
                        Back to Reactors
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = getBatchStatusInfo(batch.status);

    return (
        <div>
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/reactor')}
                            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-foreground-muted"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{batch.batchNumber}</h1>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`status-badge ${
                                        statusInfo.color === 'green'
                                            ? 'status-active'
                                            : statusInfo.color === 'yellow'
                                              ? 'status-pending'
                                              : 'status-inactive'
                                    }`}
                                >
                                    {statusInfo.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-4">
                {/* Messages */}
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="glass-card p-4 mb-4 border border-green-500/50 bg-green-500/10">
                        <p className="text-green-400">{success}</p>
                    </div>
                )}

                {/* Progress Overview */}
                <div className="glass-card p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Workflow Progress</h3>
                        <span className="text-2xl font-bold text-blue-400">
                            {Math.round((batch.currentStep / batch.totalSteps) * 100)}%
                        </span>
                    </div>

                    <div className="h-4 bg-surface-tertiary rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                            style={{ width: `${(batch.currentStep / batch.totalSteps) * 100}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {BATCH_STEPS.map((step) => {
                            const isComplete = batch.currentStep >= step.stepNumber;
                            const isCurrent = batch.currentStep + 1 === step.stepNumber;
                            return (
                                <div
                                    key={step.stepNumber}
                                    className={`p-2 rounded-lg text-center text-xs ${
                                        isComplete
                                            ? 'bg-green-500/20 text-green-400'
                                            : isCurrent
                                              ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500'
                                              : 'bg-surface-tertiary/50 text-foreground-faint'
                                    }`}
                                >
                                    <div className="font-bold">{step.stepNumber}</div>
                                    <div className="truncate">{step.stepName.split(' ')[0]}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Current Step */}
                {currentStepInfo && !isCompleted && !isCancelled && (
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Step {currentStepInfo.stepNumber}: {currentStepInfo.stepName}
                        </h3>

                        {/* Camera - wrapped in ErrorBoundary */}
                        {currentStepInfo.requiresPhoto && (
                            <ErrorBoundary
                                fallback={(err, reset) => (
                                    <div className="glass-card p-4 mb-4 border border-yellow-500/30 bg-yellow-500/5">
                                        <p className="text-yellow-400 text-sm mb-2">
                                            Camera unavailable: {err.message}
                                        </p>
                                        <button onClick={reset} className="btn-secondary text-sm">
                                            Retry
                                        </button>
                                    </div>
                                )}
                            >
                                <CameraCapture
                                    onPhotoCaptured={handlePhotoCaptured}
                                    capturedPhotos={capturedPhotos}
                                    onClear={clearPhotos}
                                />
                            </ErrorBoundary>
                        )}

                        {/* Step Description */}
                        {'description' in currentStepInfo && (
                            <p className="text-foreground-muted mb-4 text-sm">
                                {(currentStepInfo as { description?: string }).description}
                            </p>
                        )}

                        {/* Step 3: Input Weight for LOADING */}
                        {currentStepInfo.stepNumber === 3 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Input Weight (KG) *
                                </label>
                                <input
                                    type="number"
                                    value={inputWeight}
                                    onChange={(e) => setInputWeight(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="Raw material weight in KG"
                                    required
                                />
                                {availableGateEntries.length > 0 && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                            Link Gate Entries (optional)
                                        </label>
                                        <div className="bg-surface-tertiary/50 p-3 rounded-lg max-h-40 overflow-y-auto space-y-2">
                                            {availableGateEntries.map((entry) => (
                                                <label
                                                    key={entry.id}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGateEntryIds.includes(entry.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedGateEntryIds([
                                                                    ...selectedGateEntryIds,
                                                                    entry.id,
                                                                ]);
                                                            } else {
                                                                setSelectedGateEntryIds(
                                                                    selectedGateEntryIds.filter(
                                                                        (id) => id !== entry.id,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded bg-surface-tertiary border-border-secondary"
                                                    />
                                                    <span className="text-sm text-foreground-secondary">
                                                        {entry.entryNumber} - {entry.vehicleNumber} ({entry.quantity}{' '}
                                                        {entry.unit})
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-xs text-foreground-faint mt-1">
                                            Select gate entries to link raw materials to this batch
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 8: Pyrolysis Readings */}
                        {currentStepInfo.stepNumber === 8 && (
                            <PyrolysisReadings readings={pyrolysisReadings} onChange={setPyrolysisReadings} />
                        )}

                        {/* Steps 10 & 11: Nitrogen Purge */}
                        {(currentStepInfo.stepNumber === 10 || currentStepInfo.stepNumber === 11) && (
                            <div className="mb-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={nitrogenPurged}
                                        onChange={(e) => setNitrogenPurged(e.target.checked)}
                                        className="w-5 h-5 rounded bg-surface-tertiary border-border-secondary text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="text-foreground-secondary">Nitrogen purging completed</span>
                                </label>
                                {'tempThreshold' in currentStepInfo && (
                                    <p className="text-xs text-yellow-400 mt-2">
                                        Temperature must be at{' '}
                                        {(currentStepInfo as { tempThreshold?: number }).tempThreshold}C before
                                        proceeding
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Temperature & Pressure (steps 7, 9+, except step 8) */}
                        {currentStepInfo.stepNumber >= 7 && currentStepInfo.stepNumber !== 8 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                        Temperature (C)
                                    </label>
                                    <input
                                        type="number"
                                        value={stepTemp}
                                        onChange={(e) => setStepTemp(e.target.value)}
                                        className="input-field w-full"
                                        placeholder="Current temperature"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                        Pressure (bar)
                                    </label>
                                    <input
                                        type="number"
                                        value={stepPressure}
                                        onChange={(e) => setStepPressure(e.target.value)}
                                        className="input-field w-full"
                                        placeholder="Current pressure"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Notes</label>
                            <textarea
                                value={stepNotes}
                                onChange={(e) => setStepNotes(e.target.value)}
                                className="input-field w-full h-20 resize-none"
                                placeholder="Any observations..."
                            />
                        </div>

                        <button
                            onClick={handleCompleteStep}
                            disabled={saving}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {saving && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                            Complete Step {currentStepInfo.stepNumber}
                        </button>
                    </div>
                )}

                {/* Outputs Section */}
                {batch.currentStep >= 13 && (
                    <div className="glass-card p-6 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">Recorded Outputs</h3>
                            {!isCompleted && !isCancelled && (
                                <button onClick={() => setShowOutputForm(!showOutputForm)} className="btn-secondary">
                                    + Add Output
                                </button>
                            )}
                        </div>

                        {showOutputForm && (
                            <OutputForm
                                onSubmit={handleRecordOutput}
                                finishedProductItems={finishedProductItems}
                                saving={saving}
                            />
                        )}

                        {batch.outputs && batch.outputs.length > 0 ? (
                            <div className="space-y-2">
                                {batch.outputs.map((output, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between bg-surface-tertiary/50 p-3 rounded-lg"
                                    >
                                        <div>
                                            <span className="text-foreground font-medium">
                                                {
                                                    MATERIAL_CATEGORIES.find((m) => m.value === output.materialCategory)
                                                        ?.label
                                                }
                                            </span>
                                            {output.qualityGrade && (
                                                <span className="text-foreground-muted ml-2">
                                                    ({output.qualityGrade})
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-blue-400 font-semibold">
                                            {output.quantity} {output.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-foreground-faint text-center py-4">No outputs recorded yet</p>
                        )}
                    </div>
                )}

                {/* Completed State */}
                {isCompleted && (
                    <div className="glass-card p-8 text-center mb-4 border border-green-500/50 bg-green-500/10">
                        <h3 className="text-2xl font-bold text-green-400 mb-2">Batch Completed!</h3>
                        <p className="text-foreground-muted">All 14 steps have been completed successfully.</p>
                    </div>
                )}

                {/* Actions */}
                {!isCompleted && !isCancelled && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
                        <button
                            onClick={() => setCancelDialogOpen(true)}
                            disabled={saving}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-foreground rounded-lg font-medium transition-all"
                        >
                            Cancel Batch
                        </button>
                    </div>
                )}
            </main>

            {/* Cancel Dialog */}
            <InputDialog
                isOpen={cancelDialogOpen}
                title="Cancel Batch"
                message="Please provide a reason for cancelling this batch."
                placeholder="Enter cancellation reason..."
                confirmLabel="Cancel Batch"
                cancelLabel="Go Back"
                variant="danger"
                onConfirm={handleCancelBatchConfirm}
                onCancel={() => setCancelDialogOpen(false)}
                loading={saving}
            />
        </div>
    );
}
