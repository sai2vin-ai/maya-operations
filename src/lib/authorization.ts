import type { UserRole } from '../types';

/**
 * Role hierarchy and permission mapping for service-level authorization.
 * This complements the client-side ProtectedRoute checks.
 *
 * Supports dynamic permissions loaded from Firestore at runtime.
 * Falls back to static defaults when no dynamic permissions are set.
 * SUPER_ADMIN always uses static permissions (full access, non-configurable).
 */

type PermissionAction =
    | 'users:create'
    | 'users:update'
    | 'users:delete'
    | 'devices:manage'
    | 'gate:create'
    | 'gate:update'
    | 'gate:cancel'
    | 'batch:create'
    | 'batch:complete_step'
    | 'batch:cancel'
    | 'inventory:create'
    | 'inventory:update'
    | 'inventory:transact'
    | 'weighbridge:create'
    | 'weighbridge:update'
    | 'webhooks:manage'
    | 'spare_parts:create'
    | 'spare_parts:update'
    | 'spare_parts:transact'
    | 'bug_reports:create'
    | 'bug_reports:manage'
    | 'maintenance:create'
    | 'maintenance:update'
    | 'asset_register:create'
    | 'asset_register:update';

/** Static defaults — used as fallback when dynamic permissions are not loaded. */
const STATIC_ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
    SUPER_ADMIN: [
        'users:create',
        'users:update',
        'users:delete',
        'devices:manage',
        'gate:create',
        'gate:update',
        'gate:cancel',
        'batch:create',
        'batch:complete_step',
        'batch:cancel',
        'inventory:create',
        'inventory:update',
        'inventory:transact',
        'weighbridge:create',
        'weighbridge:update',
        'webhooks:manage',
        'spare_parts:create',
        'spare_parts:update',
        'spare_parts:transact',
        'bug_reports:create',
        'bug_reports:manage',
        'maintenance:create',
        'maintenance:update',
        'asset_register:create',
        'asset_register:update',
    ],
    PLANT_MANAGER: [
        'users:create',
        'users:update',
        'gate:create',
        'gate:update',
        'gate:cancel',
        'batch:create',
        'batch:complete_step',
        'batch:cancel',
        'inventory:create',
        'inventory:update',
        'inventory:transact',
        'weighbridge:create',
        'weighbridge:update',
        'spare_parts:create',
        'spare_parts:update',
        'spare_parts:transact',
        'bug_reports:create',
        'bug_reports:manage',
        'maintenance:create',
        'maintenance:update',
        'asset_register:create',
        'asset_register:update',
    ],
    SHIFT_SUPERVISOR: [
        'gate:create',
        'gate:update',
        'gate:cancel',
        'batch:create',
        'batch:complete_step',
        'batch:cancel',
        'weighbridge:create',
        'weighbridge:update',
        'bug_reports:create',
    ],
    GATE_OPERATOR: ['gate:create', 'gate:update', 'weighbridge:create', 'weighbridge:update', 'bug_reports:create'],
    WEIGHBRIDGE_OPERATOR: ['weighbridge:create', 'weighbridge:update', 'bug_reports:create'],
    REACTOR_OPERATOR: ['batch:create', 'batch:complete_step', 'bug_reports:create'],
    STORES_KEEPER: [
        'inventory:create',
        'inventory:update',
        'inventory:transact',
        'spare_parts:create',
        'spare_parts:update',
        'spare_parts:transact',
        'bug_reports:create',
    ],
    MAINTENANCE_TECH: [
        'spare_parts:transact',
        'bug_reports:create',
        'maintenance:create',
        'maintenance:update',
        'asset_register:create',
        'asset_register:update',
    ],
    VIEWER: ['bug_reports:create'],
};

// --- Dynamic permission support ---

/** Module-level cache populated by RolePermissionsProvider from Firestore. */
let dynamicPermissions: Record<string, PermissionAction[]> | null = null;

/**
 * Inject dynamic permissions derived from the Firestore matrix.
 * Called by RolePermissionsProvider on data load/change.
 * Pass null to revert to static defaults.
 */
export function setDynamicPermissions(permissions: Record<string, PermissionAction[]> | null): void {
    dynamicPermissions = permissions;
}

/**
 * Get the effective permission list for a role.
 * SUPER_ADMIN always uses static (full access, non-configurable).
 */
function getEffectivePermissions(role: UserRole): PermissionAction[] {
    if (role === 'SUPER_ADMIN') {
        return STATIC_ROLE_PERMISSIONS.SUPER_ADMIN;
    }
    return dynamicPermissions?.[role] ?? STATIC_ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if a role has permission for a given action
 */
export function hasPermission(role: UserRole, action: PermissionAction): boolean {
    return getEffectivePermissions(role).includes(action);
}

/**
 * Assert that a user role is authorized for an action.
 * Throws an error if not authorized.
 */
export function assertAuthorized(role: UserRole | undefined, action: PermissionAction): void {
    if (!role) {
        throw new Error('Authentication required');
    }
    if (!hasPermission(role, action)) {
        throw new Error(`Unauthorized: role '${role}' cannot perform '${action}'`);
    }
}

export { STATIC_ROLE_PERMISSIONS };
export type { PermissionAction };
