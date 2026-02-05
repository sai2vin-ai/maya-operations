export interface ReportSummary {
    totalUsers: number;
    activeUsers: number;
    totalBatches: number;
    completedBatches: number;
    inProgressBatches: number;
    totalGateEntries: number;
    completedGateEntries: number;
    totalProduction: {
        oil: number;
        carbon: number;
        steel: number;
    };
    inventoryStats: {
        rawMaterials: number;
        finishedProducts: number;
        lowStockItems: number;
    };
}

export interface ReportFilters {
    startDate: Date;
    endDate: Date;
}

export interface ProductionReportItem {
    batchNumber: string;
    reactorId: string;
    completedAt: Date;
    outputs: {
        oil: number;
        carbon: number;
        steel: number;
    };
}

export interface UserActivityItem {
    userId: string;
    userName: string;
    actionsCount: number;
    lastAction: Date;
}

export type ReportType = 'operations' | 'production' | 'users' | 'inventory';

export const REPORT_PRESETS = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
] as const;
