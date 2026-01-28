import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDevices, deactivateDevice, activateDevice, DEVICE_TYPES } from '../services/deviceService';
import type { Device } from '../types';

export function DevicesPage() {
    const navigate = useNavigate();
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedDevices = await getDevices();
            setDevices(fetchedDevices);
        } catch (err: any) {
            setError(err.message || 'Failed to load devices');
        } finally {
            setLoading(false);
        }
    };

    const filteredDevices = devices.filter(device => {
        if (filter === 'active' && device.status !== 'ACTIVE') return false;
        if (filter === 'inactive' && device.status === 'ACTIVE') return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                device.name?.toLowerCase().includes(query) ||
                device.deviceId?.toLowerCase().includes(query) ||
                device.location?.toLowerCase().includes(query) ||
                device.deviceType?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const handleToggleStatus = async (device: Device) => {
        try {
            if (device.status === 'ACTIVE') {
                await deactivateDevice(device.id);
            } else {
                await activateDevice(device.id);
            }
            await loadDevices();
        } catch (err: any) {
            setError(err.message || 'Failed to update device status');
        }
    };

    const getDeviceTypeLabel = (type: string) => {
        return DEVICE_TYPES.find(t => t.value === type)?.label || type;
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'MOBILE':
                return '📱';
            case 'TABLET':
                return '📲';
            case 'DESKTOP':
                return '🖥️';
            case 'SCANNER':
                return '📟';
            default:
                return '📱';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return 'status-badge status-active';
            case 'INACTIVE':
                return 'status-badge status-inactive';
            case 'REVOKED':
                return 'status-badge status-pending';
            default:
                return 'status-badge';
        }
    };

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
                            <h1 className="text-xl font-bold text-white">Device Management</h1>
                            <p className="text-sm text-slate-400">{devices.length} devices registered</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/devices/new')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Add Device</span>
                    </button>
                </div>
            </header>

            <main className="p-4">
                {/* Filters */}
                <div className="glass-card p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search devices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field w-full"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('active')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setFilter('inactive')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'inactive' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Inactive
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && (
                    <div className="space-y-3">
                        {filteredDevices.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">📱</span>
                                </div>
                                <h3 className="text-white font-semibold mb-2">No devices found</h3>
                                <p className="text-slate-400">
                                    {searchQuery ? 'Try a different search term' : 'Register your first device to get started'}
                                </p>
                            </div>
                        ) : (
                            filteredDevices.map((device) => (
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
                                            <span className={getStatusBadge(device.status)}>
                                                {device.status}
                                            </span>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(device);
                                                }}
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
