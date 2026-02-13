import type { Timestamp } from 'firebase/firestore';

export interface AuditLog {
    id: string;
    action: string;
    collection: string;
    documentId: string;
    userId?: string;
    data?: Record<string, unknown>;
    timestamp: Timestamp;
}

export interface AuditFilters {
    collection?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    searchQuery?: string;
}

// Available collections that are audited
export const AUDIT_COLLECTIONS = [
    { value: '', label: 'All Collections' },
    { value: 'gateEntries', label: 'Gate Entries' },
    { value: 'batches', label: 'Batches' },
    { value: 'users', label: 'Users' },
    { value: 'assets', label: 'Assets' },
    { value: 'reactors', label: 'Reactors (legacy)' },
    { value: 'devices', label: 'Devices' },
] as const;

// Known action types
export const AUDIT_ACTIONS = [
    { value: '', label: 'All Actions' },
    { value: 'CREATED', label: 'Created' },
    { value: 'UPDATED', label: 'Updated' },
    { value: 'STATUS', label: 'Status Changes' },
    { value: 'ROLE', label: 'Role Changes' },
    { value: 'STEP', label: 'Step Completed' },
    { value: 'REVOKED', label: 'Revoked' },
] as const;

// Helper to get human-readable action name
export function getActionLabel(action: string): string {
    const actionMap: Record<string, string> = {
        // Gate entries
        GATE_ENTRY_CREATED: 'Gate Entry Created',
        GATE_ENTRY_PENDING: 'Gate Entry Pending',
        GATE_ENTRY_COMPLETED: 'Gate Entry Completed',
        GATE_ENTRY_CANCELLED: 'Gate Entry Cancelled',
        // Batches
        BATCH_CREATED: 'Batch Created',
        BATCH_IN_PROGRESS: 'Batch In Progress',
        BATCH_COMPLETED: 'Batch Completed',
        BATCH_STEP_COMPLETED: 'Batch Step Completed',
        // Users
        USER_CREATED: 'User Created',
        USER_ACTIVE: 'User Activated',
        USER_INACTIVE: 'User Deactivated',
        USER_ROLE_CHANGED: 'User Role Changed',
        // Reactors / Assets
        REACTOR_IDLE: 'Reactor Idle',
        REACTOR_IN_BATCH: 'Reactor In Batch',
        REACTOR_MAINTENANCE: 'Reactor Maintenance',
        REACTOR_OFFLINE: 'Reactor Offline',
        ASSET_OPERATIONAL: 'Asset Operational',
        ASSET_UNDER_MAINTENANCE: 'Asset Under Maintenance',
        ASSET_BREAKDOWN: 'Asset Breakdown',
        ASSET_DECOMMISSIONED: 'Asset Decommissioned',
        // Devices
        DEVICE_REVOKED: 'Device Revoked',
    };

    return actionMap[action] || action.replace(/_/g, ' ');
}

// Helper to get collection label
export function getCollectionLabel(collection: string): string {
    const collectionMap: Record<string, string> = {
        gateEntries: 'Gate Entries',
        batches: 'Batches',
        users: 'Users',
        assets: 'Assets',
        reactors: 'Reactors (legacy)',
        devices: 'Devices',
    };

    return collectionMap[collection] || collection;
}

// Helper to get action color
export function getActionColor(action: string): string {
    if (action.includes('CREATED')) return 'text-green-400';
    if (action.includes('COMPLETED')) return 'text-blue-400';
    if (action.includes('INACTIVE') || action.includes('REVOKED')) return 'text-red-400';
    if (action.includes('ROLE') || action.includes('STATUS')) return 'text-yellow-400';
    if (action.includes('STEP')) return 'text-purple-400';
    return 'text-slate-400';
}
