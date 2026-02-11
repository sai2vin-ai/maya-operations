import { useState, useCallback } from 'react';
import { ROLE_DEFINITIONS, MODULES, ROLE_COLORS, type ModuleKey, type Permission } from '../../config/roles';
import { useRolePermissions } from '../../contexts/RolePermissionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSavePermissions } from '../../features/role-permissions/hooks/useRolePermissionsMutation';
import { useToast } from '../../components/ui';
import type { PermissionMatrix } from '../../config/permissionMapping';

const ALL_PERMISSIONS: Permission[] = ['view', 'create', 'edit', 'delete'];

const PERM_STYLES: Record<Permission, { bg: string; label: string }> = {
    view: { bg: 'bg-blue-500/20 text-blue-400', label: 'V' },
    create: { bg: 'bg-green-500/20 text-green-400', label: 'C' },
    edit: { bg: 'bg-yellow-500/20 text-yellow-400', label: 'E' },
    delete: { bg: 'bg-red-500/20 text-red-400', label: 'D' },
};

function deepCloneMatrix(matrix: PermissionMatrix): PermissionMatrix {
    const clone: PermissionMatrix = {};
    for (const [role, modules] of Object.entries(matrix)) {
        clone[role] = {};
        for (const [mod, perms] of Object.entries(modules)) {
            clone[role][mod] = [...perms];
        }
    }
    return clone;
}

