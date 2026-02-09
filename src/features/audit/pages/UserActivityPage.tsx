import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../users/hooks/useUsers';
import { useUserAuditLogs } from '../hooks/useAuditLogs';
import { getActionLabel, getActionColor, getCollectionLabel } from '../types';
import { PageHeader, LoadingSpinner, EmptyState } from '../../../components/ui';

export default function UserActivityPage() {
    const navigate = useNavigate();
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const { data: users = [], isLoading: usersLoading } = useUsers();
    const { data: logs = [], isLoading: logsLoading } = useUserAuditLogs(selectedUserId);

    const selectedUser = users.find(u => u.id === selectedUserId);

    const formatDate = (ts: unknown) => {
        if (!ts) return '-';
        const t = ts as { toDate?: () => Date };
        return t?.toDate ? t.toDate().toLocaleString() : '-';
    };

    // Group logs by date for better readability
    const groupedLogs = logs.reduce<Record<string, typeof logs>>((groups, log) => {
        const ts = log.timestamp as unknown as { toDate?: () => Date };
        const date = ts?.toDate ? ts.toDate().toLocaleDateString() : 'Unknown';
        if (!groups[date]) groups[date] = [];
        groups[date].push(log);
        return groups;
    }, {});

    // Per-user stats
    const stats = selectedUserId ? {
        totalActions: logs.length,
        creates: logs.filter(l => l.action.includes('CREATED')).length,
        updates: logs.filter(l => l.action.includes('UPDATED') || l.action.includes('STATUS') || l.action.includes('STEP')).length,
        other: logs.filter(l => !l.action.includes('CREATED') && !l.action.includes('UPDATED') && !l.action.includes('STATUS') && !l.action.includes('STEP')).length,
    } : null;

    return (
        <div>
            <PageHeader
                title="User Activity Log"
                subtitle="Per-user action history and audit trail"
                backTo="/dashboard"
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* User Selector */}
                <div className="glass-card p-4 mb-4">
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                        Select User
                    </label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="input-field"
                        disabled={usersLoading}
                    >
                        <option value="">-- Select a user --</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.role?.replace(/_/g, ' ')})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Stats */}
                {stats && selectedUser && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Total Actions</p>
                            <p className="text-2xl font-bold text-foreground">{stats.totalActions}</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Creates</p>
                            <p className="text-2xl font-bold text-green-400">{stats.creates}</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Updates</p>
                            <p className="text-2xl font-bold text-blue-400">{stats.updates}</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-sm text-foreground-muted">Other</p>
                            <p className="text-2xl font-bold text-slate-400">{stats.other}</p>
                        </div>
                    </div>
                )}

                {/* Selected User Info */}
                {selectedUser && (
                    <div className="glass-card p-4 mb-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center ring-1 ring-border">
                            <span className="text-white font-medium">
                                {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-foreground font-medium">{selectedUser.name}</p>
                            <p className="text-foreground-muted text-sm">{selectedUser.email} &middot; {selectedUser.role?.replace(/_/g, ' ')}</p>
                        </div>
                        <button
                            onClick={() => navigate(`/users/${selectedUser.id}`)}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            View Profile
                        </button>
                    </div>
                )}

                {/* Activity Timeline */}
                {!selectedUserId ? (
                    <div className="glass-card p-8">
                        <EmptyState
                            title="Select a user"
                            description="Choose a user from the dropdown above to view their activity log"
                        />
                    </div>
                ) : logsLoading ? (
                    <LoadingSpinner />
                ) : logs.length === 0 ? (
                    <div className="glass-card p-8">
                        <EmptyState
                            title="No activity found"
                            description={`No recorded actions for ${selectedUser?.name || 'this user'}`}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                            <div key={date}>
                                <h3 className="text-sm font-medium text-foreground-muted mb-2 sticky top-0 bg-surface-primary/80 backdrop-blur-sm py-1 z-10">
                                    {date}
                                </h3>
                                <div className="glass-card overflow-hidden">
                                    <div className="divide-y divide-border">
                                        {dateLogs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="p-4 hover:bg-surface-tertiary/30 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`font-medium ${getActionColor(log.action)}`}>
                                                                {getActionLabel(log.action)}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-foreground-muted">
                                                                {getCollectionLabel(log.collection)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-foreground-muted font-mono truncate">
                                                            {log.documentId}
                                                        </p>
                                                        {log.data && Object.keys(log.data).length > 0 && (
                                                            <div className="mt-2 text-xs text-foreground-faint bg-surface-tertiary/50 rounded p-2 font-mono overflow-x-auto">
                                                                {Object.entries(log.data).slice(0, 5).map(([key, value]) => (
                                                                    <div key={key}>
                                                                        <span className="text-foreground-muted">{key}:</span>{' '}
                                                                        {String(value)}
                                                                    </div>
                                                                ))}
                                                                {Object.keys(log.data).length > 5 && (
                                                                    <div className="text-foreground-faint mt-1">
                                                                        +{Object.keys(log.data).length - 5} more fields
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-foreground-faint whitespace-nowrap">
                                                        {formatDate(log.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
