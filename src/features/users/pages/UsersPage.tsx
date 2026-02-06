import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useUsers, useToggleUserStatus } from '../hooks/useUsers';
import { USER_ROLES } from '../services/userService';
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

export default function UsersPage() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // React Query hooks
    const { data: users = [], isLoading, error, refetch } = useUsers({ status: filter, searchQuery });
    const toggleStatus = useToggleUserStatus();

    // Get role label
    const getRoleLabel = (role: string) => {
        const found = USER_ROLES.find(r => r.value === role);
        return found?.label || role;
    };

    // Toggle user status
    const handleToggleStatus = async (user: { id: string; status: string }) => {
        if (!userData) return;

        try {
            await toggleStatus.mutateAsync({
                userId: user.id,
                currentStatus: user.status,
                updatedBy: userData.id || '',
            });
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <div className="min-h-screen page-bg">
            <PageHeader
                title="User Management"
                subtitle={`${users.length} users total`}
                backTo="/dashboard"
                actions={
                    <button
                        onClick={() => navigate('/users/new')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Add User</span>
                    </button>
                }
            />

            <main className="p-4">
                <FilterBar
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search users..."
                    filters={StatusFilters}
                    activeFilter={filter}
                    onFilterChange={(value) => setFilter(value as 'all' | 'active' | 'inactive')}
                />

                {/* Error */}
                {(error || toggleStatus.error) && (
                    <ErrorAlert
                        message={error?.message || toggleStatus.error?.message || 'An error occurred'}
                        onDismiss={() => refetch()}
                    />
                )}

                {/* Loading */}
                {isLoading && <LoadingSpinner />}

                {/* Users List */}
                {!isLoading && (
                    <div className="space-y-3">
                        {users.length === 0 ? (
                            <EmptyState
                                icon={EmptyStateIcons.users}
                                title="No users found"
                                description={searchQuery ? 'Try a different search term' : 'Add your first user to get started'}
                                action={!searchQuery ? { label: 'Add User', onClick: () => navigate('/users/new') } : undefined}
                            />
                        ) : (
                            users.map((user) => (
                                <div
                                    key={user.id}
                                    className="glass-card p-4 hover:bg-surface-hover transition-all cursor-pointer"
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
                                                <h3 className="text-foreground font-semibold">{user.name}</h3>
                                                <p className="text-foreground-muted text-sm">{user.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-foreground-faint">{user.employeeId}</span>
                                                    <span className="text-xs text-foreground-faint">•</span>
                                                    <span className="text-xs text-foreground-faint">{getRoleLabel(user.role)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-3">
                                            <StatusBadge status={user.status} />

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(user);
                                                }}
                                                disabled={toggleStatus.isPending}
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

                                            <svg className="w-5 h-5 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
