import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    getGateEntryById,
    updateGateEntry,
    completeGateEntry,
    cancelGateEntry,
    MATERIAL_CATEGORIES,
    ENTRY_STATUSES,
} from '../services/gateEntryService';
import type { GateEntry, MaterialCategory, GateEntryStatus } from '../types';

export function GateEntryDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();

    const [entry, setEntry] = useState<GateEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
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

    useEffect(() => {
        if (id) {
            loadEntry(id);
        }
    }, [id]);

    const loadEntry = async (entryId: string) => {
        try {
            setLoading(true);
            setError(null);
            const fetchedEntry = await getGateEntryById(entryId);
            if (fetchedEntry) {
                setEntry(fetchedEntry);
                setFormData({
                    materialCategory: fetchedEntry.materialCategory || '',
                    quantity: fetchedEntry.quantity?.toString() || '',
                    unit: fetchedEntry.unit || 'TONS',
                    weighbridgeReading: fetchedEntry.weighbridgeReading?.toString() || '',
                    tareWeight: fetchedEntry.tareWeight?.toString() || '',
                    supplierName: fetchedEntry.supplierName || '',
                    driverName: fetchedEntry.driverName || '',
                    driverPhone: fetchedEntry.driverPhone || '',
                    purpose: fetchedEntry.purpose || '',
                    notes: fetchedEntry.notes || '',
                });
            } else {
                setError('Entry not found');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load entry');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!id || !userData?.id) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            await updateGateEntry(id, {
                materialCategory: formData.materialCategory as MaterialCategory || undefined,
                quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
                unit: formData.unit,
                weighbridgeReading: formData.weighbridgeReading ? parseFloat(formData.weighbridgeReading) : undefined,
                tareWeight: formData.tareWeight ? parseFloat(formData.tareWeight) : undefined,
                supplierName: formData.supplierName || undefined,
                driverName: formData.driverName || undefined,
                driverPhone: formData.driverPhone || undefined,
                purpose: formData.purpose || undefined,
                notes: formData.notes || undefined,
            }, userData.id);

            setSuccess('Entry updated successfully');
            setIsEditing(false);
            await loadEntry(id);
        } catch (err: any) {
            setError(err.message || 'Failed to update entry');
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        if (!id || !userData?.id) return;

        try {
            setSaving(true);
            setError(null);
            await completeGateEntry(id, userData.id);
            setSuccess('Entry marked as completed');
            await loadEntry(id);
        } catch (err: any) {
            setError(err.message || 'Failed to complete entry');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        if (!id || !userData?.id) return;

        const reason = window.prompt('Enter cancellation reason:');
        if (!reason) return;

        try {
            setSaving(true);
            setError(null);
            await cancelGateEntry(id, reason, userData.id);
            setSuccess('Entry cancelled');
            await loadEntry(id);
        } catch (err: any) {
            setError(err.message || 'Failed to cancel entry');
        } finally {
            setSaving(false);
        }
    };

    const cancelEditing = () => {
        if (entry) {
            setFormData({
                materialCategory: entry.materialCategory || '',
                quantity: entry.quantity?.toString() || '',
                unit: entry.unit || 'TONS',
                weighbridgeReading: entry.weighbridgeReading?.toString() || '',
                tareWeight: entry.tareWeight?.toString() || '',
                supplierName: entry.supplierName || '',
                driverName: entry.driverName || '',
                driverPhone: entry.driverPhone || '',
                purpose: entry.purpose || '',
                notes: entry.notes || '',
            });
        }
        setIsEditing(false);
        setError(null);
        setSuccess(null);
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('en-IN');
    };

    const getMaterialLabel = (category?: string) => {
        return MATERIAL_CATEGORIES.find(m => m.value === category)?.label || category || '-';
    };

    const getStatusInfo = (status: GateEntryStatus) => {
        return ENTRY_STATUSES.find(s => s.value === status) || { label: status, color: 'gray' };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!entry) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="glass-card p-8 text-center max-w-md">
                    <h2 className="text-xl font-bold text-white mb-2">Entry Not Found</h2>
                    <p className="text-slate-400 mb-4">The gate entry you're looking for doesn't exist.</p>
                    <button onClick={() => navigate('/gate')} className="btn-primary">
                        Back to Gate Operations
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(entry.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/gate')}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">{entry.entryNumber}</h1>
                            <p className="text-sm text-slate-400">{entry.vehicleNumber}</p>
                        </div>
                    </div>

                    {!isEditing && entry.status === 'PENDING' && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                    )}

                    {isEditing && (
                        <div className="flex gap-2">
                            <button onClick={cancelEditing} className="btn-secondary">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary flex items-center gap-2"
                            >
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Save
                            </button>
                        </div>
                    )}
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

                {/* Entry Overview */}
                <div className="glass-card p-6 mb-4">
                    <div className="flex items-start gap-4">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${entry.entryType === 'IN'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {entry.entryType === 'IN' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                )}
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold text-white">{entry.vehicleNumber}</h2>
                                <span className={`px-2 py-0.5 text-sm font-medium rounded ${entry.entryType === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                                    }`}>
                                    {entry.entryType}
                                </span>
                            </div>
                            <p className="text-slate-400">{entry.entryNumber}</p>
                            <div className="flex items-center gap-2 mt-2">
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

                {/* Vehicle Photo */}
                {entry.vehiclePhoto && (
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Photo</h3>
                        <img
                            src={entry.vehiclePhoto}
                            alt="Vehicle"
                            className="w-full max-w-md rounded-xl"
                        />
                    </div>
                )}

                {/* Material & Weight */}
                <div className="glass-card p-6 mb-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Material & Weight</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Material Category</label>
                            {isEditing ? (
                                <select
                                    name="materialCategory"
                                    value={formData.materialCategory}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                >
                                    <option value="">Select material...</option>
                                    {MATERIAL_CATEGORIES.map(mat => (
                                        <option key={mat.value} value={mat.value}>{mat.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-white py-2">{getMaterialLabel(entry.materialCategory)}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        className="input-field w-full"
                                        step="0.01"
                                    />
                                ) : (
                                    <p className="text-white py-2">{entry.quantity || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Unit</label>
                                {isEditing ? (
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
                                ) : (
                                    <p className="text-white py-2">{entry.unit || '-'}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Weighbridge Reading (kg)</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    name="weighbridgeReading"
                                    value={formData.weighbridgeReading}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    step="0.01"
                                />
                            ) : (
                                <p className="text-white py-2">{entry.weighbridgeReading || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Tare Weight (kg)</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    name="tareWeight"
                                    value={formData.tareWeight}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    step="0.01"
                                />
                            ) : (
                                <p className="text-white py-2">{entry.tareWeight || '-'}</p>
                            )}
                        </div>
                    </div>
                    {entry.netWeight && (
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <span className="text-blue-400 font-semibold">Net Weight: {entry.netWeight} kg</span>
                        </div>
                    )}
                </div>

                {/* Supplier/Driver Info */}
                <div className="glass-card p-6 mb-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Supplier/Driver Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Supplier Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="supplierName"
                                    value={formData.supplierName}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                />
                            ) : (
                                <p className="text-white py-2">{entry.supplierName || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Driver Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="driverName"
                                    value={formData.driverName}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                />
                            ) : (
                                <p className="text-white py-2">{entry.driverName || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Driver Phone</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="driverPhone"
                                    value={formData.driverPhone}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                />
                            ) : (
                                <p className="text-white py-2">{entry.driverPhone || '-'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="glass-card p-6 mb-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
                    {isEditing ? (
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className="input-field w-full h-24 resize-none"
                        />
                    ) : (
                        <p className="text-white">{entry.notes || 'No notes'}</p>
                    )}
                </div>

                {/* Timeline */}
                <div className="glass-card p-6 mb-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-slate-400">Entry Time:</span>
                                <span className="text-white ml-2">{formatTime(entry.entryTime)}</span>
                            </div>
                        </div>
                        {entry.exitTime && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-slate-400">Exit Time:</span>
                                    <span className="text-white ml-2">{formatTime(entry.exitTime)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {entry.status === 'PENDING' && !isEditing && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleComplete}
                                disabled={saving}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Mark Completed
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel Entry
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
