import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevices, useToggleDeviceStatus } from '../hooks/useDevices';
import { DEVICE_TYPES } from '../services/deviceService';
import {
    PageHeader,
    FilterBar,
    StatusFilters,
    LoadingSpinner,
    ErrorAlert,
    EmptyState,
    EmptyStateIcons,
    StatusBadge,
} from '../../../components/ui';

export default function DevicesPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // React Query hooks
    const { data: devices = [], isLoading, error, refetch } = useDevices({ status: filter, searchQuery });
    const toggleStatus = useToggleDeviceStatus();

    const getDeviceTypeLabel = (type: string) => {
        return DEVICE_TYPES.find(t => t.value === type)?.label || type;
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'MOBILE': return '📱';
            case 'TABLET': return '📲';
            case 'DESKTOP': return '🖥️';
            case 'SCANNER': return '📟';
            default: return '📱';
        }
    };

    const handleToggleStatus = async (device: { id: string; status: string }) => {
        try {
            await toggleStatus.mutateAsync({
                deviceId: device.id,
                currentStatus: device.status,
            });
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <PageHeader
                title="Device Management"
                subtitle={`${devices.length} devices registered`}
                backTo="/dashboard"
                actions={
                    <button
                        onClick={() => navigate('/devices/new')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Add Device</span>
                    </button>
                }
            />

            <main className="p-4">
                <FilterBar
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search devices..."
                    filters={StatusFilters}
                    activeFilter={filter}
                    onFilterChange={(value) => setFilter(value as 'all' | 'active' | 'inactive')}
                />

                {(error || toggleStatus.error) && (
                    <ErrorAlert
                        message={error?.message || toggleStatus.error?.message || 'An error occurred'}
                        onDismiss={() => refetch()}
                    />
                )}

                {isLoading && <LoadingSpinner />}

                {!isLoading && (
                    <div className="space-y-3">
                        {devices.length === 0 ? (
                            <EmptyState
                                icon={EmptyStateIcons.devices}
                                title="No devices found"
                                description={searchQuery ? 'Try a different search term' : 'Register your first device to get started'}
                                action={!searchQuery ? { label: 'Add Device', onClick: () => navigate('/devices/new') } : undefined}
                            />
                        ) : (
                            devices.map((device) => (
                                <div
                                    key={device.id}
                                    className="glass-card p-4 hover:bg-slate-700/50 transition-all cursor-pointer"
                                    onClick={() => navigate(`/devices/${device.id}`)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                <span className="text-2xl">{getDeviceIcon(device.deviceType)}</span>
                                            </div>

                                            <div>
                                                <h3 className="text-white font-semibold">{device.name}</h3>
                                                <p className="text-slate-400 text-sm">{device.deviceId}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500">{getDeviceTypeLabel(device.deviceType)}</span>
                                                    <span className="text-xs text-slate-500">•</span>
                                                    <span className="text-xs text-slate-500">{device.os}</span>
                                                    {device.location && (
                                                        <>
                                                            <span className="text-xs text-slate-500">•</span>
                                                            <span className="text-xs text-slate-500">{device.location}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <StatusBadge status={device.status} />

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(device);
                                                }}
                                                disabled={toggleStatus.isPending}
                                                className={`p-2 rounded-lg transition-colors ${device.status === 'ACTIVE'
                                                    ? 'hover:bg-red-500/20 text-red-400'
                                                    : 'hover:bg-green-500/20 text-green-400'
                                                    }`}
                                                title={device.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {device.status === 'ACTIVE' ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    )}
                                                </svg>
                                            </button>

                                            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
