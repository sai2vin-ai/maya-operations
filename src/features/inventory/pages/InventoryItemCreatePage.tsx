import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInventoryItem, INVENTORY_CATEGORIES, COMMON_UNITS } from '../services/inventoryService';
import { useAuth } from '../../../contexts/AuthContext';
import type { InventoryCategory } from '../types';

export default function InventoryItemCreatePage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [category, setCategory] = useState<InventoryCategory>('RAW_MATERIAL');
    const [unit, setUnit] = useState('KG');
    const [minimumStock, setMinimumStock] = useState<number>(0);
    const [maximumStock, setMaximumStock] = useState<number | ''>('');
    const [location, setLocation] = useState('');
    const [initialStock, setInitialStock] = useState<number | ''>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData?.id) {
            setError('You must be logged in to add items');
            return;
        }

        if (!name.trim()) {
            setError('Item name is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await createInventoryItem({
                name: name.trim(),
                category,
                unit,
                minimumStock,
                maximumStock: maximumStock || undefined,
                location: location.trim() || undefined,
                initialStock: initialStock || undefined,
            }, userData.id);

            navigate('/inventory');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create inventory item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/inventory')}
                        className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Add Inventory Item</h1>
                        <p className="text-sm text-foreground-muted">Create a new item to track</p>
                    </div>
                </div>
            </header>

            <main className="p-4 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="glass-card p-4 border border-red-500/50 bg-red-500/10">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="glass-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                Item Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Whole Waste Tyres"
                                className="input-field w-full"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                    Category *
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                                    className="input-field w-full"
                                >
                                    {INVENTORY_CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                    Unit *
                                </label>
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="input-field w-full"
                                >
                                    {COMMON_UNITS.map((u) => (
                                        <option key={u} value={u}>
                                            {u}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                Storage Location
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., Warehouse A, Rack 3"
                                className="input-field w-full"
                            />
                        </div>
                    </div>

                    {/* Stock Levels */}
                    <div className="glass-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Stock Levels</h2>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                    Minimum Stock *
                                </label>
                                <input
                                    type="number"
                                    value={minimumStock}
                                    onChange={(e) => setMinimumStock(parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    className="input-field w-full"
                                    required
                                />
                                <p className="text-xs text-foreground-faint mt-1">Alert when below this</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                    Maximum Stock
                                </label>
                                <input
                                    type="number"
                                    value={maximumStock}
                                    onChange={(e) => setMaximumStock(e.target.value ? parseFloat(e.target.value) : '')}
                                    min="0"
                                    step="0.01"
                                    className="input-field w-full"
                                />
                                <p className="text-xs text-foreground-faint mt-1">Optional capacity</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                    Initial Stock
                                </label>
                                <input
                                    type="number"
                                    value={initialStock}
                                    onChange={(e) => setInitialStock(e.target.value ? parseFloat(e.target.value) : '')}
                                    min="0"
                                    step="0.01"
                                    className="input-field w-full"
                                />
                                <p className="text-xs text-foreground-faint mt-1">Current on-hand</p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/inventory')}
                            className="flex-1 py-3 px-6 rounded-xl font-semibold bg-surface-tertiary text-foreground hover:bg-surface-hover transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Creating...
                                </span>
                            ) : (
                                'Create Item'
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
