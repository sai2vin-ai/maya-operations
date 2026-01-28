import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, deactivateUser, activateUser, USER_ROLES } from '../services/userService';
import type { User } from '../types';

export function UsersPage() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Load users
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        // Status filter
        if (filter === 'active' && user.status !== 'ACTIVE') return false;
        if (filter === 'inactive' && user.status === 'ACTIVE') return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.employeeId?.toLowerCase().includes(query) ||
                user.role?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Toggle user status
    const handleToggleStatus = async (user: User) => {
        if (!userData) return;

        try {
            if (user.status === 'ACTIVE') {
                await deactivateUser(user.id, userData.id || '');
            } else {
                await activateUser(user.id, userData.id || '');
            }
            await loadUsers();
        } catch (err: any) {
            setError(err.message || 'Failed to update user status');
        }
    };

    // Get role label
    const getRoleLabel = (role: string) => {
        const found = USER_ROLES.find(r => r.value === role);
        return found?.label || role;
    };

    // Get status badge style
    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return 'status-badge status-active';
            case 'INACTIVE':
                return 'status-badge status-inactive';
            case 'SUSPENDED':
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
                            <h1 className="text-xl font-bold text-white">User Management</h1>
                            <p className="text-sm text-slate-400">{users.length} users total</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/users/new')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Add User</span>
                    </button>
                </div>
            </header>

            <main className="p-4">
                {/* Filters */}
                <div className="glass-card p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field w-full"
                            />
                        </div>

                        {/* Status Filter */}
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

                {/* Error */}
                {error && (
                    <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Users List */}
                {!loading && (
                    <div className="space-y-3">
                        {filteredUsers.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-white font-semibold mb-2">No users found</h3>
                                <p className="text-slate-400">
                                    {searchQuery ? 'Try a different search term' : 'Add your first user to get started'}
                                </p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="glass-card p-4 hover:bg-slate-700/50 transition-all cursor-pointer"
                                    onClick={() => navigate(`/users/${user.id}`)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">
                                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <h3 className="text-white font-semibold">{user.name}</h3>
                                                <p className="text-slate-400 text-sm">{user.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500">{user.employeeId}</span>
                                                    <span className="text-xs text-slate-500">•</span>
                                                    <span className="text-xs text-slate-500">{getRoleLabel(user.role)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-3">
                                            <span className={getStatusBadge(user.status)}>
                                                {user.status}
                                            </span>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(user);
                                                }}
                                                className={`p-2 rounded-lg transition-colors ${user.status === 'ACTIVE'
                                                        ? 'hover:bg-red-500/20 text-red-400'
                                                        : 'hover:bg-green-500/20 text-green-400'
                                                    }`}
                                                title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {user.status === 'ACTIVE' ? (
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
