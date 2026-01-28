// Reactor Output Report Page
// Shows all outputs and last batch output

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBatches } from '../services/batchService';
import type { Batch, MaterialCategory } from '../types';

interface OutputSummary {
    category: MaterialCategory;
    totalQuantity: number;
    unit: string;
    count: number;
}

export function ReactorOutputPage() {
    const navigate = useNavigate();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadBatches();
    }, []);

    const loadBatches = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedBatches = await getBatches(100);
            setBatches(fetchedBatches);
        } catch (err: any) {
            setError(err.message || 'Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    // Get last completed batch with outputs
    const getLastBatchWithOutput = (): Batch | null => {
        for (const batch of batches) {
            if (batch.outputs && batch.outputs.length > 0) {
                return batch;
            }
        }
        return null;
    };

    // Calculate total outputs across all batches
    const calculateTotalOutputs = (): OutputSummary[] => {
        const summaryMap = new Map<MaterialCategory, OutputSummary>();

        batches.forEach(batch => {
            if (batch.outputs) {
                batch.outputs.forEach(output => {
                    const existing = summaryMap.get(output.materialCategory);
                    // Convert to KG for consistency
                    const quantityInKg = output.unit === 'TONS' ? output.quantity * 1000 : output.quantity;

                    if (existing) {
                        existing.totalQuantity += quantityInKg;
                        existing.count += 1;
                    } else {
                        summaryMap.set(output.materialCategory, {
                            category: output.materialCategory,
                            totalQuantity: quantityInKg,
                            unit: 'KG',
                            count: 1,
                        });
                    }
                });
            }
        });

        return Array.from(summaryMap.values());
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getCategoryIcon = (category: MaterialCategory): string => {
        switch (category) {
            case 'PYROLYSIS_OIL': return '🛢️';
            case 'CARBON_BLACK': return '⚫';
            case 'SCRAP_STEEL': return '🔩';
            default: return '📦';
        }
    };

    const getCategoryLabel = (category: MaterialCategory): string => {
        switch (category) {
            case 'PYROLYSIS_OIL': return 'Pyrolysis Oil';
            case 'CARBON_BLACK': return 'Carbon Black';
            case 'SCRAP_STEEL': return 'Scrap Steel';
            default: return category;
        }
    };

    const lastBatch = getLastBatchWithOutput();
    const totalOutputs = calculateTotalOutputs();
    const batchesWithOutputs = batches.filter(b => b.outputs && b.outputs.length > 0);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading outputs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reactor Output</h1>
                    <p className="text-slate-400">{batchesWithOutputs.length} batches with output</p>
                </div>
                <button onClick={() => navigate('/reactor')} className="btn-secondary">
                    ← Back to Reactor
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Total Output Summary */}
            <div className="glass-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">📊 Total Output (All Batches)</h2>
                {totalOutputs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {totalOutputs.map(output => (
                            <div key={output.category} className="bg-slate-700/50 p-4 rounded-lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{getCategoryIcon(output.category)}</span>
                                    <span className="text-slate-300">{getCategoryLabel(output.category)}</span>
                                </div>
                                <div className="text-3xl font-bold text-white">
                                    {output.totalQuantity.toLocaleString()}
                                    <span className="text-lg text-slate-400 ml-1">{output.unit}</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">from {output.count} records</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-4">No outputs recorded yet</p>
                )}
            </div>

            {/* Last Batch Output */}
            <div className="glass-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">🕐 Last Batch Output</h2>
                {lastBatch ? (
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                            <div>
                                <span className="text-xl font-bold text-white">{lastBatch.batchNumber}</span>
                                <span className="text-slate-500 ml-3">Reactor {lastBatch.reactorId}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-400">{formatDate(lastBatch.endTime || lastBatch.startTime)}</span>
                                <span className={`ml-3 px-2 py-1 rounded-full text-xs ${lastBatch.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>{lastBatch.status}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {lastBatch.outputs.map((output, idx) => (
                                <div key={idx} className="bg-slate-700/30 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">{getCategoryIcon(output.materialCategory)}</span>
                                        <span className="text-slate-300">{getCategoryLabel(output.materialCategory)}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {output.quantity}
                                        <span className="text-sm text-slate-400 ml-1">{output.unit}</span>
                                    </div>
                                    {output.qualityGrade && (
                                        <p className="text-sm text-slate-500 mt-1">Grade: {output.qualityGrade}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate(`/batch/${lastBatch.id}`)}
                            className="text-blue-400 hover:text-blue-300 mt-4 text-sm"
                        >
                            View batch details →
                        </button>
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-4">No batch with output found</p>
                )}
            </div>

            {/* All Outputs History */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">📋 All Outputs History</h2>
                {batchesWithOutputs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="text-left p-3 text-slate-300 font-medium">Batch</th>
                                    <th className="text-left p-3 text-slate-300 font-medium">Reactor</th>
                                    <th className="text-left p-3 text-slate-300 font-medium">Date</th>
                                    <th className="text-right p-3 text-slate-300 font-medium">Oil (KG)</th>
                                    <th className="text-right p-3 text-slate-300 font-medium">Carbon (KG)</th>
                                    <th className="text-right p-3 text-slate-300 font-medium">Steel (KG)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {batchesWithOutputs.map(batch => {
                                    const getOutput = (cat: MaterialCategory) => {
                                        const output = batch.outputs.find(o => o.materialCategory === cat);
                                        if (!output) return '-';
                                        const qty = output.unit === 'TONS' ? output.quantity * 1000 : output.quantity;
                                        return qty.toLocaleString();
                                    };
                                    return (
                                        <tr
                                            key={batch.id}
                                            className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                                            onClick={() => navigate(`/batch/${batch.id}`)}
                                        >
                                            <td className="p-3 text-white font-mono">{batch.batchNumber}</td>
                                            <td className="p-3 text-slate-300">R{batch.reactorId}</td>
                                            <td className="p-3 text-slate-400">{formatDate(batch.endTime || batch.startTime)}</td>
                                            <td className="p-3 text-right text-yellow-400">{getOutput('PYROLYSIS_OIL')}</td>
                                            <td className="p-3 text-right text-slate-300">{getOutput('CARBON_BLACK')}</td>
                                            <td className="p-3 text-right text-blue-400">{getOutput('SCRAP_STEEL')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-4">No outputs recorded yet</p>
                )}
            </div>
        </div>
    );
}
