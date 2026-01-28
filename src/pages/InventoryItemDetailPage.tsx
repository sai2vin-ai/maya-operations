import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    getInventoryItemById,
    getItemTransactions,
    updateInventoryItem,
    recordTransaction,
    INVENTORY_CATEGORIES,
    TRANSACTION_TYPES,
} from '../services/inventoryService';
import { useAuth } from '../contexts/AuthContext';
import type { InventoryItem, InventoryTransaction, InventoryCategory, TransactionType } from '../types';

export function InventoryItemDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();

    const [item, setItem] = useState<InventoryItem | null>(null);
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Transaction modal state
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [transactionType, setTransactionType] = useState<TransactionType>('RECEIPT');
    const [transactionQty, setTransactionQty] = useState<number>(0);
    const [transactionReason, setTransactionReason] = useState('');
    const [transactionLoading, setTransactionLoading] = useState(false);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editMinStock, setEditMinStock] = useState(0);
    const [editMaxStock, setEditMaxStock] = useState<number | ''>('');
    const [editLocation, setEditLocation] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadItemData();
        }
    }, [id]);

    const loadItemData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);

            const [fetchedItem, fetchedTransactions] = await Promise.all([
                getInventoryItemById(id),
                getItemTransactions(id),
            ]);

            if (!fetchedItem) {
                setError('Item not found');
                return;
            }

            setItem(fetchedItem);
            setTransactions(fetchedTransactions);

            // Initialize edit form
            setEditName(fetchedItem.name);
            setEditMinStock(fetchedItem.minimumStock);
            setEditMaxStock(fetchedItem.maximumStock || '');
            setEditLocation(fetchedItem.location || '');
        } catch (err: any) {
            setError(err.message || 'Failed to load item');
        } finally {
            setLoading(false);
        }
    };

    const handleRecordTransaction = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData?.id || !id) return;

        if (transactionQty <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }

        try {
            setTransactionLoading(true);

            await recordTransaction({
                itemId: id,
                transactionType,
                quantity: transactionQty,
                reason: transactionReason || undefined,
            }, userData.id);

            setShowTransactionModal(false);
            setTransactionQty(0);
            setTransactionReason('');
            await loadItemData();
        } catch (err: any) {
            alert(err.message || 'Failed to record transaction');
        } finally {
            setTransactionLoading(false);
        }
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData?.id || !id) return;

        try {
            setEditLoading(true);

            await updateInventoryItem(id, {
                name: editName,
                minimumStock: editMinStock,
                maximumStock: editMaxStock || undefined,
                location: editLocation || undefined,
            }, userData.id);

            setShowEditModal(false);
            await loadItemData();
        } catch (err: any) {
            alert(err.message || 'Failed to update item');
        } finally {
            setEditLoading(false);
        }
    };

    const getCategoryLabel = (category: InventoryCategory) => {
        return INVENTORY_CATEGORIES.find(c => c.value === category)?.label || category;
    };

    const getTransactionInfo = (type: TransactionType) => {
        return TRANSACTION_TYPES.find(t => t.value === type) || { label: type, color: 'gray' };
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.currentStock <= 0) {
            return { label: 'Out of Stock', bg: 'bg-red-500/20 text-red-400' };
        }
        if (item.currentStock <= item.minimumStock) {
            return { label: 'Low Stock', bg: 'bg-yellow-500/20 text-yellow-400' };
        }
        return { label: 'In Stock', bg: 'bg-green-500/20 text-green-400' };
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="glass-card p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                    <p className="text-slate-400 mb-4">{error || 'Item not found'}</p>
                    <button onClick={() => navigate('/inventory')} className="btn-primary">
                        Back to Inventory
                    </button>
                </div>
            </div>
        );
    }

    const stockStatus = getStockStatus(item);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/inventory')}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">{item.name}</h1>
                            <p className="text-sm text-slate-400">{item.code}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowEditModal(true)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-4">
                {/* Stock Overview */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Current Stock</p>
                            <p className="text-4xl font-bold text-white">{item.currentStock} <span className="text-lg text-slate-400">{item.unit}</span></p>
                            <span className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full ${stockStatus.bg}`}>
                                {stockStatus.label}
                            </span>
                        </div>

                        <button
                            onClick={() => setShowTransactionModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Record Transaction
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Category</p>
                            <p className="text-white font-medium">{getCategoryLabel(item.category)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Min Stock</p>
                            <p className="text-white font-medium">{item.minimumStock} {item.unit}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Max Stock</p>
                            <p className="text-white font-medium">{item.maximumStock ? `${item.maximumStock} ${item.unit}` : '-'}</p>
                        </div>
                        {item.location && (
                            <div className="col-span-3">
                                <p className="text-xs text-slate-500 mb-1">Location</p>
                                <p className="text-white font-medium">📍 {item.location}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>

                    {transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-slate-400">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((txn) => {
                                const txnInfo = getTransactionInfo(txn.transactionType);
                                const isPositive = txn.transactionType === 'RECEIPT' || (txn.transactionType === 'ADJUSTMENT' && txn.quantity > 0);
                                return (
                                    <div key={txn.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txnInfo.color === 'green' ? 'bg-green-500/20 text-green-400' :
                                                txnInfo.color === 'red' ? 'bg-red-500/20 text-red-400' :
                                                    txnInfo.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {isPositive ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{txnInfo.label}</p>
                                                <p className="text-xs text-slate-400">{formatTime(txn.createdAt)}</p>
                                                {txn.reason && <p className="text-xs text-slate-500 mt-1">{txn.reason}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPositive ? '+' : '-'}{Math.abs(txn.quantity)} {item.unit}
                                            </p>
                                            <p className="text-xs text-slate-500">Bal: {txn.balanceAfter}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Transaction Modal */}
            {showTransactionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="glass-card p-6 max-w-md w-full">
                        <h2 className="text-lg font-bold text-white mb-4">Record Transaction</h2>

                        <form onSubmit={handleRecordTransaction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['RECEIPT', 'ISSUE', 'ADJUSTMENT'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setTransactionType(type as TransactionType)}
                                            className={`py-2 px-3 rounded-lg font-medium transition-all ${transactionType === type
                                                ? type === 'RECEIPT' ? 'bg-green-600 text-white' :
                                                    type === 'ISSUE' ? 'bg-red-600 text-white' :
                                                        'bg-yellow-600 text-white'
                                                : 'bg-slate-700 text-slate-300'
                                                }`}
                                        >
                                            {type.charAt(0) + type.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity ({item.unit})</label>
                                <input
                                    type="number"
                                    value={transactionQty}
                                    onChange={(e) => setTransactionQty(parseFloat(e.target.value) || 0)}
                                    min="0.01"
                                    step="0.01"
                                    className="input-field w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Reason (optional)</label>
                                <input
                                    type="text"
                                    value={transactionReason}
                                    onChange={(e) => setTransactionReason(e.target.value)}
                                    placeholder="e.g., Stock adjustment, Manual count"
                                    className="input-field w-full"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTransactionModal(false)}
                                    className="flex-1 py-2 px-4 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={transactionLoading}
                                    className="flex-1 btn-primary py-2 disabled:opacity-50"
                                >
                                    {transactionLoading ? 'Saving...' : 'Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="glass-card p-6 max-w-md w-full">
                        <h2 className="text-lg font-bold text-white mb-4">Edit Item</h2>

                        <form onSubmit={handleUpdateItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="input-field w-full"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Min Stock</label>
                                    <input
                                        type="number"
                                        value={editMinStock}
                                        onChange={(e) => setEditMinStock(parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.01"
                                        className="input-field w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Stock</label>
                                    <input
                                        type="number"
                                        value={editMaxStock}
                                        onChange={(e) => setEditMaxStock(e.target.value ? parseFloat(e.target.value) : '')}
                                        min="0"
                                        step="0.01"
                                        className="input-field w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    placeholder="e.g., Warehouse A"
                                    className="input-field w-full"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-2 px-4 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="flex-1 btn-primary py-2 disabled:opacity-50"
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
