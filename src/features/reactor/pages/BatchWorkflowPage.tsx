import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getBatchById, completeStep, uploadStepPhoto, recordOutput, cancelBatch, BATCH_STEPS, getBatchStatusInfo, type CompleteStepData } from '../services/batchService';
import { MATERIAL_CATEGORIES, getGateEntries } from '../../gate/services/gateEntryService';
import { getInventoryItemsByCategory } from '../../inventory/services/inventoryService';
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

    // Step completion form
    const [stepNotes, setStepNotes] = useState('');
    const [stepTemp, setStepTemp] = useState('');
    const [stepPressure, setStepPressure] = useState('');
    const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
    const [photoBlobs, setPhotoBlobs] = useState<Blob[]>([]);
    const [cameraActive, setCameraActive] = useState(false);

    // New fields for specific steps
    const [inputWeight, setInputWeight] = useState('');
    const [nitrogenPurged, setNitrogenPurged] = useState(false);
    const [pyrolysisReadings, setPyrolysisReadings] = useState<{
        reactorTemp: string;
        reactorPressure: string;
        firstTankTemp: string;
        firstTankPressure: string;
        panelTemp: string;
        panelPressure: string;
    }[]>([]);
    const [selectedGateEntryIds, setSelectedGateEntryIds] = useState<string[]>([]);
    const [availableGateEntries, setAvailableGateEntries] = useState<GateEntry[]>([]);

    // Output recording
    const [showOutputForm, setShowOutputForm] = useState(false);
    const [outputCategory, setOutputCategory] = useState<MaterialCategory | ''>('');
    const [outputQuantity, setOutputQuantity] = useState('');
    const [outputUnit, setOutputUnit] = useState<'KG' | 'TONS'>('KG');
    const [outputGrade, setOutputGrade] = useState('');
    const [outputInventoryItemId, setOutputInventoryItemId] = useState('');
    const [finishedProductItems, setFinishedProductItems] = useState<InventoryItem[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (batchId) {
            loadBatch(batchId);
        }
        // Load finished product inventory items for output recording
        loadFinishedProducts();
        // Load completed gate entries for LOADING step
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
            // Filter to only show COMPLETED entries (raw materials ready for use)
            const completed = entries.filter(e => e.status === 'COMPLETED');
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

    // Camera functions
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 1280, height: 720 }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraActive(true);
        } catch (err) {
            setError('Could not access camera: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                setPhotoBlobs(prev => [...prev, blob]);
                setCapturedPhotos(prev => [...prev, canvas.toDataURL('image/jpeg')]);
            }
        }, 'image/jpeg', 0.8);

        stopCamera();
    };

    const clearPhotos = () => {
        setCapturedPhotos([]);
        setPhotoBlobs([]);
    };

    const handleCompleteStep = async () => {
        if (!batch || !userData?.id) return;

        const nextStep = batch.currentStep + 1;
        const stepInfo = BATCH_STEPS.find(s => s.stepNumber === nextStep);
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

            // Build step data based on step type
            const stepData: CompleteStepData = {
                stepNumber: nextStep,
                notes: stepNotes || undefined,
                photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
                temperature: stepTemp ? parseFloat(stepTemp) : undefined,
                pressure: stepPressure ? parseFloat(stepPressure) : undefined,
            };

            // Add step-specific fields
            if (nextStep === 3 && inputWeight) {
                stepData.inputWeight = parseFloat(inputWeight);
            }
            // Add linked gate entries for LOADING step
            if (nextStep === 3 && selectedGateEntryIds.length > 0) {
                stepData.gateEntryIds = selectedGateEntryIds;
            }
            if ((nextStep === 10 || nextStep === 11) && nitrogenPurged) {
                stepData.nitrogenPurged = nitrogenPurged;
            }
            if (nextStep === 8 && pyrolysisReadings.length > 0) {
                stepData.pyrolysisReadings = pyrolysisReadings.map(r => ({
                    reactorTemp: parseFloat(r.reactorTemp) || 0,
                    reactorPressure: parseFloat(r.reactorPressure) || 0,
                    firstTankTemp: r.firstTankTemp ? parseFloat(r.firstTankTemp) : undefined,
                    firstTankPressure: r.firstTankPressure ? parseFloat(r.firstTankPressure) : undefined,
                    panelTemp: r.panelTemp ? parseFloat(r.panelTemp) : undefined,
                    panelPressure: r.panelPressure ? parseFloat(r.panelPressure) : undefined,
                }));
            }

            await completeStep(batch.id, stepData, userData.id);

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
    };

    const handleRecordOutput = async () => {
        if (!batch || !userData?.id || !outputCategory || !outputQuantity) return;

        try {
            setSaving(true);
            setError(null);

            await recordOutput(batch.id, {
                materialCategory: outputCategory as MaterialCategory,
                quantity: parseFloat(outputQuantity),
                unit: outputUnit,
                qualityGrade: outputGrade || undefined,
                inventoryItemId: outputInventoryItemId || undefined,
            }, userData.id);

            const inventoryNote = outputInventoryItemId ? ' & inventory updated!' : '!';
            setSuccess(`Output recorded${inventoryNote}`);
            setShowOutputForm(false);
            setOutputCategory('');
            setOutputQuantity('');
            setOutputGrade('');
            setOutputInventoryItemId('');

            await loadBatch(batch.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record output');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelBatch = async () => {
        if (!batch || !userData?.id) return;

        const reason = window.prompt('Enter cancellation reason:');
        if (!reason) return;

        try {
            setSaving(true);
            await cancelBatch(batch.id, reason, userData.id);
            navigate('/reactor');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel batch');
        } finally {
            setSaving(false);
        }
    };

    const currentStepInfo = batch ? BATCH_STEPS.find(s => s.stepNumber === batch.currentStep + 1) : null;
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
                    <h2 className="text-xl font-bold text-white mb-2">Batch Not Found</h2>
                    <button onClick={() => navigate('/reactor')} className="btn-primary">
                        Back to Reactors
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = getBatchStatusInfo(batch.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/reactor')}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">{batch.batchNumber}</h1>
                            <div className="flex items-center gap-2">
                                <span className={`status-badge ${statusInfo.color === 'green' ? 'status-active' :
                                    statusInfo.color === 'yellow' ? 'status-pending' :
                                        'status-inactive'
                                    }`}>
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
                        <h3 className="text-lg font-semibold text-white">Workflow Progress</h3>
                        <span className="text-2xl font-bold text-blue-400">
                            {Math.round((batch.currentStep / batch.totalSteps) * 100)}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 bg-slate-700 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                            style={{ width: `${(batch.currentStep / batch.totalSteps) * 100}%` }}
                        />
                    </div>

                    {/* Steps Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {BATCH_STEPS.map((step) => {
                            const isComplete = batch.currentStep >= step.stepNumber;
                            const isCurrent = batch.currentStep + 1 === step.stepNumber;
                            return (
                                <div
                                    key={step.stepNumber}
                                    className={`p-2 rounded-lg text-center text-xs ${isComplete ? 'bg-green-500/20 text-green-400' :
                                        isCurrent ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500' :
                                            'bg-slate-700/50 text-slate-500'
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
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Step {currentStepInfo.stepNumber}: {currentStepInfo.stepName}
                        </h3>

                        {/* Photo Capture */}
                        {currentStepInfo.requiresPhoto && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Photo Required {capturedPhotos.length > 0 && `(${capturedPhotos.length} captured)`}
                                </label>
                                <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden max-w-md relative">
                                    {cameraActive && (
                                        <>
                                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                                <button onClick={capturePhoto} className="w-12 h-12 bg-white rounded-full shadow-lg">
                                                    <div className="w-8 h-8 bg-red-500 rounded-full mx-auto"></div>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                    {capturedPhotos.length > 0 && !cameraActive && (
                                        <img src={capturedPhotos[capturedPhotos.length - 1]} alt="Captured" className="w-full h-full object-cover" />
                                    )}
                                    {!cameraActive && capturedPhotos.length === 0 && (
                                        <div className="flex items-center justify-center h-full">
                                            <button onClick={startCamera} className="btn-secondary">📷 Open Camera</button>
                                        </div>
                                    )}
                                </div>
                                {capturedPhotos.length > 0 && (
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={startCamera} className="btn-secondary text-sm">📷 Add Another</button>
                                        <button onClick={clearPhotos} className="text-sm text-red-400 hover:text-red-300">Clear All</button>
                                    </div>
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        )}
                        {/* Step Description */}
                        {'description' in currentStepInfo && (
                            <p className="text-slate-400 mb-4 text-sm">
                                {(currentStepInfo as { description?: string }).description}
                            </p>
                        )}

                        {/* Step 3: Input Weight for LOADING */}
                        {currentStepInfo.stepNumber === 3 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Input Weight (KG) *</label>
                                <input
                                    type="number"
                                    value={inputWeight}
                                    onChange={(e) => setInputWeight(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="Raw material weight in KG"
                                    required
                                />
                                {/* Gate Entry Selector */}
                                {availableGateEntries.length > 0 && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Link Gate Entries (optional)
                                        </label>
                                        <div className="bg-slate-700/50 p-3 rounded-lg max-h-40 overflow-y-auto space-y-2">
                                            {availableGateEntries.map(entry => (
                                                <label key={entry.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGateEntryIds.includes(entry.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedGateEntryIds([...selectedGateEntryIds, entry.id]);
                                                            } else {
                                                                setSelectedGateEntryIds(selectedGateEntryIds.filter(id => id !== entry.id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                                                    />
                                                    <span className="text-sm text-slate-300">
                                                        {entry.entryNumber} - {entry.vehicleNumber} ({entry.quantity} {entry.unit})
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Select gate entries to link raw materials to this batch
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 8: Pyrolysis Multi-Point Readings */}
                        {currentStepInfo.stepNumber === 8 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Temperature & Pressure Readings</label>
                                <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                                    {pyrolysisReadings.map((reading, idx) => (
                                        <div key={idx} className="grid grid-cols-6 gap-2 text-sm">
                                            <input type="number" value={reading.reactorTemp} onChange={(e) => {
                                                const updated = [...pyrolysisReadings];
                                                updated[idx].reactorTemp = e.target.value;
                                                setPyrolysisReadings(updated);
                                            }} className="input-field" placeholder="Reactor °C" />
                                            <input type="number" value={reading.reactorPressure} onChange={(e) => {
                                                const updated = [...pyrolysisReadings];
                                                updated[idx].reactorPressure = e.target.value;
                                                setPyrolysisReadings(updated);
                                            }} className="input-field" placeholder="Reactor bar" />
                                            <input type="number" value={reading.firstTankTemp} onChange={(e) => {
                                                const updated = [...pyrolysisReadings];
                                                updated[idx].firstTankTemp = e.target.value;
                                                setPyrolysisReadings(updated);
                                            }} className="input-field" placeholder="Tank °C" />
                                            <input type="number" value={reading.firstTankPressure} onChange={(e) => {
                                                const updated = [...pyrolysisReadings];
                                                updated[idx].firstTankPressure = e.target.value;
                                                setPyrolysisReadings(updated);
                                            }} className="input-field" placeholder="Tank bar" />
                                            <input type="number" value={reading.panelTemp} onChange={(e) => {
                                                const updated = [...pyrolysisReadings];
                                                updated[idx].panelTemp = e.target.value;
                                                setPyrolysisReadings(updated);
                                            }} className="input-field" placeholder="Panel °C" />
                                            <input type="number" value={reading.panelPressure} onChange={(e) => {
                                                const updated = [...pyrolysisReadings];
                                                updated[idx].panelPressure = e.target.value;
                                                setPyrolysisReadings(updated);
                                            }} className="input-field" placeholder="Panel bar" />
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setPyrolysisReadings([...pyrolysisReadings, {
                                            reactorTemp: '', reactorPressure: '',
                                            firstTankTemp: '', firstTankPressure: '',
                                            panelTemp: '', panelPressure: ''
                                        }])}
                                        className="btn-secondary text-sm w-full"
                                    >
                                        + Add Reading
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Reactor | 1st Tank | Panel (Temp + Pressure)</p>
                            </div>
                        )}

                        {/* Steps 10 & 11: Nitrogen Purge Confirmation */}
                        {(currentStepInfo.stepNumber === 10 || currentStepInfo.stepNumber === 11) && (
                            <div className="mb-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={nitrogenPurged}
                                        onChange={(e) => setNitrogenPurged(e.target.checked)}
                                        className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="text-slate-300">Nitrogen purging completed</span>
                                </label>
                                {'tempThreshold' in currentStepInfo && (
                                    <p className="text-xs text-yellow-400 mt-2">
                                        ⚠️ Temperature must be at {(currentStepInfo as { tempThreshold?: number }).tempThreshold}°C before proceeding
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Temperature & Pressure (only for PRE_HEATING onwards, except PYROLYSIS which has its own table) */}
                        {currentStepInfo.stepNumber >= 7 && currentStepInfo.stepNumber !== 8 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Temperature (°C)</label>
                                    <input
                                        type="number"
                                        value={stepTemp}
                                        onChange={(e) => setStepTemp(e.target.value)}
                                        className="input-field w-full"
                                        placeholder="Current temperature"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Pressure (bar)</label>
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
                            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
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
                            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            ✅ Complete Step {currentStepInfo.stepNumber}
                        </button>
                    </div>
                )}

                {/* Outputs Section */}
                {batch.currentStep >= 13 && (
                    <div className="glass-card p-6 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Recorded Outputs</h3>
                            {!isCompleted && !isCancelled && (
                                <button onClick={() => setShowOutputForm(!showOutputForm)} className="btn-secondary">
                                    + Add Output
                                </button>
                            )}
                        </div>

                        {/* Output Form */}
                        {showOutputForm && (
                            <div className="bg-slate-700/50 p-4 rounded-lg mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <select
                                        value={outputCategory}
                                        onChange={(e) => setOutputCategory(e.target.value as MaterialCategory)}
                                        className="input-field"
                                    >
                                        <option value="">Select material...</option>
                                        {MATERIAL_CATEGORIES.filter(m => ['CB-STD', 'CB-HG', 'PO-CRD', 'SW-MIX'].includes(m.value)).map(mat => (
                                            <option key={mat.value} value={mat.value}>{mat.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={outputQuantity}
                                        onChange={(e) => setOutputQuantity(e.target.value)}
                                        className="input-field"
                                        placeholder="Quantity"
                                    />
                                    <select
                                        value={outputUnit}
                                        onChange={(e) => setOutputUnit(e.target.value as 'KG' | 'TONS')}
                                        className="input-field"
                                    >
                                        <option value="KG">KG</option>
                                        <option value="TONS">TONS</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={outputGrade}
                                        onChange={(e) => setOutputGrade(e.target.value)}
                                        className="input-field"
                                        placeholder="Grade (optional)"
                                    />
                                </div>
                                {/* Inventory Item Selector */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Link to Inventory (optional)
                                    </label>
                                    <select
                                        value={outputInventoryItemId}
                                        onChange={(e) => setOutputInventoryItemId(e.target.value)}
                                        className="input-field w-full"
                                    >
                                        <option value="">Don't update inventory</option>
                                        {finishedProductItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.code} - {item.name} ({item.currentStock} {item.unit})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Select an inventory item to automatically update stock when recording output
                                    </p>
                                </div>
                                <button
                                    onClick={handleRecordOutput}
                                    disabled={saving || !outputCategory || !outputQuantity}
                                    className="btn-primary"
                                >
                                    Record Output
                                </button>
                            </div>
                        )}

                        {/* Outputs List */}
                        {batch.outputs && batch.outputs.length > 0 ? (
                            <div className="space-y-2">
                                {batch.outputs.map((output, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                                        <div>
                                            <span className="text-white font-medium">
                                                {MATERIAL_CATEGORIES.find(m => m.value === output.materialCategory)?.label}
                                            </span>
                                            {output.qualityGrade && (
                                                <span className="text-slate-400 ml-2">({output.qualityGrade})</span>
                                            )}
                                        </div>
                                        <span className="text-blue-400 font-semibold">
                                            {output.quantity} {output.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4">No outputs recorded yet</p>
                        )}
                    </div>
                )}

                {/* Completed State */}
                {isCompleted && (
                    <div className="glass-card p-8 text-center mb-4 border border-green-500/50 bg-green-500/10">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-2xl font-bold text-green-400 mb-2">Batch Completed!</h3>
                        <p className="text-slate-400">All 14 steps have been completed successfully.</p>
                    </div>
                )}

                {/* Actions */}
                {!isCompleted && !isCancelled && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                        <button
                            onClick={handleCancelBatch}
                            disabled={saving}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
                        >
                            Cancel Batch
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
