import type { PermissionAction } from '../lib/authorization';
import type { Permission } from './roles';
import { ROLE_DEFINITIONS } from './roles';

/**
 * Maps each (module, permission) pair to the service-level PermissionActions it grants.
 * Only modules with write operations are listed — DASHBOARD and ROLES are view-only.
 */
export const MODULE_ACTION_MAP: Record<string, Partial<Record<Permission, PermissionAction[]>>> = {
    USERS: {
        create: ['users:create'],
        edit: ['users:update'],
        delete: ['users:delete'],
    },
    DEVICES: {
        create: ['devices:manage'],
        edit: ['devices:manage'],
        delete: ['devices:manage'],
    },
    GATE: {
        create: ['gate:create'],
        edit: ['gate:update', 'gate:cancel'],
    },
    REACTOR: {
        create: ['batch:create'],
        edit: ['batch:complete_step', 'batch:cancel'],
    },
    INVENTORY: {
        create: ['inventory:create'],
        edit: ['inventory:update', 'inventory:transact'],
    },
    WEIGHBRIDGE: {
        create: ['weighbridge:create'],
        edit: ['weighbridge:update'],
    },
    SPARE_PARTS: {
        create: ['spare_parts:create'],
        edit: ['spare_parts:update', 'spare_parts:transact'],
    },
    MAINTENANCE: {
        create: ['maintenance:create', 'asset_register:create'],
        edit: ['maintenance:update', 'asset_register:update'],
    },
    QUALITY: {
        create: ['quality:create'],
        edit: ['quality:update'],
    },
    SHIFTS: {
        create: ['shifts:create'],
        edit: ['shifts:update'],
    },
};

/** Actions granted to every authenticated user regardless of the matrix. */
export const ALWAYS_GRANTED_ACTIONS: PermissionAction[] = ['bug_reports:create'];

/** Actions that only SUPER_ADMIN can have — never derived from the matrix. */
export const SUPER_ADMIN_ONLY_ACTIONS: PermissionAction[] = ['webhooks:manage', 'bug_reports:manage'];

export type PermissionMatrix = Record<string, Record<string, string[]>>;

/**
 * Derives a flat PermissionAction[] from a single role's module permission map.
 */
export function deriveActionsFromMatrix(modulePermissions: Record<string, string[]>): PermissionAction[] {
    const actions = new Set<PermissionAction>(ALWAYS_GRANTED_ACTIONS);

    for (const [moduleKey, permissions] of Object.entries(modulePermissions)) {
        const moduleMap = MODULE_ACTION_MAP[moduleKey];
        if (!moduleMap) continue;

        for (const perm of permissions) {
            const mapped = moduleMap[perm as Permission];
            if (mapped) {
                for (const action of mapped) {
                    actions.add(action);
                }
            }
        }
    }

    return Array.from(actions);
}

/**
 * Builds the default VCDE matrix from static ROLE_DEFINITIONS.
 * Excludes SUPER_ADMIN (it always has full access and is not configurable).
 */
export function buildDefaultMatrix(): PermissionMatrix {
    const matrix: PermissionMatrix = {};

    for (const roleDef of ROLE_DEFINITIONS) {
        if (roleDef.value === 'SUPER_ADMIN') continue;
        const perms: Record<string, string[]> = {};
        for (const [mod, modPerms] of Object.entries(roleDef.permissions)) {
            perms[mod] = [...modPerms];
        }
        matrix[roleDef.value] = perms;
    }

    return matrix;
}
