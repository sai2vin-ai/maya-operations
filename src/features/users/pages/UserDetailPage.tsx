import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
    getUserById,
    updateUser,
    sendPasswordReset,
    USER_ROLES,
    USER_STATUSES,
} from '../services/userService';
import type { User, UserRole, UserStatus } from '../types';

export default function UserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData: currentUser } = useAuth();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        role: '' as UserRole,
        status: '' as UserStatus,
        employeeId: '',
    });

    // Load user
    useEffect(() => {
        if (id) {
            loadUser(id);
        }
    }, [id]);

    const loadUser = async (userId: string) => {
        try {
            setLoading(true);
            setError(null);
            const fetchedUser = await getUserById(userId);
            if (fetchedUser) {
                setUser(fetchedUser);
                setFormData({
                    name: fetchedUser.name || '',
                    phone: fetchedUser.phone || '',
                    role: fetchedUser.role,
                    status: fetchedUser.status,
                    employeeId: fetchedUser.employeeId || '',
                });
            } else {
                setError('User not found');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load user');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!id || !currentUser) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            await updateUser(id, formData, currentUser.id || '');

            setSuccess('User updated successfully');
            setIsEditing(false);
            await loadUser(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;

        try {
            setSaving(true);
            setError(null);
            await sendPasswordReset(user.email);
            setSuccess('Password reset email sent');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send password reset');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                role: user.role,
                status: user.status,
                employeeId: user.employeeId || '',
            });
        }
        setIsEditing(false);
        setError(null);
        setSuccess(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="glass-card p-8 text-center max-w-md">
                    <h2 className="text-xl font-bold text-foreground mb-2">User Not Found</h2>
                    <p className="text-foreground-muted mb-4">The user you're looking for doesn't exist.</p>
                    <button onClick={() => navigate('/users')} className="btn-primary">
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/users')}
                            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">User Details</h1>
                            <p className="text-sm text-foreground-muted">{user.email}</p>
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
                            <button onClick={handleCancel} className="btn-secondary">
                                Cancel
                            </button>
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
                {/* Messages */}
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

                {/* User Avatar & Basic Info */}
                <div className="glass-card p-6 mb-4">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-3xl">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                            <p className="text-foreground-muted">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`status-badge ${user.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                                    {user.status}
                                </span>
                                <span className="text-foreground-faint">•</span>
                                <span className="text-foreground-muted">{USER_ROLES.find(r => r.value === user.role)?.label || user.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">User Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                />
                            ) : (
                                <p className="text-foreground py-2">{user.name}</p>
                            )}
                        </div>

                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Email</label>
                            <p className="text-foreground py-2">{user.email}</p>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Phone</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                />
                            ) : (
                                <p className="text-foreground py-2">{user.phone || '-'}</p>
                            )}
                        </div>

                        {/* Employee ID */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Employee ID</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                />
                            ) : (
                                <p className="text-foreground py-2">{user.employeeId || '-'}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Role</label>
                            {isEditing ? (
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                >
                                    {USER_ROLES.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-foreground py-2">{USER_ROLES.find(r => r.value === user.role)?.label || user.role}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Status</label>
                            {isEditing ? (
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                >
                                    {USER_STATUSES.map(status => (
                                        <option key={status.value} value={status.value}>{status.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-foreground py-2">{USER_STATUSES.find(s => s.value === user.status)?.label || user.status}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="glass-card p-6 mt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleResetPassword}
                            disabled={saving}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Reset Password
                        </button>
                    </div>
                </div>

                {/* Audit Info */}
                <div className="glass-card p-6 mt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Audit Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-foreground-muted">Created:</span>
                            <span className="text-foreground ml-2">
                                {user.createdAt?.toDate?.()?.toLocaleString() || '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-foreground-muted">Last Updated:</span>
                            <span className="text-foreground ml-2">
                                {user.updatedAt?.toDate?.()?.toLocaleString() || '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
