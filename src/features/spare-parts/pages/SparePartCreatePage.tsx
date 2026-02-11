// Spare Part Create Page
// Form to add a new spare part to inventory

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui';
import { createSparePart, SPARE_PART_CATEGORIES, SPARE_PART_UNITS } from '../services/sparePartsService';
import type { SparePartCategory } from '../types';

export default function SparePartCreatePage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [category, setCategory] = useState<SparePartCategory>('GENERAL');
    const [fileNumber, setFileNumber] = useState('');
    const [description, setDescription] = useState('');
    const [unit, setUnit] = useState('PCS');
    const [currentStock, setCurrentStock] = useState('');
    const [minimumStock, setMinimumStock] = useState('');
    const [location, setLocation] = useState('');
    const [usedFor, setUsedFor] = useState('');
    const [unitPrice, setUnitPrice] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData?.id || !name || !currentStock || !minimumStock) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const partId = await createSparePart(
                {
                    name,
                    category,
                    fileNumber: fileNumber || undefined,
                    description: description || undefined,
                    unit,
                    currentStock: parseInt(currentStock),
                    minimumStock: parseInt(minimumStock),
                    location: location || undefined,
                    usedFor: usedFor || undefined,
                    unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
                },
                userData.id,
                userData.role,
            );

            toast.success('Spare part created successfully');
            navigate(`/spare-parts/${partId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create spare part');
            toast.error('Failed to create spare part');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/spare-parts')}
                    className="text-foreground-muted hover:text-foreground"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-foreground">Add Spare Part</h1>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
                {/* Name and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field w-full"
                            placeholder="Part name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Category *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as SparePartCategory)}
                            className="input-field w-full"
                        >
                            {SPARE_PART_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* File Number and Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">File Number</label>
                        <input
                            type="text"
                            value={fileNumber}
                            onChange={(e) => setFileNumber(e.target.value)}
                            className="input-field w-full"
                            placeholder="Catalog/file reference"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field w-full"
                            placeholder="Brief description"
                        />
                    </div>
                </div>

                {/* Stock and Unit */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">
                            Initial Stock *
                        </label>
                        <input
                            type="number"
                            value={currentStock}
                            onChange={(e) => setCurrentStock(e.target.value)}
                            className="input-field w-full"
                            placeholder="0"
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">
                            Minimum Stock *
                        </label>
                        <input
                            type="number"
                            value={minimumStock}
                            onChange={(e) => setMinimumStock(e.target.value)}
                            className="input-field w-full"
                            placeholder="Reorder level"
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Unit</label>
                        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-field w-full">
                            {SPARE_PART_UNITS.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Location and Used For */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">
                            Storage Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="input-field w-full"
                            placeholder="e.g., Rack A-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">
                            Used For (Machine)
                        </label>
                        <input
                            type="text"
                            value={usedFor}
                            onChange={(e) => setUsedFor(e.target.value)}
                            className="input-field w-full"
                            placeholder="e.g., Reactor 1, Reactor 2"
                        />
                    </div>
                </div>

                {/* Unit Price */}
                <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Unit Price (₹)</label>
                    <input
                        type="number"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        className="input-field w-full md:w-1/2"
                        placeholder="Optional"
                        min="0"
                        step="0.01"
                    />
                </div>

                {/* Submit */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving || !name || !currentStock || !minimumStock}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {saving && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        Add Spare Part
                    </button>
                </div>

                <p className="text-xs text-foreground-faint text-center">
                    Part number will be auto-generated based on category
                </p>
            </form>
        </div>
    );
}
