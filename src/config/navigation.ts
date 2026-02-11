import type { UserRole } from '../types';

export interface NavItem {
    id: string;
    label: string;
    path: string;
    icon: string;
    roles: UserRole[];
    gradient?: string;
}

export interface NavGroup {
    id: string;
    label: string;
    items: NavItem[];
}

/**
 * All navigation items with role-based access.
 * Flat list used by DashboardPage module cards and anywhere grouping isn't needed.
 */
export const NAV_ITEMS: NavItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        roles: [
            'SUPER_ADMIN',
            'PLANT_MANAGER',
            'SHIFT_SUPERVISOR',
            'GATE_OPERATOR',
            'WEIGHBRIDGE_OPERATOR',
            'REACTOR_OPERATOR',
            'STORES_KEEPER',
            'MAINTENANCE_TECH',
            'VIEWER',
        ],
        gradient: 'from-blue-500 to-indigo-600',
    },
    {
        id: 'gate',
        label: 'Gate Operations',
        path: '/gate',
        icon: 'gate',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'GATE_OPERATOR'],
        gradient: 'from-green-500 to-green-600',
    },
    {
        id: 'weighbridge',
        label: 'Weighbridge',
        path: '/weighbridge',
        icon: 'weighbridge',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'WEIGHBRIDGE_OPERATOR', 'GATE_OPERATOR'],
        gradient: 'from-teal-500 to-teal-600',
    },
    {
        id: 'reactor',
        label: 'Reactor Dashboard',
        path: '/reactor',
        icon: 'reactor',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR'],
        gradient: 'from-orange-500 to-orange-600',
    },
    {
        id: 'reactor/output',
        label: 'Reactor Output',
        path: '/reactor/output',
        icon: 'output',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR'],
        gradient: 'from-amber-500 to-amber-600',
    },
    {
        id: 'reactor/analytics',
        label: 'Batch Analytics',
        path: '/reactor/analytics',
        icon: 'analytics',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR'],
        gradient: 'from-pink-500 to-pink-600',
    },
    {
        id: 'quality',
        label: 'Quality Control',
        path: '/quality',
        icon: 'quality',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR'],
        gradient: 'from-lime-500 to-lime-600',
    },
    {
        id: 'inventory',
        label: 'Inventory',
        path: '/inventory',
        icon: 'inventory',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER'],
        gradient: 'from-cyan-500 to-cyan-600',
    },
    {
        id: 'spare-parts',
        label: 'Store',
        path: '/spare-parts',
        icon: 'store',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER', 'MAINTENANCE_TECH'],
        gradient: 'from-indigo-500 to-indigo-600',
    },
    {
        id: 'asset-register',
        label: 'Asset Register',
        path: '/assets',
        icon: 'asset',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'MAINTENANCE_TECH'],
        gradient: 'from-emerald-500 to-teal-600',
    },
    {
        id: 'maintenance',
        label: 'Work Orders',
        path: '/maintenance',
        icon: 'maintenance',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'MAINTENANCE_TECH'],
        gradient: 'from-yellow-500 to-yellow-600',
    },
    {
        id: 'shifts',
        label: 'Shift Management',
        path: '/shifts',
        icon: 'shifts',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR'],
        gradient: 'from-emerald-500 to-emerald-600',
    },
    {
        id: 'users',
        label: 'User Management',
        path: '/users',
        icon: 'users',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER'],
        gradient: 'from-blue-500 to-blue-600',
    },
    {
        id: 'devices',
        label: 'Device Management',
        path: '/devices',
        icon: 'devices',
        roles: ['SUPER_ADMIN'],
        gradient: 'from-purple-500 to-purple-600',
    },
    {
        id: 'audit',
        label: 'Audit Logs',
        path: '/audit',
        icon: 'audit',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER'],
        gradient: 'from-slate-500 to-slate-600',
    },
    {
        id: 'activity',
        label: 'User Activity',
        path: '/activity',
        icon: 'activity',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER'],
        gradient: 'from-sky-500 to-sky-600',
    },
    {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        icon: 'reports',
        roles: ['SUPER_ADMIN'],
        gradient: 'from-red-500 to-red-600',
    },
    {
        id: 'workflows',
        label: 'Workflows',
        path: '/workflows',
        icon: 'workflows',
        roles: [
            'SUPER_ADMIN',
            'PLANT_MANAGER',
            'SHIFT_SUPERVISOR',
            'GATE_OPERATOR',
            'WEIGHBRIDGE_OPERATOR',
            'REACTOR_OPERATOR',
            'STORES_KEEPER',
            'MAINTENANCE_TECH',
            'VIEWER',
        ],
        gradient: 'from-violet-500 to-purple-600',
    },
    {
        id: 'bug-reports',
        label: 'Bug Reports',
        path: '/bug-reports',
        icon: 'bug',
        roles: ['SUPER_ADMIN', 'PLANT_MANAGER'],
        gradient: 'from-rose-500 to-rose-600',
    },
    {
        id: 'settings',
        label: 'Settings',
        path: '/settings',
        icon: 'settings',
        roles: ['SUPER_ADMIN'],
        gradient: 'from-slate-500 to-gray-600',
    },
];

