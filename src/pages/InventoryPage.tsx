import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getInventoryItems,
    getLowStockItems,
    INVENTORY_CATEGORIES,
} from '../services/inventoryService';
import type { InventoryItem, InventoryCategory } from '../types';

export function InventoryPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'low-stock' | InventoryCategory>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [lowStockCount, setLowStockCount] = useState(0);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedItems = await getInventoryItems();
            setItems(fetchedItems);

            // Get low stock count
            const lowStock = await getLowStockItems();
            setLowStockCount(lowStock.length);
        } catch (err: any) {
            setError(err.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => {
        // Category/status filter
        if (filter === 'low-stock' && item.currentStock > item.minimumStock) return false;
        if (filter !== 'all' && filter !== 'low-stock' && item.category !== filter) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                item.name?.toLowerCase().includes(query) ||
                item.code?.toLowerCase().includes(query) ||
                item.location?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const getCategoryLabel = (category: InventoryCategory) => {
        return INVENTORY_CATEGORIES.find(c => c.value === category)?.label || category;
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.currentStock <= 0) {
            return { label: 'Out of Stock', color: 'red', bg: 'bg-red-500/20 text-red-400' };
        }
        if (item.currentStock <= item.minimumStock) {
            return { label: 'Low Stock', color: 'yellow', bg: 'bg-yellow-500/20 text-yellow-400' };
        }
        if (item.maximumStock && item.currentStock >= item.maximumStock) {
            return { label: 'Overstocked', color: 'blue', bg: 'bg-blue-500/20 text-blue-400' };
        }
        return { label: 'In Stock', color: 'green', bg: 'bg-green-500/20 text-green-400' };
    };

    const getCategoryIcon = (category: InventoryCategory) => {
        switch (category) {
            case 'RAW_MATERIAL':
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                );
            case 'FINISHED_PRODUCT':
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                );
            case 'SPARE_PART':
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                );
        }
    };

    const getCategoryColor = (category: InventoryCategory) => {
        switch (category) {
            case 'RAW_MATERIAL': return 'bg-purple-500/20 text-purple-400';
            case 'FINISHED_PRODUCT': return 'bg-green-500/20 text-green-400';
            case 'SPARE_PART': return 'bg-orange-500/20 text-orange-400';
            default: return 'bg-blue-500/20 text-blue-400';
        }
    };

    // Summary stats
    const totalItems = items.length;
    const rawMaterialItems = items.filter(i => i.category === 'RAW_MATERIAL');
    const finishedProductItems = items.filter(i => i.category === 'FINISHED_PRODUCT');

    // Calculate total stock quantities
    const totalRawMaterialStock = rawMaterialItems.reduce((sum, item) => {
        // Convert to KG for consistency
        let qty = item.currentStock || 0;
        if (item.unit === 'TONS') qty *= 1000;
        return sum + qty;
    }, 0);

    const totalFinishedGoodsStock = finishedProductItems.reduce((sum, item) => {
        // Convert to KG for consistency
        let qty = item.currentStock || 0;
        if (item.unit === 'TONS') qty *= 1000;
        if (item.unit === 'KL') qty *= 1000; // Approximate
        return sum + qty;
    }, 0);

    const rawMaterials = rawMaterialItems.length;
    const finishedProducts = finishedProductItems.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">Inventory</h1>
                            <p className="text-sm text-slate-400">{totalItems} items tracked</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/inventory/new')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Add Item</span>
                    </button>
                </div>
            </header>

            <main className="p-4">
                {/* Stock Overview Cards - Large */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Raw Materials Card */}
                    <div className="glass-card p-6 border border-cyan-500/30">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                                    <span className="text-3xl">📥</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Raw Materials</h3>
                                    <p className="text-cyan-400 text-sm">From Weighbridge</p>
                                </div>
                            </div>
                            <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded">🚚 Weighbridge</span>
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">
                            {totalRawMaterialStock >= 1000
                                ? `${(totalRawMaterialStock / 1000).toFixed(2)} TONS`
                                : `${totalRawMaterialStock.toFixed(0)} KG`}
                        </div>
                        <p className="text-slate-400 text-sm mb-4">Available stock from {rawMaterials} items</p>
                        <div className="grid grid-cols-2 gap-3">
                            {rawMaterialItems.slice(0, 4).map(item => (
                                <div key={item.id} className="bg-slate-700/30 p-3 rounded-lg cursor-pointer hover:bg-slate-700/50"
                                    onClick={() => navigate(`/inventory/${item.id}`)}>
                                    <p className="text-white font-medium truncate">{item.name}</p>
                                    <p className="text-cyan-400 text-lg font-bold">{item.currentStock} {item.unit}</p>
                                </div>
                            ))}
                        </div>
                        {rawMaterialItems.length === 0 && (
                            <p className="text-slate-500 text-center py-4">No raw materials added yet</p>
                        )}
                    </div>

                    {/* Finished Goods Card */}
                    <div className="glass-card p-6 border border-orange-500/30">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                                    <span className="text-3xl">📤</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Finished Goods</h3>
                                    <p className="text-orange-400 text-sm">From Reactor</p>
                                </div>
                            </div>
                            <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded">⚙️ Reactor</span>
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">
                            {totalFinishedGoodsStock >= 1000
                                ? `${(totalFinishedGoodsStock / 1000).toFixed(2)} TONS`
                                : `${totalFinishedGoodsStock.toFixed(0)} KG`}
                        </div>
                        <p className="text-slate-400 text-sm mb-4">Available stock from {finishedProducts} items</p>
                        <div className="grid grid-cols-2 gap-3">
                            {finishedProductItems.slice(0, 4).map(item => (
                                <div key={item.id} className="bg-slate-700/30 p-3 rounded-lg cursor-pointer hover:bg-slate-700/50"
                                    onClick={() => navigate(`/inventory/${item.id}`)}>
                                    <p className="text-white font-medium truncate">{item.name}</p>
                                    <p className="text-orange-400 text-lg font-bold">{item.currentStock} {item.unit}</p>
                                </div>
                            ))}
                        </div>
                        {finishedProductItems.length === 0 && (
                            <p className="text-slate-500 text-center py-4">No finished goods added yet</p>
                        )}
                    </div>
                </div>

                {/* Summary Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{totalItems}</p>
                                <p className="text-xs text-slate-400">Total Items</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-4 cursor-pointer hover:bg-slate-700/50" onClick={() => setFilter('RAW_MATERIAL')}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <span className="text-lg">📥</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{rawMaterials}</p>
                                <p className="text-xs text-slate-400">Raw Materials</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-4 cursor-pointer hover:bg-slate-700/50" onClick={() => setFilter('FINISHED_PRODUCT')}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                <span className="text-lg">📤</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{finishedProducts}</p>
                                <p className="text-xs text-slate-400">Finished Goods</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`glass-card p-4 cursor-pointer transition-all ${lowStockCount > 0 ? 'border border-yellow-500/50 hover:bg-yellow-500/10' : ''}`}
                        onClick={() => lowStockCount > 0 && setFilter('low-stock')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{lowStockCount}</p>
                                <p className="text-xs text-slate-400">Low Stock</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by name, code, or location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field w-full"
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('RAW_MATERIAL')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'RAW_MATERIAL' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Raw
                            </button>
                            <button
                                onClick={() => setFilter('FINISHED_PRODUCT')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'FINISHED_PRODUCT' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Products
                            </button>
                            <button
                                onClick={() => setFilter('low-stock')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'low-stock' ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Low Stock
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Items List */}
                {!loading && (
                    <div className="space-y-3">
                        {filteredItems.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h3 className="text-white font-semibold mb-2">No items found</h3>
                                <p className="text-slate-400">
                                    {searchQuery ? 'Try a different search term' : 'Add your first inventory item'}
                                </p>
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const stockStatus = getStockStatus(item);
                                return (
                                    <div
                                        key={item.id}
                                        className="glass-card p-4 hover:bg-slate-700/50 transition-all cursor-pointer"
                                        onClick={() => navigate(`/inventory/${item.id}`)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                {/* Category Icon */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(item.category)}`}>
                                                    {getCategoryIcon(item.category)}
                                                </div>

                                                {/* Item Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-white font-bold">{item.name}</h3>
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(item.category)}`}>
                                                            {getCategoryLabel(item.category)}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-400 text-sm">{item.code}</p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                                                        {item.location && <span>📍 {item.location}</span>}
                                                        <span>Min: {item.minimumStock} {item.unit}</span>
                                                        {item.maximumStock && <span>Max: {item.maximumStock} {item.unit}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stock Level */}
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-white">{item.currentStock}</p>
                                                <p className="text-xs text-slate-400">{item.unit}</p>
                                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${stockStatus.bg}`}>
                                                    {stockStatus.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
