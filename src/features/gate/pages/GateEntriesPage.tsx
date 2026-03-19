import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGateEntries, useCompleteGateEntry, useCancelGateEntry } from '../hooks/useGateEntries';
import { MATERIAL_CATEGORIES, ENTRY_STATUSES } from '../services/gateEntryService';
import { useAuth } from '../../../contexts/AuthContext';
import type { GateEntryStatus } from '../types';
import { PageHeader, LoadingSpinner, ErrorAlert, EmptyState, InputDialog } from '../../../components/ui';

const GateEntryFilters = [
    { value: 'all', label: 'All', activeColor: 'blue' },
    { value: 'PENDING', label: 'Pending', activeColor: 'yellow' },
    { value: 'COMPLETED', label: 'Completed', activeColor: 'green' },
];

export default function GateEntriesPage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const [filter, setFilter] = useState<'all' | GateEntryStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancellingEntryId, setCancellingEntryId] = useState<string | null>(null);

    // React Query hooks
    const { data: entries = [], isLoading, error, refetch } = useGateEntries({ status: filter, searchQuery });
    const completeEntry = useCompleteGateEntry();
    const cancelEntry = useCancelGateEntry();

    const handleComplete = async (entryId: string) => {
        if (!userData?.id) return;
        try {
            await completeEntry.mutateAsync({ entryId, updatedBy: userData.id, callerRole: userData.role });
        } catch {
            // Error handled by mutation
        }
    };

    const handleCancelClick = (entryId: string) => {
        setCancellingEntryId(entryId);
        setCancelDialogOpen(true);
    };

    const handleCancelConfirm = async (reason: string) => {
        if (!userData?.id || !cancellingEntryId) return;

        try {
            await cancelEntry.mutateAsync({
                entryId: cancellingEntryId,
                reason,
                updatedBy: userData.id,
                callerRole: userData.role,
            });
            setCancelDialogOpen(false);
            setCancellingEntryId(null);
        } catch {
            // Error handled by mutation
        }
    };

    const handleCancelDialogClose = () => {
        setCancelDialogOpen(false);
        setCancellingEntryId(null);
    };

    const getMaterialLabel = (category?: string) => {
        return MATERIAL_CATEGORIES.find((m) => m.value === category)?.label || category || '-';
    };

    const getStatusInfo = (status: GateEntryStatus) => {
        return ENTRY_STATUSES.find((s) => s.value === status) || { label: status, color: 'gray' };
    };

    const formatTime = (timestamp: unknown) => {
        if (!timestamp) return '-';
        const ts = timestamp as { toDate?: () => Date };
        const date = ts.toDate ? ts.toDate() : new Date(timestamp as string | number);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFilterButtonClass = (filterValue: string, isActive: boolean) => {
        if (isActive) {
            const colorMap: Record<string, string> = {
                blue: 'bg-blue-600 text-white',
                green: 'bg-green-600 text-white',
                yellow: 'bg-yellow-600 text-white',
            };
            const filterDef = GateEntryFilters.find((f) => f.value === filterValue);
            return colorMap[filterDef?.activeColor || 'blue'] || 'bg-blue-600 text-white';
        }
        return 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-hover';
    };

    return (
        <div className="">
            <PageHeader
                title="Gate Operations"
                subtitle={`${entries.length} entries total`}
                backTo="/dashboard"
                actions={
                    <button onClick={() => navigate('/gate/new')} className="btn-primary flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">New Entry</span>
                    </button>
                }
            />

            <main className="p-4">
                {/* Filters */}
                <div className="glass-card p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by vehicle, entry number, supplier..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field w-full"
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {GateEntryFilters.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilter(f.value as 'all' | GateEntryStatus)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${getFilterButtonClass(f.value, filter === f.value)}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error Messages */}
                {(error || completeEntry.error || cancelEntry.error) && (
                    <ErrorAlert
                        message={
                            error?.message ||
                            completeEntry.error?.message ||
                            cancelEntry.error?.message ||
                            'An error occurred'
                        }
                        onDismiss={() => refetch()}
                    />
                )}

                {/* Loading */}
                {isLoading && <LoadingSpinner />}

                {/* Entries List */}
                {!isLoading && (
                    <div className="space-y-3">
                        {entries.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg
                                        className="w-8 h-8 text-foreground-faint"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                        />
                                    </svg>
                                }
                                title="No entries found"
                                description={
                                    searchQuery ? 'Try a different search term' : 'Record your first gate entry'
                                }
                                action={
                                    !searchQuery
                                        ? { label: 'New Entry', onClick: () => navigate('/gate/new') }
                                        : undefined
                                }
                            />
                        ) : (
                            entries.map((entry) => {
                                const statusInfo = getStatusInfo(entry.status);
                                return (
                                    <div
                                        key={entry.id}
                                        className="glass-card p-4 hover:bg-surface-hover transition-all cursor-pointer"
                                        onClick={() => navigate(`/gate/${entry.id}`)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                {/* Entry Type Icon */}
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                        entry.entryType === 'IN'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-orange-500/20 text-orange-400'
                                                    }`}
                                                >
                                                    <svg
                                                        className="w-6 h-6"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        {entry.entryType === 'IN' ? (
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M11 16l-4-4m0 0l4-4m-4 4h14"
                                                            />
                                                        ) : (
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                                                            />
                                                        )}
                                                    </svg>
                                                </div>

                                                {/* Entry Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-foreground font-bold text-lg">
                                                            {entry.vehicleNumber}
                                                        </h3>
                                                        <span
                                                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                                                                entry.entryType === 'IN'
                                                                    ? 'bg-green-500/20 text-green-400'
                                                                    : 'bg-orange-500/20 text-orange-400'
                                                            }`}
                                                        >
                                                            {entry.entryType}
                                                        </span>
                                                        {entry.vehicleType && (
                                                            <span
                                                                className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                                                    entry.vehicleType === 'CARGO'
                                                                        ? 'bg-blue-500/20 text-blue-400'
                                                                        : entry.vehicleType === 'INTERNAL'
                                                                          ? 'bg-purple-500/20 text-purple-400'
                                                                          : 'bg-teal-500/20 text-teal-400'
                                                                }`}
                                                            >
                                                                {entry.vehicleType === 'CARGO'
                                                                    ? 'Cargo'
                                                                    : entry.vehicleType === 'INTERNAL'
                                                                      ? 'Internal'
                                                                      : 'Visitor'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-foreground-muted text-sm">{entry.entryNumber}</p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-foreground-faint">
                                                        <span>{getMaterialLabel(entry.materialCategory)}</span>
                                                        {entry.netWeight && (
                                                            <span>
                                                                {entry.netWeight} {entry.unit}
                                                            </span>
                                                        )}
                                                        <span>{formatTime(entry.entryTime)}</span>
                                                    </div>
                                                    {entry.supplierName && (
                                                        <p className="text-foreground-faint text-xs mt-1">
                                                            {entry.supplierName}{' '}
                                                            {entry.driverName && `| ${entry.driverName}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status & Actions */}
                                            <div className="flex flex-col items-end gap-2">
                                                <span
                                                    className={`status-badge ${
                                                        statusInfo.color === 'green'
                                                            ? 'status-active'
                                                            : statusInfo.color === 'yellow'
                                                              ? 'status-pending'
                                                              : 'status-inactive'
                                                    }`}
                                                >
                                                    {statusInfo.label}
                                                </span>

                                                {entry.status === 'PENDING' && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleComplete(entry.id);
                                                            }}
                                                            disabled={completeEntry.isPending}
                                                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                                                            title="Mark as Completed"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCancelClick(entry.id);
                                                            }}
                                                            disabled={cancelEntry.isPending}
                                                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                            title="Cancel Entry"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M6 18L18 6M6 6l12 12"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>

            {/* Cancel Dialog */}
            <InputDialog
                isOpen={cancelDialogOpen}
                title="Cancel Entry"
                message="Please provide a reason for cancelling this gate entry."
                placeholder="Enter cancellation reason..."
                confirmLabel="Cancel Entry"
                cancelLabel="Go Back"
                variant="danger"
                onConfirm={handleCancelConfirm}
                onCancel={handleCancelDialogClose}
                loading={cancelEntry.isPending}
            />
        </div>
    );
}
