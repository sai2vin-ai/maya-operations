import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui';
import { createDevice, DEVICE_TYPES, OPERATING_SYSTEMS } from '../services/deviceService';
import type { DeviceType, OperatingSystem } from '../types';

export default function DeviceCreatePage() {
    const navigate = useNavigate();
    const { userData: currentUser } = useAuth();
    const toast = useToast();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        deviceId: '',
        name: '',
        deviceType: 'MOBILE' as DeviceType,
        os: 'ANDROID' as OperatingSystem,
        osVersion: '',
        appVersion: '',
        location: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const generateDeviceId = () => {
        const prefix = formData.deviceType === 'MOBILE' ? 'MOB' :
            formData.deviceType === 'TABLET' ? 'TAB' :
                formData.deviceType === 'DESKTOP' ? 'DES' : 'SCN';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFormData(prev => ({ ...prev, deviceId: `${prefix}-${random}` }));
    };

    const validateForm = (): string | null => {
        if (!formData.deviceId) return 'Device ID is required';
        if (!formData.name) return 'Device name is required';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await createDevice(formData, currentUser?.id || '');
            toast.success('Device registered successfully');
            navigate('/devices');
        } catch (err) {
            console.error('Error creating device:', err);
            setError(err instanceof Error ? err.message : 'Failed to register device');
            toast.error('Failed to register device');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="">
            {/* Header */}
            <header className="glass-card m-4 p-4">
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
                        <h1 className="text-xl font-bold text-foreground">Register New Device</h1>
                        <p className="text-sm text-foreground-muted">Add a new device to the system</p>
                    </div>
                </div>
            </header>

            <main className="p-4">
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Device Identification */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Device Identification</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Device ID <span className="text-red-400">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="deviceId"
                                        value={formData.deviceId}
                                        onChange={handleInputChange}
                                        className="input-field flex-1"
                                        placeholder="MOB-ABC123"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={generateDeviceId}
                                        className="btn-secondary"
                                    >
                                        Generate
                                    </button>
                                </div>
                                <p className="text-foreground-faint text-sm mt-1">Unique identifier for this device</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Device Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="Gate 1 Scanner"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Device Specifications */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Device Specifications</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Device Type <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="deviceType"
                                    value={formData.deviceType}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    required
                                >
                                    {DEVICE_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Operating System <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="os"
                                    value={formData.os}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    required
                                >
                                    {OPERATING_SYSTEMS.map(os => (
                                        <option key={os.value} value={os.value}>{os.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">OS Version</label>
                                <input
                                    type="text"
                                    name="osVersion"
                                    value={formData.osVersion}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="14.0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">App Version</label>
                                <input
                                    type="text"
                                    name="appVersion"
                                    value={formData.appVersion}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="1.0.0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Location</h3>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Assigned Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="input-field w-full md:w-1/2"
                                placeholder="Gate 1, Control Room, etc."
                            />
                            <p className="text-foreground-faint text-sm mt-2">
                                Where this device is primarily used
                            </p>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/devices')}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            Register Device
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