export default function RolesPermissionsTab() {
    const { matrix, isCustomized, lastUpdated } = useRolePermissions();
    const { userData, currentUser } = useAuth();
    const { mutateAsync: savePermissions, isPending: isSaving } = useSavePermissions();
    const toast = useToast();

    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
    const [isEditing, setIsEditing] = useState(false);
    const [editMatrix, setEditMatrix] = useState<PermissionMatrix>({});

    const moduleKeys = Object.keys(MODULES) as ModuleKey[];
    const isSuperAdmin = userData?.role === 'SUPER_ADMIN';

    const getPermsForRole = useCallback(
        (roleValue: string, moduleKey: string): string[] => {
            if (roleValue === 'SUPER_ADMIN') {
                const roleDef = ROLE_DEFINITIONS.find((r) => r.value === 'SUPER_ADMIN');
                return roleDef?.permissions[moduleKey] || [];
            }
            const source = isEditing ? editMatrix : matrix;
            return source[roleValue]?.[moduleKey] || [];
        },
        [isEditing, editMatrix, matrix],
    );

    const handleStartEdit = () => {
        setEditMatrix(deepCloneMatrix(matrix));
        setViewMode('matrix');
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditMatrix({});
    };

    const handleTogglePermission = (roleValue: string, moduleKey: string, perm: Permission) => {
        if (roleValue === 'SUPER_ADMIN') return;
        if (moduleKey === 'DASHBOARD' && perm === 'view') return;

        setEditMatrix((prev) => {
            const clone = deepCloneMatrix(prev);
            const current = clone[roleValue]?.[moduleKey] || [];

            if (!clone[roleValue]) clone[roleValue] = {};

            if (current.includes(perm)) {
                clone[roleValue][moduleKey] = current.filter((p) => p !== perm);
            } else {
                clone[roleValue][moduleKey] = [...current, perm];
            }

            return clone;
        });
    };

    const handleSave = async () => {
        if (!currentUser?.uid) return;

        try {
            await savePermissions({
                matrix: editMatrix,
                callerRole: userData?.role,
                callerUid: currentUser.uid,
            });
            toast.success('Permissions updated successfully');
            setIsEditing(false);
            setEditMatrix({});
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save permissions');
        }
    };

    const getPermissionBadge = (permissions: string[]) => {
        if (permissions.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-1">
                {permissions.map((p) => (
                    <span key={p} className={`text-xs px-2 py-0.5 rounded ${PERM_STYLES[p as Permission]?.bg || ''}`}>
                        {p}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div>
            {/* View Toggle + Edit Button */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => !isEditing && setViewMode('cards')}
                    disabled={isEditing}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'cards'
                            ? 'bg-blue-600 text-white'
                            : 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-hover'
                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                <div className="ml-auto flex items-center gap-3">
                    {isCustomized && lastUpdated && (
                        <span className="text-xs text-foreground-faint">
                            Last saved: {new Date(lastUpdated).toLocaleDateString()}
                        </span>
                    )}
                    <span className="text-sm text-foreground-faint">{ROLE_DEFINITIONS.length} roles defined</span>
                    {isSuperAdmin && !isEditing && (
                        <button onClick={handleStartEdit} className="btn-secondary text-sm">
                            Edit Permissions
                        </button>
                    )}
                </div>
            </div>

            {/* Cards View */}
            {viewMode === 'cards' && !isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ROLE_DEFINITIONS.map((role) => {
                        const rolePerms =
                            role.value === 'SUPER_ADMIN' ? role.permissions : matrix[role.value] || role.permissions;

                        return (
                            <div
                                key={role.value}
                                className={`glass-card p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                                    selectedRole === role.value ? 'ring-2 ring-blue-500' : ''
                                }`}
                                onClick={() => setSelectedRole(selectedRole === role.value ? null : role.value)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${ROLE_COLORS[role.color]}`}
                                    >
                                        {role.label}
                                    </span>
                                    <svg
                                        className="w-5 h-5 text-foreground-faint"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                    </svg>
                                </div>

                                <p className="text-foreground-muted text-sm mb-4">{role.description}</p>

                                <div className="space-y-2">
                                    <p className="text-xs text-foreground-faint uppercase tracking-wider">
                                        Module Access
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {moduleKeys
                                            .filter((m) => (rolePerms[m]?.length || 0) > 0)
                                            .map((m) => (
                                                <span
                                                    key={m}
                                                    className="text-xs px-2 py-1 bg-surface-tertiary text-foreground-secondary rounded"
                                                >
                                                    {MODULES[m]}
                                                </span>
                                            ))}
                                        {moduleKeys.filter((m) => (rolePerms[m]?.length || 0) > 0).length === 0 && (
                                            <span className="text-xs text-foreground-faint">Dashboard only</span>
                                        )}
                                    </div>
                                </div>

                                {selectedRole === role.value && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <p className="text-xs text-foreground-faint uppercase tracking-wider mb-3">
                                            Detailed Permissions
                                        </p>
                                        <div className="space-y-2">
                                            {moduleKeys.map((m) => (
                                                <div key={m} className="flex items-center justify-between text-sm">
                                                    <span className="text-foreground-muted">{MODULES[m]}</span>
                                                    {(rolePerms[m]?.length || 0) > 0 ? (
                                                        getPermissionBadge(rolePerms[m])
                                                    ) : (
                                                        <span className="text-foreground-faint text-xs">No access</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Matrix View */}
            {viewMode === 'matrix' && (
                <div className="glass-card overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-4 text-foreground-muted font-medium">Module</th>
                                {ROLE_DEFINITIONS.map((role) => (
                                    <th key={role.value} className="p-4 text-center">
                                        <span
                                            className={`inline-block px-2 py-1 rounded text-xs font-medium border ${ROLE_COLORS[role.color]} ${
                                                isEditing && role.value === 'SUPER_ADMIN' ? 'opacity-50' : ''
                                            }`}
                                        >
                                            {role.label}
                                        </span>
                                        {isEditing && role.value === 'SUPER_ADMIN' && (
                                            <div className="text-[10px] text-foreground-faint mt-1">locked</div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {moduleKeys.map((moduleKey) => (
                                <tr key={moduleKey} className="border-b border-border hover:bg-surface-secondary">
                                    <td className="p-4 text-foreground font-medium">{MODULES[moduleKey]}</td>
                                    {ROLE_DEFINITIONS.map((role) => {
                                        const perms = getPermsForRole(role.value, moduleKey);
                                        const isLocked = role.value === 'SUPER_ADMIN';

                                        if (!isEditing) {
                                            return (
                                                <td key={role.value} className="p-4 text-center">
                                                    {perms.length > 0 ? (
                                                        <div className="flex flex-wrap justify-center gap-1">
                                                            {ALL_PERMISSIONS.filter((p) => perms.includes(p)).map(
                                                                (p) => (
                                                                    <span
                                                                        key={p}
                                                                        className={`w-6 h-6 rounded ${PERM_STYLES[p].bg} flex items-center justify-center text-xs`}
                                                                        title={p}
                                                                    >
                                                                        {PERM_STYLES[p].label}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-foreground-faint">-</span>
                                                    )}
                                                </td>
                                            );
                                        }

                                        return (
                                            <td
                                                key={role.value}
                                                className={`p-2 text-center ${isLocked ? 'opacity-40' : ''}`}
                                            >
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {ALL_PERMISSIONS.map((p) => {
                                                        const active = perms.includes(p);
                                                        const isDashView = moduleKey === 'DASHBOARD' && p === 'view';
                                                        const cellLocked = isLocked || isDashView;

                                                        return (
                                                            <button
                                                                key={p}
                                                                disabled={cellLocked}
                                                                onClick={() =>
                                                                    handleTogglePermission(role.value, moduleKey, p)
                                                                }
                                                                className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                                                                    active
                                                                        ? PERM_STYLES[p].bg
                                                                        : 'bg-surface-tertiary/50 text-foreground-faint'
                                                                } ${
                                                                    cellLocked
                                                                        ? 'cursor-not-allowed'
                                                                        : 'cursor-pointer hover:ring-1 hover:ring-foreground-faint'
                                                                } flex items-center justify-center`}
                                                                title={`${p}${cellLocked ? ' (locked)' : active ? ' (click to remove)' : ' (click to add)'}`}
                                                            >
                                                                {PERM_STYLES[p].label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
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
                            {ALL_PERMISSIONS.map((p) => (
                                <div key={p} className="flex items-center gap-2">
                                    <span
                                        className={`w-6 h-6 rounded ${PERM_STYLES[p].bg} flex items-center justify-center text-xs`}
                                    >
                                        {PERM_STYLES[p].label}
                                    </span>
                                    <span className="text-foreground-muted text-sm capitalize">{p}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Action Bar */}
            {isEditing && (
                <div className="sticky bottom-0 mt-4 p-4 glass-card border-t border-border flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">
                        Editing permissions — SUPER_ADMIN is always locked with full access
                    </span>
                    <div className="flex gap-3">
                        <button onClick={handleCancelEdit} disabled={isSaving} className="btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

            {/* Info Card */}
            {!isEditing && (
                <div className="glass-card p-6 mt-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg
                                className="w-5 h-5 text-blue-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-foreground font-semibold mb-1">About Role-Based Access Control</h3>
                            <p className="text-foreground-muted text-sm">
                                Roles determine what features and data users can access in the system.
                                {isSuperAdmin
                                    ? ' Click "Edit Permissions" to modify the permission matrix. Changes take effect immediately for all users.'
                                    : " To change a user's access level, update their role in the User Management section."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
