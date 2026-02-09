import { useState } from 'react';
import { useSpareParts } from '../../spare-parts/hooks/useSpareParts';
import { SPARE_PART_CATEGORIES } from '../../spare-parts/services/sparePartsService';
import type { SparePartCategory } from '../../spare-parts/types';

interface PartSelection {
    partId: string;
    quantity: number;
}

interface SparePartsPickerProps {
    onIssueParts: (parts: PartSelection[]) => void;
    onClose: () => void;
    isPending: boolean;
}

export default function SparePartsPicker({ onIssueParts, onClose, isPending }: SparePartsPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | SparePartCategory>('all');
    const [selections, setSelections] = useState<Map<string, number>>(new Map());

    const { data: parts = [], isLoading } = useSpareParts({
        category: categoryFilter,
        searchQuery: searchQuery || undefined,
    });

    const togglePart = (partId: string) => {
        setSelections(prev => {
            const next = new Map(prev);
            if (next.has(partId)) {
                next.delete(partId);
            } else {
                next.set(partId, 1);
            }
            return next;
        });
    };

    const setQuantity = (partId: string, qty: number) => {
        setSelections(prev => {
            const next = new Map(prev);
            if (qty <= 0) {
                next.delete(partId);
            } else {
                next.set(partId, qty);
            }
            return next;
        });
    };

    const handleSubmit = () => {
        const selected: PartSelection[] = [];
        for (const [partId, quantity] of selections) {
            if (quantity > 0) {
                selected.push({ partId, quantity });
            }
        }
        if (selected.length === 0) return;
        onIssueParts(selected);
    };

    const selectedCount = selections.size;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass-card w-full max-w-3xl max-h-[80vh] flex flex-col m-4">
                {/* Header */}
                <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-foreground">Issue Spare Parts</h2>
                        <button onClick={onClose} className="text-foreground-muted hover:text-foreground text-xl">&times;</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field"
                            placeholder="Search parts..."
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as 'all' | SparePartCategory)}
                            className="input-field"
                        >
                            <option value="all">All Categories</option>
                            {SPARE_PART_CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Parts List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <p className="text-center text-foreground-muted py-8">Loading parts...</p>
                    ) : parts.length === 0 ? (
                        <p className="text-center text-foreground-muted py-8">No parts found</p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-surface-tertiary/50 sticky top-0">
                                <tr>
                                    <th className="w-10 p-3"></th>
                                    <th className="text-left p-3 text-foreground-secondary font-medium text-sm">Part #</th>
                                    <th className="text-left p-3 text-foreground-secondary font-medium text-sm">Name</th>
                                    <th className="text-center p-3 text-foreground-secondary font-medium text-sm">Stock</th>
                                    <th className="text-center p-3 text-foreground-secondary font-medium text-sm">Unit</th>
                                    <th className="text-center p-3 text-foreground-secondary font-medium text-sm">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {parts.map((part) => {
                                    const isSelected = selections.has(part.id);
                                    const qty = selections.get(part.id) || 0;
                                    const outOfStock = part.currentStock <= 0;
                                    const lowStock = part.currentStock <= part.minimumStock && part.currentStock > 0;
                                    const exceedsStock = qty > part.currentStock;

                                    return (
                                        <tr key={part.id} className={`${isSelected ? 'bg-blue-500/10' : ''} ${outOfStock ? 'opacity-50' : ''}`}>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => !outOfStock && togglePart(part.id)}
                                                    disabled={outOfStock}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td className="p-3 font-mono text-sm text-foreground">{part.partNumber}</td>
                                            <td className="p-3 text-foreground-secondary text-sm">{part.name}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                    outOfStock ? 'bg-red-500/20 text-red-400' :
                                                    lowStock ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-green-500/20 text-green-400'
                                                }`}>
                                                    {part.currentStock}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-foreground-muted text-sm">{part.unit}</td>
                                            <td className="p-3 text-center">
                                                {isSelected && (
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={part.currentStock}
                                                        value={qty}
                                                        onChange={(e) => setQuantity(part.id, parseInt(e.target.value) || 0)}
                                                        className={`input-field w-20 text-center text-sm ${exceedsStock ? 'border-red-500' : ''}`}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                    <p className="text-sm text-foreground-muted">
                        {selectedCount} part{selectedCount !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="btn-secondary">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedCount === 0 || isPending}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isPending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            Issue Selected Parts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
