import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { hasPermission } from '../../../lib/authorization';
import { useSpareParts } from '../hooks/useSpareParts';
import { useMainCategories, useSubCategories } from '../hooks/useSparePartCategories';
import ManageCategoriesModal from '../components/ManageCategoriesModal';
import { getSparePartsForExport, exportToCSV, printReport } from '../../reports/services/reportService';
import type { SparePart, SparePartCategory } from '../types';
import { PageHeader, LoadingSpinner, ErrorAlert, EmptyState } from '../../../components/ui';

export default function SparePartsPage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<SparePartCategory | 'all'>('all');
    const [subCategoryFilter, setSubCategoryFilter] = useState<string | 'all'>('all');
    const [showManageModal, setShowManageModal] = useState(false);

    const mainCategories = useMainCategories();
    const subcategories = useSubCategories(categoryFilter === 'all' ? null : categoryFilter);

    // React Query hook
    const {
        data: parts = [],
        isLoading,
        error,
        refetch,
    } = useSpareParts({
        category: categoryFilter,
        subCategory: subCategoryFilter,
        searchQuery,
    });

    // Get all parts for summary stats
    const { data: allParts = [] } = useSpareParts({});

    const [isExporting, setIsExporting] = useState(false);

    const canManageCategories = userData?.role ? hasPermission(userData.role, 'spare_parts:manage_categories') : false;

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const data = await getSparePartsForExport();
            exportToCSV(data, 'spare_parts_report');
        } finally {
            setIsExporting(false);
        }
    };

    const handlePrintPDF = async () => {
        setIsExporting(true);
        try {
            const data = await getSparePartsForExport();
            printReport('Spare Parts Report', data);
        } finally {
            setIsExporting(false);
        }
    };

    const getStockStatus = (part: SparePart) => {
        if (part.currentStock === 0) {
            return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-400' };
        }
        if (part.currentStock <= part.minimumStock) {
            return { label: 'Low Stock', color: 'bg-yellow-500/20 text-yellow-400' };
        }
        return { label: 'In Stock', color: 'bg-green-500/20 text-green-400' };
    };

    const lowStockCount = allParts.filter((p) => p.currentStock <= p.minimumStock).length;

    const handleCategoryChange = (value: SparePartCategory | 'all') => {
        setCategoryFilter(value);
        setSubCategoryFilter('all');
    };

    return (
        <div>
            <PageHeader
                title="Spare Parts"
                subtitle={`${allParts.length} parts | ${lowStockCount} low stock`}
                backTo="/dashboard"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            disabled={isExporting}
                            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
                            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                        </button>
                        <button
                            onClick={handlePrintPDF}
                            disabled={isExporting}
                            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                            <span className="hidden sm:inline">Print / PDF</span>
                        </button>
                        {canManageCategories && (
                            <button onClick={() => setShowManageModal(true)} className="btn-secondary">
                                <span className="hidden sm:inline">Manage Categories</span>
                                <span className="sm:hidden">Categories</span>
                            </button>
                        )}
                        <button onClick={() => navigate('/spare-parts/new')} className="btn-primary">
                            + Add Part
                        </button>
                    </div>
                }
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Error */}
                {error && (
                    <ErrorAlert message={error.message || 'Failed to load spare parts'} onDismiss={() => refetch()} />
                )}

                {/* Search and Filters */}
                <div className="glass-card p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field"
                            placeholder="Search by part number, name..."
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => handleCategoryChange(e.target.value as SparePartCategory | 'all')}
                            className="input-field"
                        >
                            <option value="all">All Categories</option>
                            <option value="low-stock">Low Stock</option>
                            {mainCategories.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={subCategoryFilter}
                            onChange={(e) => setSubCategoryFilter(e.target.value)}
                            className="input-field"
                            disabled={categoryFilter === 'all' || subcategories.length === 0}
                        >
                            <option value="all">All Subcategories</option>
                            {subcategories.map((sub) => (
                                <option key={sub.id} value={sub.value}>
                                    {sub.label}
                                </option>
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
                                        <th className="text-left p-4 text-foreground-secondary font-medium">
                                            Part Number
                                        </th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Name</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">
                                            Category
                                        </th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">
                                            Location
                                        </th>
                                        <th className="text-right p-4 text-foreground-secondary font-medium">Stock</th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">
                                            Status
                                        </th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">
                                            Actions
                                        </th>
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
                                                        <span className="text-foreground-faint text-xs block">
                                                            File: {part.fileNumber}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-foreground">{part.name}</span>
                                                    {part.usedFor && (
                                                        <span className="text-foreground-faint text-xs block">
                                                            {part.usedFor}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-foreground-secondary">{part.category}</span>
                                                    {part.subCategory && (
                                                        <span className="text-foreground-faint text-xs block">
                                                            {part.subCategory}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-foreground-muted">
                                                        {part.location || '-'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="text-foreground font-bold">
                                                        {part.currentStock}
                                                    </span>
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
                                description={
                                    searchQuery || categoryFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Add your first spare part'
                                }
                                action={
                                    !searchQuery && categoryFilter === 'all'
                                        ? { label: 'Add Part', onClick: () => navigate('/spare-parts/new') }
                                        : undefined
                                }
                            />
                        )}
                    </div>
                )}
            </main>

            {/* Manage Categories Modal */}
            {showManageModal && <ManageCategoriesModal onClose={() => setShowManageModal(false)} />}
        </div>
    );
}
