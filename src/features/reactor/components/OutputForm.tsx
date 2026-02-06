import { useState, useCallback } from 'react';
import { MATERIAL_CATEGORIES } from '../../gate/services/gateEntryService';
import type { MaterialCategory } from '../types';
import type { InventoryItem } from '../../inventory/types';

interface OutputFormProps {
    onSubmit: (data: {
        materialCategory: MaterialCategory;
        quantity: number;
        unit: 'KG' | 'TONS';
        qualityGrade?: string;
        inventoryItemId?: string;
    }) => Promise<void>;
    finishedProductItems: InventoryItem[];
    saving: boolean;
}

export function OutputForm({ onSubmit, finishedProductItems, saving }: OutputFormProps) {
    const [outputCategory, setOutputCategory] = useState<MaterialCategory | ''>('');
    const [outputQuantity, setOutputQuantity] = useState('');
    const [outputUnit, setOutputUnit] = useState<'KG' | 'TONS'>('KG');
    const [outputGrade, setOutputGrade] = useState('');
    const [outputInventoryItemId, setOutputInventoryItemId] = useState('');

    const handleSubmit = useCallback(async () => {
        if (!outputCategory || !outputQuantity) return;

        await onSubmit({
            materialCategory: outputCategory as MaterialCategory,
            quantity: parseFloat(outputQuantity),
            unit: outputUnit,
            qualityGrade: outputGrade || undefined,
            inventoryItemId: outputInventoryItemId || undefined,
        });

        // Reset form
        setOutputCategory('');
        setOutputQuantity('');
        setOutputGrade('');
        setOutputInventoryItemId('');
    }, [outputCategory, outputQuantity, outputUnit, outputGrade, outputInventoryItemId, onSubmit]);

    return (
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
                onClick={handleSubmit}
                disabled={saving || !outputCategory || !outputQuantity}
                className="btn-primary"
            >
                Record Output
            </button>
        </div>
    );
}
