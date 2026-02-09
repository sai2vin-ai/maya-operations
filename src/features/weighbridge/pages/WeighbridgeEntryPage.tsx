// Weighbridge Entry Page
// Create new entry or view/complete existing entry

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
    createWeighbridgeEntry,
    getWeighbridgeEntryById,
    recordFirstWeight,
    recordSecondWeightAndComplete,
    cancelWeighbridgeEntry,
} from '../services/weighbridgeService';
import { getInventoryItemsByCategory } from '../../inventory/services/inventoryService';
import { getEntriesByStatus } from '../../gate/services/gateEntryService';
import { getBatches } from '../../reactor/services/batchService';
import type { WeighbridgeEntry, WeighbridgeEntryType } from '../types';
import type { InventoryItem } from '../../inventory/types';
import type { GateEntry } from '../../gate/types';
import { useToast } from '../../../components/ui';
import type { Batch } from '../../reactor/types';

export default function WeighbridgeEntryPage() {
    const { entryId } = useParams<{ entryId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();

    const isNew = !entryId || entryId === 'new';
    const defaultType = (searchParams.get('type') as WeighbridgeEntryType) || 'RM_IN';

    const [entry, setEntry] = useState<WeighbridgeEntry | null>(null);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form fields
    const [entryType, setEntryType] = useState<WeighbridgeEntryType>(defaultType);
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [partyName, setPartyName] = useState('');
    const [inventoryItemId, setInventoryItemId] = useState('');
    const [materialName, setMaterialName] = useState('');
    const [unit, setUnit] = useState<'KG' | 'TONS' | 'KL'>('KG');
    const [notes, setNotes] = useState('');
    const [gateEntryId, setGateEntryId] = useState('');
    const [batchId, setBatchId] = useState('');

    // Weight entry
    const [weight, setWeight] = useState('');
    const [isGross, setIsGross] = useState(true);

    // Inventory items for dropdown
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    // Linked records for dropdowns
    const [pendingGateEntries, setPendingGateEntries] = useState<GateEntry[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);

    const loadEntry = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const fetchedEntry = await getWeighbridgeEntryById(id);
            if (fetchedEntry) {
                setEntry(fetchedEntry);
                setEntryType(fetchedEntry.entryType);
                setVehicleNumber(fetchedEntry.vehicleNumber);
                setDriverName(fetchedEntry.driverName || '');
                setDriverPhone(fetchedEntry.driverPhone || '');
                setPartyName(fetchedEntry.partyName || '');
                setInventoryItemId(fetchedEntry.inventoryItemId || '');
                setMaterialName(fetchedEntry.materialName || '');
                setUnit(fetchedEntry.unit);
                setNotes(fetchedEntry.notes || '');
                setGateEntryId(fetchedEntry.gateEntryId || '');
                setBatchId(fetchedEntry.batchId || '');

                // Determine which weight to enter next
                if (fetchedEntry.grossWeight && !fetchedEntry.tareWeight) {
                    setIsGross(false); // Need tare
                } else if (fetchedEntry.tareWeight && !fetchedEntry.grossWeight) {
                    setIsGross(true); // Need gross
                }
            } else {
                setError('Entry not found');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load entry');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadInventoryItems = useCallback(async () => {
        try {
            const category = entryType === 'RM_IN' ? 'RAW_MATERIAL' : 'FINISHED_PRODUCT';
            const items = await getInventoryItemsByCategory(category);
            setInventoryItems(items);
        } catch (err) {
            console.error('Failed to load inventory items:', err);
        }
    }, [entryType]);

    const loadLinkedRecords = useCallback(async () => {
        try {
            if (entryType === 'RM_IN') {
                const entries = await getEntriesByStatus('PENDING');
                setPendingGateEntries(entries.filter(e => e.entryType === 'IN'));
            } else {
                const allBatches = await getBatches();
                setBatches(allBatches);
            }
        } catch (err) {
            console.error('Failed to load linked records:', err);
        }
    }, [entryType]);

    useEffect(() => {
        if (!isNew && entryId) {
            loadEntry(entryId);
        }
        loadInventoryItems();
        loadLinkedRecords();
    }, [entryId, isNew, loadEntry, loadInventoryItems, loadLinkedRecords]);

    const handleCreate = async () => {
        if (!userData?.id || !vehicleNumber) return;

        try {
            setSaving(true);
            setError(null);

            const id = await createWeighbridgeEntry({
                entryType,
                vehicleNumber,
                driverName: driverName || undefined,
                driverPhone: driverPhone || undefined,
                partyName: partyName || undefined,
                inventoryItemId: inventoryItemId || undefined,
                materialName: materialName || undefined,
                unit,
                notes: notes || undefined,
                gateEntryId: gateEntryId || undefined,
                batchId: batchId || undefined,
            }, userData.id);

            setSuccess('Entry created!');
            toast.success('Weighbridge entry created successfully');
            navigate(`/weighbridge/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create entry');
            toast.error('Failed to create weighbridge entry');
        } finally {
            setSaving(false);
        }
    };

    const handleRecordWeight = async () => {
        if (!entryId || !userData?.id || !weight) return;

        try {
            setSaving(true);
            setError(null);

            const weightValue = parseFloat(weight);

            if (entry?.status === 'PENDING') {
                // First weight
                await recordFirstWeight(entryId, { weight: weightValue, isGross }, userData.id);
                setSuccess('First weight recorded!');
                toast.success('First weight recorded');
            } else if (entry?.status === 'FIRST_WEIGHT') {
                // Second weight - complete entry
                await recordSecondWeightAndComplete(entryId, { weight: weightValue, isGross }, userData.id);
                setSuccess('Entry completed! Inventory updated.');
                toast.success('Entry completed! Inventory updated');
            }

            // Reload entry
            await loadEntry(entryId);
            setWeight('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record weight');
            toast.error('Failed to record weight');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        if (!entryId || !userData?.id) return;
        if (!confirm('Are you sure you want to cancel this entry?')) return;

        try {
            setSaving(true);
            await cancelWeighbridgeEntry(entryId, userData.id);
            toast.success('Entry cancelled');
            navigate('/weighbridge');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel entry');
            toast.error('Failed to cancel entry');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (timestamp: unknown) => {
        if (!timestamp) return '-';
        const ts = timestamp as { toDate?: () => Date };
        const date = ts.toDate ? ts.toDate() : new Date(timestamp as string | number);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-foreground-muted">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/weighbridge')} className="text-foreground-muted hover:text-foreground">
                    ← Back
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {isNew ? (entryType === 'RM_IN' ? '📥 Raw Material IN' : '📤 Finished Goods OUT') : entry?.entryNumber}
                    </h1>
                    {entry && (
                        <p className="text-foreground-muted">{entry.vehicleNumber} • {entry.status}</p>
                    )}
                </div>
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

            {/* New Entry Form */}
            {isNew && (
                <div className="glass-card p-6">
                    <div className="space-y-4">
                        {/* Entry Type */}
                        <div>
                            <label className="block text-sm text-foreground-muted mb-1">Entry Type *</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEntryType('RM_IN')}
                                    className={`flex-1 p-3 rounded-lg border ${entryType === 'RM_IN' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-surface-tertiary border-border-secondary text-foreground-secondary'}`}
                                >
                                    📥 Raw Material IN
                                </button>
                                <button
                                    onClick={() => setEntryType('FG_OUT')}
                                    className={`flex-1 p-3 rounded-lg border ${entryType === 'FG_OUT' ? 'bg-orange-500/20 border-orange-500 text-orange-300' : 'bg-surface-tertiary border-border-secondary text-foreground-secondary'}`}
                                >
                                    📤 Finished Goods OUT
                                </button>
                            </div>
                        </div>

                        {/* Link to Gate Entry (RM_IN) */}
                        {entryType === 'RM_IN' && pendingGateEntries.length > 0 && (
                            <div>
                                <label className="block text-sm text-foreground-muted mb-1">Link to Gate Entry (optional)</label>
                                <select
                                    value={gateEntryId}
                                    onChange={(e) => {
                                        setGateEntryId(e.target.value);
                                        const ge = pendingGateEntries.find(g => g.id === e.target.value);
                                        if (ge) {
                                            setVehicleNumber(ge.vehicleNumber);
                                            setDriverName(ge.driverName || '');
                                            setDriverPhone(ge.driverPhone || '');
                                            setPartyName(ge.supplierName || '');
                                        }
                                    }}
                                    className="input-field w-full"
                                >
                                    <option value="">No linked gate entry</option>
                                    {pendingGateEntries.map(ge => (
                                        <option key={ge.id} value={ge.id}>
                                            {ge.entryNumber} — {ge.vehicleNumber} ({ge.supplierName || 'No supplier'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Link to Batch (FG_OUT) */}
                        {entryType === 'FG_OUT' && batches.length > 0 && (
                            <div>
                                <label className="block text-sm text-foreground-muted mb-1">Link to Production Batch (optional)</label>
                                <select
                                    value={batchId}
                                    onChange={(e) => setBatchId(e.target.value)}
                                    className="input-field w-full"
                                >
                                    <option value="">No linked batch</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.batchNumber} ({b.status})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Vehicle Number */}
                        <div>
                            <label className="block text-sm text-foreground-muted mb-1">Vehicle Number *</label>
                            <input
                                type="text"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                className="input-field w-full"
                                placeholder="e.g., TN01AB1234"
                            />
                        </div>

                        {/* Driver Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-foreground-muted mb-1">Driver Name</label>
                                <input
                                    type="text"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    className="input-field w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-foreground-muted mb-1">Driver Phone</label>
                                <input
                                    type="text"
                                    value={driverPhone}
                                    onChange={(e) => setDriverPhone(e.target.value)}
                                    className="input-field w-full"
                                />
                            </div>
                        </div>

                        {/* Party Name */}
                        <div>
                            <label className="block text-sm text-foreground-muted mb-1">
                                {entryType === 'RM_IN' ? 'Supplier Name' : 'Customer Name'}
                            </label>
                            <input
                                type="text"
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                                className="input-field w-full"
                            />
                        </div>

                        {/* Material Selection */}
                        <div>
                            <label className="block text-sm text-foreground-muted mb-1">Material</label>
                            <select
                                value={inventoryItemId}
                                onChange={(e) => {
                                    setInventoryItemId(e.target.value);
                                    const item = inventoryItems.find(i => i.id === e.target.value);
                                    if (item) setMaterialName(item.name);
                                }}
                                className="input-field w-full"
                            >
                                <option value="">Select material...</option>
                                {inventoryItems.map(item => (
                                    <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Unit */}
                        <div>
                            <label className="block text-sm text-foreground-muted mb-1">Unit</label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value as 'KG' | 'TONS' | 'KL')}
                                className="input-field w-full"
                            >
                                <option value="KG">KG</option>
                                <option value="TONS">TONS</option>
                                <option value="KL">KL (Kiloliter)</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm text-foreground-muted mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="input-field w-full"
                                rows={2}
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={saving || !vehicleNumber}
                            className="btn-primary w-full"
                        >
                            {saving ? 'Creating...' : 'Create Entry'}
                        </button>
                    </div>
                </div>
            )}

            {/* Existing Entry View */}
            {!isNew && entry && (
                <>
                    {/* Entry Details */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Entry Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-foreground-faint">Entry Number:</span> <span className="text-foreground">{entry.entryNumber}</span></div>
                            <div><span className="text-foreground-faint">Type:</span> <span className="text-foreground">{entry.entryType === 'RM_IN' ? 'Raw Material IN' : 'Finished Goods OUT'}</span></div>
                            <div><span className="text-foreground-faint">Vehicle:</span> <span className="text-foreground">{entry.vehicleNumber}</span></div>
                            <div><span className="text-foreground-faint">Driver:</span> <span className="text-foreground">{entry.driverName || '-'}</span></div>
                            <div><span className="text-foreground-faint">{entry.entryType === 'RM_IN' ? 'Supplier' : 'Customer'}:</span> <span className="text-foreground">{entry.partyName || '-'}</span></div>
                            <div><span className="text-foreground-faint">Material:</span> <span className="text-foreground">{entry.materialName || '-'}</span></div>
                        </div>
                        {(entry.gateEntryId || entry.batchId) && (
                            <div className="mt-4 pt-4 border-t border-border-secondary">
                                <h4 className="text-sm font-medium text-foreground-muted mb-2">Linked Records</h4>
                                {entry.gateEntryId && (
                                    <button
                                        onClick={() => navigate(`/gate/${entry.gateEntryId}`)}
                                        className="text-sm text-blue-400 hover:underline"
                                    >
                                        View Gate Entry →
                                    </button>
                                )}
                                {entry.batchId && (
                                    <button
                                        onClick={() => navigate(`/reactor/batch/${entry.batchId}`)}
                                        className="text-sm text-blue-400 hover:underline"
                                    >
                                        View Production Batch →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Weight Info */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Weight Information</h3>
                        <div className="grid grid-cols-3 gap-4 text-center mb-4">
                            <div className="bg-surface-tertiary/50 p-4 rounded-lg">
                                <p className="text-foreground-muted text-sm">Gross Weight</p>
                                <p className="text-2xl font-bold text-foreground">{entry.grossWeight ? `${entry.grossWeight} ${entry.unit}` : '-'}</p>
                                {entry.firstWeightTime && entry.grossWeight && (
                                    <p className="text-xs text-foreground-faint">{formatDate(entry.firstWeightTime)}</p>
                                )}
                            </div>
                            <div className="bg-surface-tertiary/50 p-4 rounded-lg">
                                <p className="text-foreground-muted text-sm">Tare Weight</p>
                                <p className="text-2xl font-bold text-foreground">{entry.tareWeight ? `${entry.tareWeight} ${entry.unit}` : '-'}</p>
                            </div>
                            <div className="bg-surface-tertiary/50 p-4 rounded-lg">
                                <p className="text-foreground-muted text-sm">Net Weight</p>
                                <p className="text-2xl font-bold text-green-400">{entry.netWeight ? `${entry.netWeight} ${entry.unit}` : '-'}</p>
                            </div>
                        </div>

                        {/* Record Weight Form */}
                        {(entry.status === 'PENDING' || entry.status === 'FIRST_WEIGHT') && (
                            <div className="bg-surface-tertiary/30 p-4 rounded-lg mt-4">
                                <h4 className="text-foreground font-medium mb-3">
                                    {entry.status === 'PENDING' ? 'Record First Weight' : 'Record Second Weight'}
                                </h4>
                                <div className="flex gap-4 mb-4">
                                    <button
                                        onClick={() => setIsGross(true)}
                                        className={`flex-1 p-2 rounded-lg ${isGross ? 'bg-blue-500 text-foreground' : 'bg-slate-600 text-foreground-secondary'}`}
                                    >
                                        Gross (Loaded)
                                    </button>
                                    <button
                                        onClick={() => setIsGross(false)}
                                        className={`flex-1 p-2 rounded-lg ${!isGross ? 'bg-blue-500 text-foreground' : 'bg-slate-600 text-foreground-secondary'}`}
                                    >
                                        Tare (Empty)
                                    </button>
                                </div>
                                <div className="flex gap-4">
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="input-field flex-1"
                                        placeholder={`Enter weight in ${entry?.unit || 'KG'}`}
                                    />
                                    <button
                                        onClick={handleRecordWeight}
                                        disabled={saving || !weight}
                                        className="btn-primary"
                                    >
                                        {saving ? 'Saving...' : 'Record'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Completed */}
                        {entry.status === 'COMPLETED' && (
                            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mt-4 text-center">
                                <p className="text-green-400 font-medium">✅ Entry Completed</p>
                                <p className="text-sm text-foreground-muted">Inventory has been updated</p>
                            </div>
                        )}
                    </div>

                    {/* Cancel Button */}
                    {entry.status !== 'COMPLETED' && entry.status !== 'CANCELLED' && (
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="btn-secondary w-full text-red-400 border-red-500 hover:bg-red-500/20"
                        >
                            Cancel Entry
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
