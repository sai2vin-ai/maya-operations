import type { UserRole } from '../types';

/**
 * Role hierarchy and permission mapping for service-level authorization.
 * This complements the client-side ProtectedRoute checks.
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
    | 'bug_reports:manage';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
    SUPER_ADMIN: [
        'users:create', 'users:update', 'users:delete',
        'devices:manage',
        'gate:create', 'gate:update', 'gate:cancel',
        'batch:create', 'batch:complete_step', 'batch:cancel',
        'inventory:create', 'inventory:update', 'inventory:transact',
        'weighbridge:create', 'weighbridge:update',
        'webhooks:manage',
        'spare_parts:create', 'spare_parts:update', 'spare_parts:transact',
        'bug_reports:create', 'bug_reports:manage',
    ],
    PLANT_MANAGER: [
        'users:create', 'users:update',
        'gate:create', 'gate:update', 'gate:cancel',
        'batch:create', 'batch:complete_step', 'batch:cancel',
        'inventory:create', 'inventory:update', 'inventory:transact',
        'weighbridge:create', 'weighbridge:update',
        'spare_parts:create', 'spare_parts:update', 'spare_parts:transact',
        'bug_reports:create', 'bug_reports:manage',
    ],
    SHIFT_SUPERVISOR: [
        'gate:create', 'gate:update', 'gate:cancel',
        'batch:create', 'batch:complete_step', 'batch:cancel',
        'weighbridge:create', 'weighbridge:update',
        'bug_reports:create',
    ],
    GATE_OPERATOR: [
        'gate:create', 'gate:update',
        'weighbridge:create', 'weighbridge:update',
        'bug_reports:create',
    ],
    WEIGHBRIDGE_OPERATOR: [
        'weighbridge:create', 'weighbridge:update',
        'bug_reports:create',
    ],
    REACTOR_OPERATOR: [
        'batch:create', 'batch:complete_step',
        'bug_reports:create',
    ],
    STORES_KEEPER: [
        'inventory:create', 'inventory:update', 'inventory:transact',
        'spare_parts:create', 'spare_parts:update', 'spare_parts:transact',
        'bug_reports:create',
    ],
    MAINTENANCE_TECH: [
        'spare_parts:transact',
        'bug_reports:create',
    ],
    VIEWER: [
        'bug_reports:create',
    ],
};

/**
 * Check if a role has permission for a given action
 */
export function hasPermission(role: UserRole, action: PermissionAction): boolean {
    return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
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

export type { PermissionAction };
