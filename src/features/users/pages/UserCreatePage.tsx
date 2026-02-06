import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { USER_ROLES } from '../services/userService';
import type { UserRole } from '../types';

export default function UserCreatePage() {
    const navigate = useNavigate();
    const { userData: currentUser } = useAuth();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        role: 'VIEWER' as UserRole,
        employeeId: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const validateForm = (): string | null => {
        if (!formData.email) return 'Email is required';
        if (!formData.password) return 'Password is required';
        if (formData.password.length < 6) return 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        if (!formData.name) return 'Name is required';
        if (!formData.employeeId) return 'Employee ID is required';
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

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const uid = userCredential.user.uid;

            // Create user document in Firestore
            await setDoc(doc(db, 'users', uid), {
                email: formData.email,
                name: formData.name,
                phone: formData.phone,
                role: formData.role,
                status: 'ACTIVE',
                employeeId: formData.employeeId,
                allowedDeviceIds: [],
                createdAt: Timestamp.now(),
                createdBy: currentUser?.id || '',
                updatedAt: Timestamp.now(),
                updatedBy: currentUser?.id || '',
            });

            navigate('/users');
        } catch (err) {
            console.error('Error creating user:', err);
            const firebaseError = err as { code?: string; message?: string };
            if (firebaseError.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists');
            } else if (firebaseError.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (firebaseError.code === 'auth/weak-password') {
                setError('Password is too weak');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to create user');
            }
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
                        onClick={() => navigate('/users')}
                        className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Create New User</h1>
                        <p className="text-sm text-foreground-muted">Add a new user to the system</p>
                    </div>
                </div>
            </header>

            <main className="p-4">
                {/* Error */}
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Account Details */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Account Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Email Address <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="user@company.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Employee ID <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="EMP001"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Password <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Confirm Password <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="input-field w-full"
                                    placeholder="9876543210"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role Assignment */}
                    <div className="glass-card p-6 mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Role Assignment</h3>

                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                User Role <span className="text-red-400">*</span>
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="input-field w-full md:w-1/2"
                                required
                            >
                                {USER_ROLES.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                            <p className="text-foreground-faint text-sm mt-2">
                                This determines what features and pages the user can access.
                            </p>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/users')}
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
                            Create User
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
