import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getReactorById } from '../services/reactorService';
import { createBatch } from '../services/batchService';
import type { Reactor } from '../types';

export function BatchCreatePage() {
    const { reactorId } = useParams<{ reactorId: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();

    const [reactor, setReactor] = useState<Reactor | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        inputWeight: '',
        shiftId: '',
        notes: '',
    });

    useEffect(() => {
        if (reactorId) {
            loadReactor(reactorId);
        }
    }, [reactorId]);

    const loadReactor = async (id: string) => {
        try {
            setLoading(true);
            const fetchedReactor = await getReactorById(id);
            if (fetchedReactor) {
                setReactor(fetchedReactor);
                if (fetchedReactor.status !== 'IDLE') {
                    setError(`Reactor is currently ${fetchedReactor.status}. Cannot start a new batch.`);
                }
            } else {
                setError('Reactor not found');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load reactor');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reactor || !userData?.id) return;

        try {
            setSaving(true);
            setError(null);

            const batchId = await createBatch({
                reactorId: reactor.id,
                reactorNumber: reactor.reactorNumber,
                inputWeight: formData.inputWeight ? parseFloat(formData.inputWeight) : undefined,
                shiftId: formData.shiftId || undefined,
                notes: formData.notes || undefined,
            }, userData.id);

            // Navigate to batch workflow
            navigate(`/batch/${batchId}`);
        } catch (err: any) {
            setError(err.message || 'Failed to create batch');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="glass-card m-4 p-4">
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
                        <h1 className="text-xl font-bold text-white">Start New Batch</h1>
                        <p className="text-sm text-slate-400">{reactor?.name} ({reactor?.reactorNumber})</p>
                    </div>
                </div>
            </header>

            <main className="p-4">
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {reactor?.status === 'IDLE' ? (
                    <form onSubmit={handleSubmit}>
                        {/* Reactor Info */}
                        <div className="glass-card p-6 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-3xl">🔥</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{reactor.reactorNumber}</h2>
                                    <p className="text-slate-400">{reactor.name}</p>
                                    <p className="text-green-400 text-sm mt-1">Ready to start batch</p>
                                </div>
                            </div>
                        </div>

                        {/* Batch Info - Auto-filled */}
                        <div className="glass-card p-6 mb-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Batch Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Date
                                    </label>
                                    <div className="input-field w-full bg-slate-700/50 text-white cursor-not-allowed">
                                        {new Date().toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Auto-filled from device</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Batch Number
                                    </label>
                                    <div className="input-field w-full bg-slate-700/50 text-white cursor-not-allowed">
                                        {reactor.reactorNumber}-{new Date().toISOString().split('T')[0].replace(/-/g, '')}-XXX
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Serial # auto-generated (e.g., M1-20260128-001)</p>
                                </div>
                            </div>
                        </div>

                        {/* Input Details */}
                        <div className="glass-card p-6 mb-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Batch Input</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Input Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        name="inputWeight"
                                        value={formData.inputWeight}
                                        onChange={handleInputChange}
                                        className="input-field w-full"
                                        placeholder="Weight of tyres loaded"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Shift
                                    </label>
                                    <select
                                        name="shiftId"
                                        value={formData.shiftId}
                                        onChange={handleInputChange}
                                        className="input-field w-full"
                                    >
                                        <option value="">Select shift...</option>
                                        <option value="A">Shift A (6AM - 2PM)</option>
                                        <option value="B">Shift B (2PM - 10PM)</option>
                                        <option value="C">Shift C (10PM - 6AM)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="glass-card p-6 mb-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="input-field w-full h-24 resize-none"
                                placeholder="Any additional notes about this batch..."
                            />
                        </div>

                        {/* Workflow Preview */}
                        <div className="glass-card p-6 mb-4">
                            <h3 className="text-lg font-semibold text-white mb-4">14-Step Workflow</h3>
                            <p className="text-slate-400 mb-4">This batch will follow the standard 14-step pyrolysis workflow:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                {[
                                    '1. Tyre Loading',
                                    '2. Seal Reactor',
                                    '3. Pre-Heat Check',
                                    '4. Start Heating',
                                    '5. Temp 150°C',
                                    '6. Temp 250°C',
                                    '7. Temp 350°C',
                                    '8. Temp 450°C',
                                    '9. Maintain Temp',
                                    '10. Cooling Start',
                                    '11. Below 100°C',
                                    '12. Open Reactor',
                                    '13. Extract Outputs',
                                    '14. Clean & Inspect',
                                ].map((step, idx) => (
                                    <div key={idx} className="bg-slate-700/50 px-3 py-2 rounded-lg text-slate-300">
                                        {step}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/reactor')}
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
                                🔥 Start Batch
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="glass-card p-8 text-center">
                        <p className="text-slate-400">Cannot start batch - reactor is not idle</p>
                        <button
                            onClick={() => navigate('/reactor')}
                            className="btn-primary mt-4"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