/**
 * Grouped navigation structure for the sidebar.
 * Dashboard is ungrouped (rendered first), then grouped sections follow.
 */
export const NAV_GROUPS: NavGroup[] = [
    {
        id: 'operations',
        label: 'Operations',
        items: [
            NAV_ITEMS.find((i) => i.id === 'gate')!,
            NAV_ITEMS.find((i) => i.id === 'weighbridge')!,
            NAV_ITEMS.find((i) => i.id === 'reactor')!,
            NAV_ITEMS.find((i) => i.id === 'reactor/output')!,
            NAV_ITEMS.find((i) => i.id === 'reactor/analytics')!,
            NAV_ITEMS.find((i) => i.id === 'quality')!,
        ],
    },
    {
        id: 'inventory-stores',
        label: 'Inventory & Stores',
        items: [NAV_ITEMS.find((i) => i.id === 'inventory')!, NAV_ITEMS.find((i) => i.id === 'spare-parts')!],
    },
    {
        id: 'assets-maintenance',
        label: 'Assets & Maintenance',
        items: [
            NAV_ITEMS.find((i) => i.id === 'asset-register')!,
            NAV_ITEMS.find((i) => i.id === 'maintenance')!,
            NAV_ITEMS.find((i) => i.id === 'shifts')!,
        ],
    },
    {
        id: 'administration',
        label: 'Administration',
        items: [
            NAV_ITEMS.find((i) => i.id === 'users')!,
            NAV_ITEMS.find((i) => i.id === 'devices')!,
            NAV_ITEMS.find((i) => i.id === 'audit')!,
            NAV_ITEMS.find((i) => i.id === 'activity')!,
            NAV_ITEMS.find((i) => i.id === 'reports')!,
            NAV_ITEMS.find((i) => i.id === 'settings')!,
        ],
    },
    {
        id: 'support',
        label: 'Support',
        items: [NAV_ITEMS.find((i) => i.id === 'workflows')!, NAV_ITEMS.find((i) => i.id === 'bug-reports')!],
    },
];

/** Dashboard item shown above all groups. */
export const DASHBOARD_NAV_ITEM = NAV_ITEMS.find((i) => i.id === 'dashboard')!;

/**
 * Get navigation items filtered by user role (flat list).
 */
export function getNavItemsForRole(role: UserRole): NavItem[] {
    return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/**
 * Get grouped navigation filtered by user role.
 * Empty groups are excluded.
 */
export function getNavGroupsForRole(role: UserRole): NavGroup[] {
    return NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.roles.includes(role)),
    })).filter((group) => group.items.length > 0);
}

/**
 * Icon name to SVG path mapping for sidebar icons.
 */
export const NAV_ICON_PATHS: Record<string, { path: string; viewBox?: string }> = {
    dashboard: {
        path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    weighbridge: {
        path: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    },
    gate: { path: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    reactor: {
        path: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    },
    output: {
        path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    inventory: { path: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    store: {
        path: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
    users: {
        path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
    devices: {
        path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    },
    shifts: { path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    analytics: {
        path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    quality: { path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    asset: {
        path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    maintenance: {
        path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    },
    audit: {
        path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    },
    activity: { path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    reports: {
        path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    workflows: {
        path: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    bug: {
        path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    },
    guide: {
        path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    'report-bug': {
        path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    },
    settings: {
        path: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    },
};
