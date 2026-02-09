import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui';
import { createAsset, ASSET_CATEGORIES, ASSET_LOCATIONS } from '../services/assetService';
import type { AssetCriticality } from '../../../types';

export default function AssetCreatePage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [category, setCategory] = useState('REACTOR');
    const [location, setLocation] = useState('');
    const [criticality, setCriticality] = useState<AssetCriticality>('MEDIUM');
    const [installationDate, setInstallationDate] = useState('');
    const [pmFrequencyDays, setPmFrequencyDays] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData?.id || !name || !location) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const assetId = await createAsset({
                name,
                category,
                location,
                criticality,
                installationDate: installationDate || undefined,
                pmFrequencyDays: pmFrequencyDays ? parseInt(pmFrequencyDays) : undefined,
            }, userData.id, userData.role);

            toast.success('Asset registered successfully');
            navigate(`/assets/${assetId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to register asset');
            toast.error('Failed to register asset');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/assets')} className="text-foreground-muted hover:text-foreground">
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-foreground">Register Asset</h1>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Asset Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field w-full"
                            placeholder="e.g., Reactor 1 Main Motor"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Category *</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field w-full">
                            {ASSET_CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Location *</label>
                        <select value={location} onChange={(e) => setLocation(e.target.value)} className="input-field w-full" required>
                            <option value="">Select location...</option>
                            {ASSET_LOCATIONS.map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Criticality *</label>
                        <select value={criticality} onChange={(e) => setCriticality(e.target.value as AssetCriticality)} className="input-field w-full">
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Installation Date</label>
                        <input
                            type="date"
                            value={installationDate}
                            onChange={(e) => setInstallationDate(e.target.value)}
                            className="input-field w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">PM Frequency (days)</label>
                        <input
                            type="number"
                            value={pmFrequencyDays}
                            onChange={(e) => setPmFrequencyDays(e.target.value)}
                            className="input-field w-full"
                            placeholder="e.g., 30"
                            min="1"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving || !name || !location}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Register Asset
                    </button>
                </div>

                <p className="text-xs text-foreground-faint text-center">
                    Asset code will be auto-generated
                </p>
            </form>
        </div>
    );
}
