import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast, PageHeader, LoadingSpinner } from '../../../components/ui';
import { useShifts, useActiveShift, useStartShift, useEndShift, useAcknowledgeHandover } from '../hooks/useShifts';
import { SHIFT_TYPES } from '../services/shiftService';
import type { ShiftType } from '../../../types';

export default function ShiftsPage() {
    const { userData } = useAuth();
    const toast = useToast();

    const { data: shifts = [], isLoading } = useShifts();
    const { data: activeShift } = useActiveShift();
    const startShift = useStartShift();
    const endShift = useEndShift();
    const acknowledgeHandover = useAcknowledgeHandover();

    const [showStart, setShowStart] = useState(false);
    const [showEnd, setShowEnd] = useState(false);
    const [shiftType, setShiftType] = useState<ShiftType>('A');
    const [handoverNotes, setHandoverNotes] = useState('');

    const handleStartShift = async () => {
        if (!userData?.id) return;
        try {
            await startShift.mutateAsync({
                data: { shiftType, supervisorId: userData.id },
                createdBy: userData.id,
            });
            toast.success('Shift started successfully');
            setShowStart(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to start shift');
        }
    };

    const handleEndShift = async () => {
        if (!activeShift?.id || !userData?.id) return;
        try {
            await endShift.mutateAsync({
                shiftId: activeShift.id,
                data: { handoverNotes },
                updatedBy: userData.id,
            });
            toast.success('Shift ended successfully');
            setShowEnd(false);
            setHandoverNotes('');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to end shift');
        }
    };

    const handleAcknowledge = async (shiftId: string) => {
        if (!userData?.id) return;
        try {
            await acknowledgeHandover.mutateAsync({ shiftId, userId: userData.id });
            toast.success('Handover acknowledged');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to acknowledge');
        }
    };

    const formatTime = (ts: unknown) => {
        if (!ts) return '-';
        const t = ts as { toDate?: () => Date };
        const date = t.toDate ? t.toDate() : new Date(ts as string | number);
        return date.toLocaleString();
    };

    const getShiftLabel = (type: ShiftType) => SHIFT_TYPES.find(s => s.value === type)?.label || type;

    return (
        <div>
            <PageHeader
                title="Shift Management"
                subtitle={activeShift ? `Active: ${getShiftLabel(activeShift.shiftType)}` : 'No active shift'}
                backTo="/dashboard"
                actions={
                    activeShift ? (
                        <button onClick={() => setShowEnd(true)} className="btn-secondary">
                            End Shift
                        </button>
                    ) : (
                        <button onClick={() => setShowStart(true)} className="btn-primary">
                            Start Shift
                        </button>
                    )
                }
            />

            <main className="p-4 max-w-4xl mx-auto">
                {/* Active Shift Card */}
                {activeShift && (
                    <div className="glass-card p-6 mb-4 border border-green-500/30">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-foreground">Current Shift</h2>
                            <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">Active</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-foreground-muted">Shift</p>
                                <p className="text-foreground font-medium">{getShiftLabel(activeShift.shiftType)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-foreground-muted">Started</p>
                                <p className="text-foreground text-sm">{formatTime(activeShift.startTime)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-foreground-muted">Date</p>
                                <p className="text-foreground text-sm">{formatTime(activeShift.date)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Start Shift Dialog */}
                {showStart && (
                    <div className="glass-card p-6 mb-4 border border-blue-500/30">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Start New Shift</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-foreground-secondary mb-1">Shift Type</label>
                                <select value={shiftType} onChange={(e) => setShiftType(e.target.value as ShiftType)} className="input-field w-full">
                                    {SHIFT_TYPES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label} ({s.time})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowStart(false)} className="btn-secondary">Cancel</button>
                                <button onClick={handleStartShift} disabled={startShift.isPending} className="btn-primary">
                                    {startShift.isPending ? 'Starting...' : 'Start Shift'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* End Shift Dialog */}
                {showEnd && (
                    <div className="glass-card p-6 mb-4 border border-yellow-500/30">
                        <h3 className="text-lg font-semibold text-foreground mb-4">End Current Shift</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-foreground-secondary mb-1">Handover Notes *</label>
                                <textarea
                                    value={handoverNotes}
                                    onChange={(e) => setHandoverNotes(e.target.value)}
                                    className="input-field w-full"
                                    rows={4}
                                    placeholder="Summarize shift activities, pending items, and notes for the next shift..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowEnd(false)} className="btn-secondary">Cancel</button>
                                <button
                                    onClick={handleEndShift}
                                    disabled={endShift.isPending || !handoverNotes.trim()}
                                    className="btn-primary"
                                >
                                    {endShift.isPending ? 'Ending...' : 'End Shift'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shift History */}
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Shift History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-tertiary/50">
                                    <tr>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Date</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Shift</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Start</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">End</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Handover</th>
                                        <th className="text-center p-4 text-foreground-secondary font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {shifts.map((shift) => {
                                        const needsAcknowledge = shift.endTime && !shift.handoverAcknowledged;
                                        return (
                                            <tr key={shift.id} className="hover:bg-surface-tertiary/30 transition-colors">
                                                <td className="p-4 text-foreground text-sm">{formatTime(shift.date)}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                                                        {getShiftLabel(shift.shiftType)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-foreground-muted text-sm">{formatTime(shift.startTime)}</td>
                                                <td className="p-4 text-foreground-muted text-sm">{formatTime(shift.endTime)}</td>
                                                <td className="p-4 text-foreground-secondary text-sm max-w-xs truncate">
                                                    {shift.handoverNotes || '-'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {!shift.endTime ? (
                                                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Active</span>
                                                    ) : shift.handoverAcknowledged ? (
                                                        <span className="px-2 py-1 rounded-full text-xs bg-slate-500/20 text-slate-400">Completed</span>
                                                    ) : needsAcknowledge ? (
                                                        <button
                                                            onClick={() => handleAcknowledge(shift.id)}
                                                            className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                                        >
                                                            Acknowledge
                                                        </button>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {shifts.length === 0 && (
                            <div className="p-8 text-center text-foreground-muted">No shift records found</div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
