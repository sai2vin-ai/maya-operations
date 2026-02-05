import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createGateEntry, uploadPhotoFromBlob, MATERIAL_CATEGORIES } from '../services/gateEntryService';
import type { EntryType, MaterialCategory } from '../types';

export default function GateEntryCreatePage() {
    const navigate = useNavigate();
    const { userData } = useAuth();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [formData, setFormData] = useState({
        entryType: 'IN' as EntryType,
        vehicleNumber: '',
        materialCategory: '' as MaterialCategory | '',
        quantity: '',
        unit: 'TONS' as 'KG' | 'TONS' | 'PIECES',
        weighbridgeReading: '',
        tareWeight: '',
        supplierName: '',
        driverName: '',
        driverPhone: '',
        purpose: '',
        notes: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
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
        } catch (err: any) {
            setError('Could not access camera: ' + err.message);
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
                setPhotoBlob(blob);
                setCapturedPhoto(canvas.toDataURL('image/jpeg'));
            }
        }, 'image/jpeg', 0.8);

        stopCamera();
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        setPhotoBlob(null);
        startCamera();
    };

    const validateForm = (): string | null => {
        if (!formData.vehicleNumber.trim()) return 'Vehicle number is required';
        if (!formData.entryType) return 'Entry type is required';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // Create entry first to get entry number
            const entryId = await createGateEntry({
                entryType: formData.entryType,
                vehicleNumber: formData.vehicleNumber,
                materialCategory: formData.materialCategory || undefined,
                quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
                unit: formData.unit,
                weighbridgeReading: formData.weighbridgeReading ? parseFloat(formData.weighbridgeReading) : undefined,
                tareWeight: formData.tareWeight ? parseFloat(formData.tareWeight) : undefined,
                supplierName: formData.supplierName || undefined,
                driverName: formData.driverName || undefined,
                driverPhone: formData.driverPhone || undefined,
                purpose: formData.purpose || undefined,
                notes: formData.notes || undefined,
            }, userData?.id || '');

            // Upload photo if captured
            if (photoBlob && entryId) {
                try {
                    const photoUrl = await uploadPhotoFromBlob(photoBlob, entryId, 'vehicle');
                    // TODO: Update entry with photo URL
                    console.log('Photo uploaded:', photoUrl);
                } catch (photoErr) {
                    console.error('Photo upload failed:', photoErr);
                }
            }

            navigate('/gate');
        } catch (err: any) {
            console.error('Error creating gate entry:', err);
            setError(err.message || 'Failed to create gate entry');
        } finally {
            setSaving(false);
        }
    };

    // Get default unit for selected material
    const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const category = e.target.value as MaterialCategory;
        const material = MATERIAL_CATEGORIES.find(m => m.value === category);
        setFormData(prev => ({
            ...prev,
            materialCategory: category,
            unit: (material?.unit || 'TONS') as 'KG' | 'TONS' | 'PIECES',
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            stopCamera();
                            navigate('/gate');
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">New Gate Entry</h1>
                        <p className="text-sm text-slate-400">Record vehicle entry or exit</p>
                    </div>
                </div>
            </header>

            <main className="p-4">
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Entry Type Toggle */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Entry Type</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, entryType: 'IN' }))}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${formData.entryType === 'IN'
                                        ? 'border-green-500 bg-green-500/20 text-green-400'
                                        : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                                    }`}
                            >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                                </svg>
                                <span className="text-lg font-semibold">ENTRY (IN)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, entryType: 'OUT' }))}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${formData.entryType === 'OUT'
                                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                                        : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                                    }`}
                            >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                <span className="text-lg font-semibold">EXIT (OUT)</span>
                            </button>
                        </div>
                    </div>

                    {/* Vehicle Photo */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Photo</h3>

                        <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden">
                            {cameraActive && !capturedPhoto && (
                                <>
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        playsInline
                                        muted
                                    />
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                                        >
                                            <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={stopCamera}
                                            className="px-4 py-2 bg-slate-700 rounded-lg text-white"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}

                            {capturedPhoto && (
                                <>
                                    <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={retakePhoto}
                                        className="absolute bottom-4 right-4 px-4 py-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600"
                                    >
                                        Retake
                                    </button>
                                </>
                            )}

                            {!cameraActive && !capturedPhoto && (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Open Camera
                                    </button>
                                    <p className="text-slate-500 text-sm mt-2">or photo is optional</p>
                                </div>
                            )}
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Vehicle Details */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Vehicle Number <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="vehicleNumber"
                                    value={formData.vehicleNumber}
                                    onChange={handleInputChange}
                                    className="input-field w-full uppercase"
                                    placeholder="MH12AB1234"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Purpose</label>
                                <input
                                    type="text"
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="Raw material delivery"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Material & Weight */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Material & Weight</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Material Category</label>
                                <select
                                    name="materialCategory"
                                    value={formData.materialCategory}
                                    onChange={handleMaterialChange}
                                    className="input-field w-full"
                                >
                                    <option value="">Select material...</option>
                                    {MATERIAL_CATEGORIES.map(mat => (
                                        <option key={mat.value} value={mat.value}>{mat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        className="input-field w-full"
                                        placeholder="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Unit</label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        className="input-field w-full"
                                    >
                                        <option value="TONS">Tons</option>
                                        <option value="KG">Kilograms</option>
                                        <option value="PIECES">Pieces</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Weighbridge Reading (kg)</label>
                                <input
                                    type="number"
                                    name="weighbridgeReading"
                                    value={formData.weighbridgeReading}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="Gross weight"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Tare Weight (kg)</label>
                                <input
                                    type="number"
                                    name="tareWeight"
                                    value={formData.tareWeight}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="Empty vehicle weight"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        {formData.weighbridgeReading && formData.tareWeight && (
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <span className="text-blue-400 font-semibold">
                                    Net Weight: {(parseFloat(formData.weighbridgeReading) - parseFloat(formData.tareWeight)).toFixed(2)} kg
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Supplier/Driver Info */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Supplier/Driver Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Supplier Name</label>
                                <input
                                    type="text"
                                    name="supplierName"
                                    value={formData.supplierName}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="Company name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Driver Name</label>
                                <input
                                    type="text"
                                    name="driverName"
                                    value={formData.driverName}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="Driver's name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Driver Phone</label>
                                <input
                                    type="tel"
                                    name="driverPhone"
                                    value={formData.driverPhone}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="9876543210"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Additional Notes</h3>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className="input-field w-full h-24 resize-none"
                            placeholder="Any additional notes..."
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                stopCamera();
                                navigate('/gate');
                            }}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            Save Entry
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
