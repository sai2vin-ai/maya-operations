import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpareParts } from '../hooks/useSpareParts';
import { SPARE_PART_CATEGORIES } from '../services/sparePartsService';
import type { SparePart, SparePartCategory } from '../types';
import {
    PageHeader,
    LoadingSpinner,
    ErrorAlert,
    EmptyState,
} from '../../../components/ui';

export default function SparePartsPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<SparePartCategory | 'all'>('all');

    // React Query hook
    const { data: parts = [], isLoading, error, refetch } = useSpareParts({
        category: categoryFilter,
        searchQuery
    });

    // Get all parts for summary stats
    const { data: allParts = [] } = useSpareParts({});

    const getStockStatus = (part: SparePart) => {
        if (part.currentStock === 0) {
            return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-400' };
        }
        if (part.currentStock <= part.minimumStock) {
            return { label: 'Low Stock', color: 'bg-yellow-500/20 text-yellow-400' };
        }
        return { label: 'In Stock', color: 'bg-green-500/20 text-green-400' };
    };

    const lowStockCount = allParts.filter(p => p.currentStock <= p.minimumStock).length;

    return (
        <div>
            <PageHeader
                title="Spare Parts"
                subtitle={`${allParts.length} parts | ${lowStockCount} low stock`}
                backTo="/dashboard"
                actions={
                    <button
                        onClick={() => navigate('/spare-parts/new')}
                        className="btn-primary"
                    >
                        + Add Part
                    </button>
                }
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Error */}
                {error && (
                    <ErrorAlert
                        message={error.message || 'Failed to load spare parts'}
                        onDismiss={() => refetch()}
                    />
                )}

                {/* Search and Filter */}
                <div className="glass-card p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field"
                            placeholder="Search by part number, name, or file number..."
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as SparePartCategory | 'all')}
                            className="input-field"
                        >
                            <option value="all">All Categories</option>
                            {SPARE_PART_CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && <LoadingSpinner />}

                {/* Parts Table */}
                {!isLoading && (
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-tertiary/50">
                                    <tr>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Part Number</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Name</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Category</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Location</th>
                                        <th className="text-right p-4 text-foreground-secondary font-medium">Stock</th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">Status</th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {parts.map((part) => {
                                        const status = getStockStatus(part);
                                        return (
                                            <tr
                                                key={part.id}
                                                className="hover:bg-surface-tertiary/30 cursor-pointer transition-colors"
                                                onClick={() => navigate(`/spare-parts/${part.id}`)}
                                            >
                                                <td className="p-4">
                                                    <span className="text-foreground font-mono">{part.partNumber}</span>
                                                    {part.fileNumber && (
                                                        <span className="text-foreground-faint text-xs block">File: {part.fileNumber}</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-foreground">{part.name}</span>
                                                    {part.usedFor && (
                                                        <span className="text-foreground-faint text-xs block">{part.usedFor}</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-foreground-secondary">{part.category}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-foreground-muted">{part.location || '-'}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="text-foreground font-bold">{part.currentStock}</span>
                                                    <span className="text-foreground-faint ml-1">{part.unit}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/spare-parts/${part.id}`);
                                                        }}
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {parts.length === 0 && (
                            <EmptyState
                                title="No spare parts found"
                                description={searchQuery || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first spare part'}
                                action={!searchQuery && categoryFilter === 'all' ? { label: 'Add Part', onClick: () => navigate('/spare-parts/new') } : undefined}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
