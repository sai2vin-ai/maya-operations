import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    getDeviceById,
    updateDevice,
    revokeDevice,
    DEVICE_TYPES,
    OPERATING_SYSTEMS,
    DEVICE_STATUSES,
} from '../services/deviceService';
import type { Device, DeviceType, DeviceStatus, OperatingSystem } from '../types';

export default function DeviceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [device, setDevice] = useState<Device | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        deviceType: '' as DeviceType,
        os: '' as OperatingSystem,
        osVersion: '',
        appVersion: '',
        status: '' as DeviceStatus,
        location: '',
    });

    useEffect(() => {
        if (id) {
            loadDevice(id);
        }
    }, [id]);

    const loadDevice = async (deviceId: string) => {
        try {
            setLoading(true);
            setError(null);
            const fetchedDevice = await getDeviceById(deviceId);
            if (fetchedDevice) {
                setDevice(fetchedDevice);
                setFormData({
                    name: fetchedDevice.name || '',
                    deviceType: fetchedDevice.deviceType,
                    os: fetchedDevice.os,
                    osVersion: fetchedDevice.osVersion || '',
                    appVersion: fetchedDevice.appVersion || '',
                    status: fetchedDevice.status,
                    location: fetchedDevice.location || '',
                });
            } else {
                setError('Device not found');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load device');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!id) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            await updateDevice(id, formData);

            setSuccess('Device updated successfully');
            setIsEditing(false);
            await loadDevice(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update device');
        } finally {
            setSaving(false);
        }
    };

    const handleRevoke = async () => {
        if (!id || !window.confirm('Are you sure you want to revoke this device? This action cannot be undone.')) return;

        try {
            setSaving(true);
            setError(null);
            await revokeDevice(id);
            setSuccess('Device revoked');
            await loadDevice(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to revoke device');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (device) {
            setFormData({
                name: device.name || '',
                deviceType: device.deviceType,
                os: device.os,
                osVersion: device.osVersion || '',
                appVersion: device.appVersion || '',
                status: device.status,
                location: device.location || '',
            });
        }
        setIsEditing(false);
        setError(null);
        setSuccess(null);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!device) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="glass-card p-8 text-center max-w-md">
                    <h2 className="text-xl font-bold text-foreground mb-2">Device Not Found</h2>
                    <p className="text-foreground-muted mb-4">The device you're looking for doesn't exist.</p>
                    <button onClick={() => navigate('/devices')} className="btn-primary">
                        Back to Devices
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen page-bg">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/devices')}
                            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Device Details</h1>
                            <p className="text-sm text-foreground-muted">{device.deviceId}</p>
                        </div>
                    </div>

                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={handleCancel} className="btn-secondary">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary flex items-center gap-2"
                            >
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Save
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="p-4">
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="glass-card p-4 mb-4 border border-green-500/50 bg-green-500/10">
                        <p className="text-green-400">{success}</p>
                    </div>
                )}

                {/* Device Info Card */}
                <div className="glass-card p-6 mb-4">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                            <span className="text-4xl">{getDeviceIcon(device.deviceType)}</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">{device.name}</h2>
                            <p className="text-foreground-muted">{device.deviceId}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`status-badge ${device.status === 'ACTIVE' ? 'status-active' : device.status === 'REVOKED' ? 'status-pending' : 'status-inactive'}`}>
                                    {device.status}
                                </span>
                                <span className="text-foreground-faint">•</span>
                                <span className="text-foreground-muted">{DEVICE_TYPES.find(t => t.value === device.deviceType)?.label}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Device Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Device Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                />
                            ) : (
                                <p className="text-foreground py-2">{device.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Device ID</label>
                            <p className="text-foreground py-2">{device.deviceId}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Device Type</label>
                            {isEditing ? (
                                <select
                                    name="deviceType"
                                    value={formData.deviceType}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                >
                                    {DEVICE_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-foreground py-2">{DEVICE_TYPES.find(t => t.value === device.deviceType)?.label}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Operating System</label>
                            {isEditing ? (
                                <select
                                    name="os"
                                    value={formData.os}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                >
                                    {OPERATING_SYSTEMS.map(os => (
                                        <option key={os.value} value={os.value}>{os.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-foreground py-2">{OPERATING_SYSTEMS.find(o => o.value === device.os)?.label}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">OS Version</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="osVersion"
                                    value={formData.osVersion}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                />
                            ) : (
                                <p className="text-foreground py-2">{device.osVersion || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">App Version</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="appVersion"
                                    value={formData.appVersion}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                />
                            ) : (
                                <p className="text-foreground py-2">{device.appVersion || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Location</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="e.g., Gate 1, Control Room"
                                />
                            ) : (
                                <p className="text-foreground py-2">{device.location || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Status</label>
                            {isEditing ? (
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                >
                                    {DEVICE_STATUSES.map(status => (
                                        <option key={status.value} value={status.value}>{status.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-foreground py-2">{DEVICE_STATUSES.find(s => s.value === device.status)?.label}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="glass-card p-6 mt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        {device.status !== 'REVOKED' && (
                            <button
                                onClick={handleRevoke}
                                disabled={saving}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Revoke Device
                            </button>
                        )}
                    </div>
                </div>

                {/* Audit Info */}
                <div className="glass-card p-6 mt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Registration Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-foreground-muted">Registered:</span>
                            <span className="text-foreground ml-2">
                                {device.registeredAt?.toDate?.()?.toLocaleString() || '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-foreground-muted">Registered By:</span>
                            <span className="text-foreground ml-2">{device.registeredBy || '-'}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
