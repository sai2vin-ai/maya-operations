// Spare Part Detail Page
// Shows spare part details, transaction history, and issue/receipt forms

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    getSparePartById,
    getSparePartTransactions,
    updateSparePart,
    receiptSparePart,
    issueSparePart,
    SPARE_PART_CATEGORIES,
    SPARE_PART_UNITS,
} from '../services/sparePartsService';
import type { SparePart, SparePartTransaction, SparePartCategory } from '../types';

export default function SparePartDetailPage() {
    const { partId } = useParams<{ partId: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();

    const [part, setPart] = useState<SparePart | null>(null);
    const [transactions, setTransactions] = useState<SparePartTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState<SparePartCategory>('GENERAL');
    const [editFileNumber, setEditFileNumber] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editUsedFor, setEditUsedFor] = useState('');
    const [editMinStock, setEditMinStock] = useState('');
    const [editUnit, setEditUnit] = useState('');
    const [editUnitPrice, setEditUnitPrice] = useState('');

    // Transaction forms
    const [showReceiptForm, setShowReceiptForm] = useState(false);
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [txnQuantity, setTxnQuantity] = useState('');
    const [txnReason, setTxnReason] = useState('');
    const [txnMachineId, setTxnMachineId] = useState('');
    const [txnMachineName, setTxnMachineName] = useState('');
    const [txnIssuedTo, setTxnIssuedTo] = useState('');

    useEffect(() => {
        if (partId) {
            loadPart(partId);
        }
    }, [partId]);

    const loadPart = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const [fetchedPart, fetchedTransactions] = await Promise.all([
                getSparePartById(id),
                getSparePartTransactions(id),
            ]);
            if (fetchedPart) {
                setPart(fetchedPart);
                setEditName(fetchedPart.name);
                setEditCategory(fetchedPart.category);
                setEditFileNumber(fetchedPart.fileNumber || '');
                setEditLocation(fetchedPart.location || '');
                setEditUsedFor(fetchedPart.usedFor || '');
                setEditMinStock(String(fetchedPart.minimumStock));
                setEditUnit(fetchedPart.unit);
                setEditUnitPrice(fetchedPart.unitPrice ? String(fetchedPart.unitPrice) : '');
            } else {
                setError('Spare part not found');
            }
            setTransactions(fetchedTransactions);
        } catch (err: any) {
            setError(err.message || 'Failed to load spare part');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!partId || !userData?.id) return;

        try {
            setSaving(true);
            setError(null);

            await updateSparePart(partId, {
                name: editName,
                category: editCategory,
                fileNumber: editFileNumber || undefined,
                location: editLocation || undefined,
                usedFor: editUsedFor || undefined,
                minimumStock: parseInt(editMinStock),
                unit: editUnit,
                unitPrice: editUnitPrice ? parseFloat(editUnitPrice) : undefined,
            }, userData.id);

            setSuccess('Spare part updated!');
            setEditing(false);
            await loadPart(partId);
        } catch (err: any) {
            setError(err.message || 'Failed to update spare part');
        } finally {
            setSaving(false);
        }
    };

    const handleReceipt = async () => {
        if (!partId || !userData?.id || !txnQuantity) return;

        try {
            setSaving(true);
            setError(null);

            await receiptSparePart(
                partId,
                parseInt(txnQuantity),
                txnReason || 'Stock receipt',
                userData.id
            );

            setSuccess('Stock received!');
            setShowReceiptForm(false);
            setTxnQuantity('');
            setTxnReason('');
            await loadPart(partId);
        } catch (err: any) {
            setError(err.message || 'Failed to record receipt');
        } finally {
            setSaving(false);
        }
    };

    const handleIssue = async () => {
        if (!partId || !userData?.id || !txnQuantity) return;

        try {
            setSaving(true);
            setError(null);

            await issueSparePart(
                partId,
                parseInt(txnQuantity),
                txnMachineId || undefined,
                txnMachineName || undefined,
                txnReason || 'Stock issue',
                txnIssuedTo || userData.name || userData.id,
                userData.id
            );

            setSuccess('Stock issued!');
            setShowIssueForm(false);
            setTxnQuantity('');
            setTxnReason('');
            setTxnMachineId('');
            setTxnMachineName('');
            setTxnIssuedTo('');
            await loadPart(partId);
        } catch (err: any) {
            setError(err.message || 'Failed to record issue');
        } finally {
            setSaving(false);
        }
    };

    const getStockStatus = () => {
        if (!part) return null;
        if (part.currentStock === 0) {
            return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-400 border-red-500' };
        }
        if (part.currentStock <= part.minimumStock) {
            return { label: 'Low Stock', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500' };
        }
        return { label: 'In Stock', color: 'bg-green-500/20 text-green-400 border-green-500' };
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading spare part...</p>
                </div>
            </div>
        );
    }

    if (!part) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-400">Spare part not found</p>
                <button onClick={() => navigate('/spare-parts')} className="text-blue-400 mt-2">
                    Back to Spare Parts
                </button>
            </div>
        );
    }

    const stockStatus = getStockStatus();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/spare-parts')} className="text-slate-400 hover:text-white">
                    ← Back
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{part.partNumber}</h1>
                    <p className="text-slate-400">{part.name}</p>
                </div>
                {stockStatus && (
                    <span className={`px-3 py-1 rounded-full border ${stockStatus.color}`}>
                        {stockStatus.label}
                    </span>
                )}
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-4">
                    <p className="text-green-400">{success}</p>
                </div>
            )}

            {/* Stock Actions */}
            <div className="glass-card p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-4xl font-bold text-white">{part.currentStock}</span>
                        <span className="text-xl text-slate-400 ml-2">{part.unit}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setShowReceiptForm(true); setShowIssueForm(false); }}
                            className="btn-secondary"
                        >
                            + Receipt
                        </button>
                        <button
                            onClick={() => { setShowIssueForm(true); setShowReceiptForm(false); }}
                            className="btn-primary"
                            disabled={part.currentStock === 0}
                        >
                            - Issue
                        </button>
                    </div>
                </div>

                {/* Receipt Form */}
                {showReceiptForm && (
                    <div className="bg-slate-700/50 p-4 rounded-lg mt-4">
                        <h4 className="text-white font-medium mb-3">Receive Stock</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input
                                type="number"
                                value={txnQuantity}
                                onChange={(e) => setTxnQuantity(e.target.value)}
                                className="input-field"
                                placeholder="Quantity"
                                min="1"
                            />
                            <input
                                type="text"
                                value={txnReason}
                                onChange={(e) => setTxnReason(e.target.value)}
                                className="input-field"
                                placeholder="Reason (optional)"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleReceipt} disabled={saving || !txnQuantity} className="btn-primary">
                                Confirm Receipt
                            </button>
                            <button onClick={() => setShowReceiptForm(false)} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Issue Form */}
                {showIssueForm && (
                    <div className="bg-slate-700/50 p-4 rounded-lg mt-4">
                        <h4 className="text-white font-medium mb-3">Issue Stock</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input
                                type="number"
                                value={txnQuantity}
                                onChange={(e) => setTxnQuantity(e.target.value)}
                                className="input-field"
                                placeholder="Quantity"
                                min="1"
                                max={part.currentStock}
                            />
                            <input
                                type="text"
                                value={txnIssuedTo}
                                onChange={(e) => setTxnIssuedTo(e.target.value)}
                                className="input-field"
                                placeholder="Issued to (person)"
                            />
                            <input
                                type="text"
                                value={txnMachineName}
                                onChange={(e) => setTxnMachineName(e.target.value)}
                                className="input-field"
                                placeholder="Machine name (optional)"
                            />
                            <input
                                type="text"
                                value={txnReason}
                                onChange={(e) => setTxnReason(e.target.value)}
                                className="input-field"
                                placeholder="Reason"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleIssue} disabled={saving || !txnQuantity} className="btn-primary">
                                Confirm Issue
                            </button>
                            <button onClick={() => setShowIssueForm(false)} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Part Details */}
            <div className="glass-card p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Part Details</h3>
                    <button onClick={() => setEditing(!editing)} className="text-blue-400 hover:text-blue-300">
                        {editing ? 'Cancel' : 'Edit'}
                    </button>
                </div>

                {!editing ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-slate-500">Part Number:</span> <span className="text-white">{part.partNumber}</span></div>
                        <div><span className="text-slate-500">File Number:</span> <span className="text-white">{part.fileNumber || '-'}</span></div>
                        <div><span className="text-slate-500">Category:</span> <span className="text-white">{part.category}</span></div>
                        <div><span className="text-slate-500">Unit:</span> <span className="text-white">{part.unit}</span></div>
                        <div><span className="text-slate-500">Min Stock:</span> <span className="text-white">{part.minimumStock}</span></div>
                        <div><span className="text-slate-500">Unit Price:</span> <span className="text-white">{part.unitPrice ? `₹${part.unitPrice}` : '-'}</span></div>
                        <div><span className="text-slate-500">Location:</span> <span className="text-white">{part.location || '-'}</span></div>
                        <div><span className="text-slate-500">Used For:</span> <span className="text-white">{part.usedFor || '-'}</span></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Name</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field w-full" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">File Number</label>
                                <input type="text" value={editFileNumber} onChange={(e) => setEditFileNumber(e.target.value)} className="input-field w-full" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Category</label>
                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as SparePartCategory)} className="input-field w-full">
                                    {SPARE_PART_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Unit</label>
                                <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="input-field w-full">
                                    {SPARE_PART_UNITS.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Min Stock</label>
                                <input type="number" value={editMinStock} onChange={(e) => setEditMinStock(e.target.value)} className="input-field w-full" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Unit Price (₹)</label>
                                <input type="number" value={editUnitPrice} onChange={(e) => setEditUnitPrice(e.target.value)} className="input-field w-full" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Location</label>
                                <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="input-field w-full" placeholder="e.g., Rack A-1" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Used For</label>
                                <input type="text" value={editUsedFor} onChange={(e) => setEditUsedFor(e.target.value)} className="input-field w-full" placeholder="e.g., Reactor 1" />
                            </div>
                        </div>
                        <button onClick={handleSaveEdit} disabled={saving} className="btn-primary">
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            {/* Transaction History */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
                {transactions.length > 0 ? (
                    <div className="space-y-2">
                        {transactions.map((txn) => (
                            <div key={txn.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg font-bold ${txn.type === 'RECEIPT' ? 'text-green-400' : 'text-red-400'}`}>
                                        {txn.type === 'RECEIPT' ? '+' : '-'}{txn.quantity}
                                    </span>
                                    <div>
                                        <span className="text-white">{txn.type === 'RECEIPT' ? 'Received' : 'Issued'}</span>
                                        {txn.machineName && <span className="text-slate-400 text-sm ml-2">→ {txn.machineName}</span>}
                                        {txn.issuedTo && <span className="text-slate-500 text-xs block">To: {txn.issuedTo}</span>}
                                        {txn.reason && <span className="text-slate-500 text-xs block">{txn.reason}</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-400 text-sm">{formatDate(txn.createdAt)}</span>
                                    <span className="text-slate-500 text-xs block">Balance: {txn.balanceAfter}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-4">No transactions yet</p>
                )}
            </div>
        </div>
    );
}
