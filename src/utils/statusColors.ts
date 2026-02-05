// Centralized status color configuration
// Use these mappings throughout the app for consistent styling

export type StatusColor = 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'purple' | 'gray' | 'cyan' | 'indigo' | 'teal';

export interface StatusConfig {
    label: string;
    color: StatusColor;
    bgClass: string;
    textClass: string;
    borderClass: string;
}

// Status color mappings
export const STATUS_COLORS: Record<StatusColor, { bgClass: string; textClass: string; borderClass: string }> = {
    green: {
        bgClass: 'bg-green-500/20',
        textClass: 'text-green-400',
        borderClass: 'border-green-500/50',
    },
    yellow: {
        bgClass: 'bg-yellow-500/20',
        textClass: 'text-yellow-400',
        borderClass: 'border-yellow-500/50',
    },
    red: {
        bgClass: 'bg-red-500/20',
        textClass: 'text-red-400',
        borderClass: 'border-red-500/50',
    },
    blue: {
        bgClass: 'bg-blue-500/20',
        textClass: 'text-blue-400',
        borderClass: 'border-blue-500/50',
    },
    orange: {
        bgClass: 'bg-orange-500/20',
        textClass: 'text-orange-400',
        borderClass: 'border-orange-500/50',
    },
    purple: {
        bgClass: 'bg-purple-500/20',
        textClass: 'text-purple-400',
        borderClass: 'border-purple-500/50',
    },
    gray: {
        bgClass: 'bg-slate-500/20',
        textClass: 'text-slate-400',
        borderClass: 'border-slate-500/50',
    },
    cyan: {
        bgClass: 'bg-cyan-500/20',
        textClass: 'text-cyan-400',
        borderClass: 'border-cyan-500/50',
    },
    indigo: {
        bgClass: 'bg-indigo-500/20',
        textClass: 'text-indigo-400',
        borderClass: 'border-indigo-500/50',
    },
    teal: {
        bgClass: 'bg-teal-500/20',
        textClass: 'text-teal-400',
        borderClass: 'border-teal-500/50',
    },
};

// User status configurations
export const USER_STATUS: Record<string, StatusConfig> = {
    ACTIVE: { label: 'Active', color: 'green', ...STATUS_COLORS.green },
    INACTIVE: { label: 'Inactive', color: 'red', ...STATUS_COLORS.red },
    SUSPENDED: { label: 'Suspended', color: 'yellow', ...STATUS_COLORS.yellow },
};

// Device status configurations
export const DEVICE_STATUS: Record<string, StatusConfig> = {
    ACTIVE: { label: 'Active', color: 'green', ...STATUS_COLORS.green },
    INACTIVE: { label: 'Inactive', color: 'red', ...STATUS_COLORS.red },
    PENDING: { label: 'Pending', color: 'yellow', ...STATUS_COLORS.yellow },
};

// Gate entry status configurations
export const GATE_ENTRY_STATUS: Record<string, StatusConfig> = {
    PENDING: { label: 'Pending', color: 'yellow', ...STATUS_COLORS.yellow },
    COMPLETED: { label: 'Completed', color: 'green', ...STATUS_COLORS.green },
    CANCELLED: { label: 'Cancelled', color: 'red', ...STATUS_COLORS.red },
};

// Batch status configurations
export const BATCH_STATUS: Record<string, StatusConfig> = {
    IN_PROGRESS: { label: 'In Progress', color: 'yellow', ...STATUS_COLORS.yellow },
    COMPLETED: { label: 'Completed', color: 'green', ...STATUS_COLORS.green },
    CANCELLED: { label: 'Cancelled', color: 'red', ...STATUS_COLORS.red },
};

// Reactor status configurations
export const REACTOR_STATUS: Record<string, StatusConfig> = {
    IDLE: { label: 'Idle', color: 'gray', ...STATUS_COLORS.gray },
    RUNNING: { label: 'Running', color: 'green', ...STATUS_COLORS.green },
    MAINTENANCE: { label: 'Maintenance', color: 'yellow', ...STATUS_COLORS.yellow },
    OFFLINE: { label: 'Offline', color: 'red', ...STATUS_COLORS.red },
};

// Weighbridge entry status configurations
export const WEIGHBRIDGE_STATUS: Record<string, StatusConfig> = {
    PENDING: { label: 'Pending', color: 'yellow', ...STATUS_COLORS.yellow },
    COMPLETED: { label: 'Completed', color: 'green', ...STATUS_COLORS.green },
    CANCELLED: { label: 'Cancelled', color: 'red', ...STATUS_COLORS.red },
};

// Inventory category configurations
export const INVENTORY_CATEGORY: Record<string, StatusConfig> = {
    RAW_MATERIAL: { label: 'Raw Material', color: 'blue', ...STATUS_COLORS.blue },
    FINISHED_PRODUCT: { label: 'Finished Product', color: 'green', ...STATUS_COLORS.green },
    CONSUMABLE: { label: 'Consumable', color: 'orange', ...STATUS_COLORS.orange },
    FUEL: { label: 'Fuel', color: 'purple', ...STATUS_COLORS.purple },
};

// User role configurations
export const USER_ROLE: Record<string, StatusConfig> = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'purple', ...STATUS_COLORS.purple },
    PLANT_MANAGER: { label: 'Plant Manager', color: 'blue', ...STATUS_COLORS.blue },
    SHIFT_SUPERVISOR: { label: 'Shift Supervisor', color: 'cyan', ...STATUS_COLORS.cyan },
    REACTOR_OPERATOR: { label: 'Reactor Operator', color: 'orange', ...STATUS_COLORS.orange },
    GATE_OPERATOR: { label: 'Gate Operator', color: 'green', ...STATUS_COLORS.green },
    WEIGHBRIDGE_OPERATOR: { label: 'Weighbridge Operator', color: 'teal', ...STATUS_COLORS.teal },
    STORES_KEEPER: { label: 'Stores Keeper', color: 'indigo', ...STATUS_COLORS.indigo },
    MAINTENANCE_TECH: { label: 'Maintenance Tech', color: 'yellow', ...STATUS_COLORS.yellow },
    VIEWER: { label: 'Viewer', color: 'gray', ...STATUS_COLORS.gray },
};

// Helper function to get status config
export function getStatusConfig(
    statusMap: Record<string, StatusConfig>,
    status: string
): StatusConfig {
    return statusMap[status] || { label: status, color: 'gray', ...STATUS_COLORS.gray };
}

// Helper function to get status badge classes
export function getStatusBadgeClasses(color: StatusColor): string {
    const colors = STATUS_COLORS[color];
    return `${colors.bgClass} ${colors.textClass}`;
}
