import type { UserRole } from '../types';

// Permission types for each module
export type Permission = 'view' | 'create' | 'edit' | 'delete';

// Module definitions
export const MODULES = {
    DASHBOARD: 'Dashboard',
    USERS: 'User Management',
    DEVICES: 'Device Management',
    GATE: 'Gate Operations',
    REACTOR: 'Reactor Operations',
    INVENTORY: 'Inventory Management',
    SPARE_PARTS: 'Spare Parts',
    WEIGHBRIDGE: 'Weighbridge',
    ASSETS: 'Asset Register',
    MAINTENANCE: 'Maintenance',
    SHIFTS: 'Shift Management',
    QUALITY: 'Quality Control',
    AUDIT: 'Audit & Logs',
    REPORTS: 'Reports',
    WEBHOOKS: 'Webhooks',
    BUG_REPORTS: 'Bug Reports',
    ROLES: 'Roles & Permissions',
} as const;

export type ModuleKey = keyof typeof MODULES;

// Role permission matrix
export interface RolePermissions {
    [module: string]: Permission[];
}

export interface RoleDefinition {
    value: UserRole;
    label: string;
    description: string;
    color: string;
    permissions: RolePermissions;
}

// Complete role definitions with permissions
export const ROLE_DEFINITIONS: RoleDefinition[] = [
    {
        value: 'SUPER_ADMIN',
        label: 'Super Admin',
        description: 'Full system access with all permissions. Can manage users, devices, and all operations.',
        color: 'red',
        permissions: {
            DASHBOARD: ['view'],
            USERS: ['view', 'create', 'edit', 'delete'],
            DEVICES: ['view', 'create', 'edit', 'delete'],
            GATE: ['view', 'create', 'edit', 'delete'],
            REACTOR: ['view', 'create', 'edit', 'delete'],
            INVENTORY: ['view', 'create', 'edit', 'delete'],
            SPARE_PARTS: ['view', 'create', 'edit', 'delete'],
            WEIGHBRIDGE: ['view', 'create', 'edit', 'delete'],
            ASSETS: ['view', 'create', 'edit', 'delete'],
            MAINTENANCE: ['view', 'create', 'edit', 'delete'],
            SHIFTS: ['view', 'create', 'edit', 'delete'],
            QUALITY: ['view', 'create', 'edit', 'delete'],
            AUDIT: ['view'],
            REPORTS: ['view'],
            WEBHOOKS: ['view', 'create', 'edit', 'delete'],
            BUG_REPORTS: ['view'],
            ROLES: ['view'],
        },
    },
    {
        value: 'PLANT_MANAGER',
        label: 'Plant Manager',
        description:
            'Manages plant operations, users, and has access to all operational modules. Cannot delete records.',
        color: 'purple',
        permissions: {
            DASHBOARD: ['view'],
            USERS: ['view', 'create', 'edit'],
            DEVICES: [],
            GATE: ['view', 'create', 'edit'],
            REACTOR: ['view', 'create', 'edit'],
            INVENTORY: ['view', 'create', 'edit'],
            SPARE_PARTS: ['view', 'create', 'edit'],
            WEIGHBRIDGE: ['view', 'create', 'edit'],
            ASSETS: ['view', 'create', 'edit'],
            MAINTENANCE: ['view', 'create', 'edit'],
            SHIFTS: ['view', 'create', 'edit'],
            QUALITY: ['view', 'create', 'edit'],
            AUDIT: ['view'],
            REPORTS: [],
            WEBHOOKS: [],
            BUG_REPORTS: ['view'],
            ROLES: [],
        },
    },
    {
        value: 'SHIFT_SUPERVISOR',
        label: 'Shift Supervisor',
        description: 'Supervises shift operations including gate, reactor, and inventory activities.',
        color: 'blue',
        permissions: {
            DASHBOARD: ['view'],
            USERS: [],
            DEVICES: [],
            GATE: ['view', 'create', 'edit'],
            REACTOR: ['view', 'create', 'edit'],
            INVENTORY: ['view', 'edit'],
            SPARE_PARTS: ['view'],
            WEIGHBRIDGE: ['view'],
            ASSETS: [],
            MAINTENANCE: ['view'],
            SHIFTS: ['view'],
            QUALITY: ['view', 'create', 'edit'],
            AUDIT: [],
            REPORTS: [],
            WEBHOOKS: [],
            BUG_REPORTS: [],
            ROLES: [],
        },
    },
    {
        value: 'GATE_OPERATOR',
        label: 'Gate Operator',
        description: 'Manages vehicle entry/exit and weighbridge operations at the gate.',
        color: 'green',
        permissions: {
            DASHBOARD: ['view'],
            USERS: [],
            DEVICES: [],
            GATE: ['view', 'create', 'edit'],
            REACTOR: [],
            INVENTORY: [],
            SPARE_PARTS: [],
            WEIGHBRIDGE: ['view', 'create', 'edit'],
            ASSETS: [],
            MAINTENANCE: [],
            SHIFTS: [],
            QUALITY: [],
            AUDIT: [],
            REPORTS: [],
            WEBHOOKS: [],
            BUG_REPORTS: [],
            ROLES: [],
        },
    },
    {
        value: 'WEIGHBRIDGE_OPERATOR',
        label: 'Weighbridge Operator',
        description: 'Operates the weighbridge for material weighing and documentation.',
        color: 'cyan',
        permissions: {
            DASHBOARD: ['view'],
            USERS: [],
            DEVICES: [],
            GATE: ['view'],
            REACTOR: [],
            INVENTORY: [],
            SPARE_PARTS: [],
            WEIGHBRIDGE: ['view', 'create', 'edit'],
            ASSETS: [],
            MAINTENANCE: [],
            SHIFTS: [],
            QUALITY: [],
            AUDIT: [],
            REPORTS: [],
            WEBHOOKS: [],
            BUG_REPORTS: [],
            ROLES: [],
        },
    },
    {
        value: 'REACTOR_OPERATOR',
        label: 'Reactor Operator',
        description: 'Operates reactors, manages batches, and records pyrolysis outputs.',
        color: 'orange',
        permissions: {
            DASHBOARD: ['view'],
            USERS: [],
            DEVICES: [],
            GATE: [],
            REACTOR: ['view', 'create', 'edit'],
            INVENTORY: ['view'],
            SPARE_PARTS: ['view'],
            WEIGHBRIDGE: [],
            ASSETS: [],
            MAINTENANCE: [],
            SHIFTS: [],
            QUALITY: ['view', 'create', 'edit'],
            AUDIT: [],
            REPORTS: [],
            WEBHOOKS: [],
            BUG_REPORTS: [],
            ROLES: [],
        },
    },
    {
        value: 'STORES_KEEPER',
        label: 'Stores Keeper',
        description: 'Manages inventory, spare parts stock, and material transactions.',
        color: 'yellow',
        permissions: {
            DASHBOARD: ['view'],
            USERS: [],
            DEVICES: [],
            GATE: [],
            REACTOR: [],
            INVENTORY: ['view', 'create', 'edit'],
            SPARE_PARTS: ['view', 'create', 'edit'],
            WEIGHBRIDGE: [],
            ASSETS: [],
            MAINTENANCE: [],
            SHIFTS: [],
            QUALITY: [],
            AUDIT: [],
            REPORTS: [],
            WEBHOOKS: [],
            BUG_REPORTS: [],
            ROLES: [],
        },
    },
    {
        value: 'MAINTENANCE_TECH',
        label: 'Maintenance Technician',
        description: 'Handles equipment maintenance, spare parts usage, and repair jobs.',
        color: 'slate',
        permissions: {
            DASHBOARD: ['view'],
            USERS: [],
            DEVICES: [],
            GATE: [],
            REACTOR: [],
            INVENTORY: [],
            SPARE_PARTS: ['view'],
            WEIGHBRIDGE: [],
            ASSETS: ['view', 'create', 'edit'],
            MAINTENANCE: ['view', 'create', 'edit'],
            SHIFTS: [],
            QUALITY: [],
            AUDIT: [],
            REPORTS: [],
            WEBHOOKS: [],
            BUG_REPORTS: [],
            ROLES: [],
        },
    },
    {
        value: 'VIEWER',
        label: 'Viewer',
        description: 'Read-only access to dashboard. Cannot modify any data.',
        color: 'gray',
        permissions: {
            DASHBOARD: ['view'],
            USERS: [],
            DEVICES: [],
            GATE: [],
            REACTOR: [],
            INVENTORY: [],
            SPARE_PARTS: [],
            WEIGHBRIDGE: [],
            ASSETS: [],
            MAINTENANCE: [],
            SHIFTS: [],
            QUALITY: [],
            AUDIT: [],
            REPORTS: [],
            WEBHOOKS: [],
            BUG_REPORTS: [],
            ROLES: [],
        },
    },
];

// Helper function to get role definition
export function getRoleDefinition(role: UserRole): RoleDefinition | undefined {
    return ROLE_DEFINITIONS.find((r) => r.value === role);
}

// Helper function to check if a role has permission for a module
export function hasPermission(role: UserRole, module: ModuleKey, permission: Permission): boolean {
    const roleDef = getRoleDefinition(role);
    if (!roleDef) return false;
    return roleDef.permissions[module]?.includes(permission) || false;
}

// Helper function to get all roles that have access to a module
export function getRolesForModule(module: ModuleKey): UserRole[] {
    return ROLE_DEFINITIONS.filter((r) => r.permissions[module]?.length > 0).map((r) => r.value);
}

// Helper function to get all roles that have a specific permission for a module
export function getRolesWithPermission(module: ModuleKey, permission: Permission): UserRole[] {
    return ROLE_DEFINITIONS.filter((r) => r.permissions[module]?.includes(permission)).map((r) => r.value);
}

// Color mapping for badges
export const ROLE_COLORS: Record<string, string> = {
    red: 'bg-red-500/20 text-red-400 border-red-500/50',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    green: 'bg-green-500/20 text-green-400 border-green-500/50',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    slate: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
};
