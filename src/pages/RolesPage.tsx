import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLE_DEFINITIONS, MODULES, ROLE_COLORS, type RoleDefinition, type ModuleKey } from '../config/roles';

export default function RolesPage() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

    const moduleKeys = Object.keys(MODULES) as ModuleKey[];

    const getPermissionBadge = (permissions: string[]) => {
        if (permissions.length === 0) return null;

        const permissionColors: Record<string, string> = {
            view: 'bg-blue-500/20 text-blue-400',
            create: 'bg-green-500/20 text-green-400',
            edit: 'bg-yellow-500/20 text-yellow-400',
            delete: 'bg-red-500/20 text-red-400',
        };

        return (
            <div className="flex flex-wrap gap-1">
                {permissions.map(p => (
                    <span key={p} className={`text-xs px-2 py-0.5 rounded ${permissionColors[p]}`}>
                        {p}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Roles & Permissions</h1>
                            <p className="text-sm text-foreground-muted">{ROLE_DEFINITIONS.length} roles defined</p>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                viewMode === 'cards'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-hover'
                            }`}
                        >
                            Cards
                        </button>
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                viewMode === 'matrix'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-hover'
                            }`}
                        >
                            Matrix
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-4">
                {/* Cards View */}
                {viewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ROLE_DEFINITIONS.map((role) => (
                            <div
                                key={role.value}
                                className={`glass-card p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                                    selectedRole?.value === role.value ? 'ring-2 ring-blue-500' : ''
                                }`}
                                onClick={() => setSelectedRole(selectedRole?.value === role.value ? null : role)}
                            >
                                {/* Role Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${ROLE_COLORS[role.color]}`}>
                                            {role.label}
                                        </span>
                                    </div>
                                    <div className="text-foreground-faint">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-foreground-muted text-sm mb-4">{role.description}</p>

                                {/* Permissions Summary */}
                                <div className="space-y-2">
                                    <p className="text-xs text-foreground-faint uppercase tracking-wider">Module Access</p>
                                    <div className="flex flex-wrap gap-1">
                                        {moduleKeys
                                            .filter(m => role.permissions[m]?.length > 0)
                                            .map(m => (
                                                <span key={m} className="text-xs px-2 py-1 bg-surface-tertiary text-foreground-secondary rounded">
                                                    {MODULES[m]}
                                                </span>
                                            ))}
                                        {moduleKeys.filter(m => role.permissions[m]?.length > 0).length === 0 && (
                                            <span className="text-xs text-foreground-faint">Dashboard only</span>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {selectedRole?.value === role.value && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <p className="text-xs text-foreground-faint uppercase tracking-wider mb-3">Detailed Permissions</p>
                                        <div className="space-y-2">
                                            {moduleKeys.map(m => (
                                                <div key={m} className="flex items-center justify-between text-sm">
                                                    <span className="text-foreground-muted">{MODULES[m]}</span>
                                                    {role.permissions[m]?.length > 0 ? (
                                                        getPermissionBadge(role.permissions[m])
                                                    ) : (
                                                        <span className="text-foreground-faint text-xs">No access</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Matrix View */}
                {viewMode === 'matrix' && (
                    <div className="glass-card overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-4 text-foreground-muted font-medium">Module</th>
                                    {ROLE_DEFINITIONS.map(role => (
                                        <th key={role.value} className="p-4 text-center">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${ROLE_COLORS[role.color]}`}>
                                                {role.label}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {moduleKeys.map(moduleKey => (
                                    <tr key={moduleKey} className="border-b border-border hover:bg-surface-secondary">
                                        <td className="p-4 text-foreground font-medium">{MODULES[moduleKey]}</td>
                                        {ROLE_DEFINITIONS.map(role => {
                                            const perms = role.permissions[moduleKey] || [];
                                            return (
                                                <td key={role.value} className="p-4 text-center">
                                                    {perms.length > 0 ? (
                                                        <div className="flex flex-wrap justify-center gap-1">
                                                            {perms.includes('view') && (
                                                                <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs" title="View">
                                                                    V
                                                                </span>
                                                            )}
                                                            {perms.includes('create') && (
                                                                <span className="w-6 h-6 rounded bg-green-500/20 text-green-400 flex items-center justify-center text-xs" title="Create">
                                                                    C
                                                                </span>
                                                            )}
                                                            {perms.includes('edit') && (
                                                                <span className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs" title="Edit">
                                                                    E
                                                                </span>
                                                            )}
                                                            {perms.includes('delete') && (
                                                                <span className="w-6 h-6 rounded bg-red-500/20 text-red-400 flex items-center justify-center text-xs" title="Delete">
                                                                    D
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-foreground-faint">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Legend */}
                        <div className="p-4 border-t border-border">
                            <p className="text-xs text-foreground-faint mb-2">Legend:</p>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">V</span>
                                    <span className="text-foreground-muted text-sm">View</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-green-500/20 text-green-400 flex items-center justify-center text-xs">C</span>
                                    <span className="text-foreground-muted text-sm">Create</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs">E</span>
                                    <span className="text-foreground-muted text-sm">Edit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-red-500/20 text-red-400 flex items-center justify-center text-xs">D</span>
                                    <span className="text-foreground-muted text-sm">Delete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="glass-card p-6 mt-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-foreground font-semibold mb-1">About Role-Based Access Control</h3>
                            <p className="text-foreground-muted text-sm">
                                Roles determine what features and data users can access in the system.
                                Each role has specific permissions for different modules.
                                To change a user's access level, update their role in the User Management section.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
