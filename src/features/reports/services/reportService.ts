import {
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    orderBy,
    limit,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { ReportSummary, ProductionReportItem, ReportFilters } from '../types';

/**
 * Get operations summary for a date range
 */
export async function getOperationsSummary(filters: ReportFilters): Promise<ReportSummary> {
    const startTs = Timestamp.fromDate(filters.startDate);
    const endTs = Timestamp.fromDate(filters.endDate);

    // Parallel queries for efficiency
    const [
        usersSnapshot,
        batchesSnapshot,
        gateEntriesSnapshot,
        inventorySnapshot,
    ] = await Promise.all([
        // Users
        getDocs(collection(db, 'users')),
        // Batches in date range
        getDocs(query(
            collection(db, 'batches'),
            where('createdAt', '>=', startTs),
            where('createdAt', '<=', endTs)
        )),
        // Gate entries in date range
        getDocs(query(
            collection(db, 'gateEntries'),
            where('entryTime', '>=', startTs),
            where('entryTime', '<=', endTs)
        )),
        // Inventory
        getDocs(collection(db, 'inventory')),
    ]);

    // Process users
    const users = usersSnapshot.docs.map(doc => doc.data());
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length;

    // Process batches
    const batches = batchesSnapshot.docs.map(doc => doc.data());
    const completedBatches = batches.filter(b => b.status === 'COMPLETED').length;
    const inProgressBatches = batches.filter(b => b.status === 'IN_PROGRESS').length;

    // Calculate production totals from completed batches
    let totalOil = 0;
    let totalCarbon = 0;
    let totalSteel = 0;

    batches.forEach(batch => {
        if (batch.status === 'COMPLETED' && batch.outputs) {
            batch.outputs.forEach((output: { type: string; quantity: number }) => {
                if (output.type === 'OIL') totalOil += output.quantity || 0;
                if (output.type === 'CARBON') totalCarbon += output.quantity || 0;
                if (output.type === 'STEEL') totalSteel += output.quantity || 0;
            });
        }
    });

    // Process gate entries
    const gateEntries = gateEntriesSnapshot.docs.map(doc => doc.data());
    const completedGateEntries = gateEntries.filter(e => e.status === 'COMPLETED').length;

    // Process inventory
    const inventory = inventorySnapshot.docs.map(doc => doc.data());
    const rawMaterials = inventory.filter(i => i.category === 'RAW_MATERIAL').length;
    const finishedProducts = inventory.filter(i => i.category === 'FINISHED_PRODUCT').length;
    const lowStockItems = inventory.filter(i =>
        i.currentStock !== undefined &&
        i.minimumStock !== undefined &&
        i.currentStock <= i.minimumStock
    ).length;

    return {
        totalUsers: users.length,
        activeUsers,
        totalBatches: batches.length,
        completedBatches,
        inProgressBatches,
        totalGateEntries: gateEntries.length,
        completedGateEntries,
        totalProduction: {
            oil: totalOil,
            carbon: totalCarbon,
            steel: totalSteel,
        },
        inventoryStats: {
            rawMaterials,
            finishedProducts,
            lowStockItems,
        },
    };
}

/**
 * Get production report with batch details
 */
export async function getProductionReport(filters: ReportFilters): Promise<ProductionReportItem[]> {
    const startTs = Timestamp.fromDate(filters.startDate);
    const endTs = Timestamp.fromDate(filters.endDate);

    const snapshot = await getDocs(query(
        collection(db, 'batches'),
        where('status', '==', 'COMPLETED'),
        where('endTime', '>=', startTs),
        where('endTime', '<=', endTs),
        orderBy('endTime', 'desc'),
        limit(100)
    ));

    return snapshot.docs.map(doc => {
        const data = doc.data();
        let oil = 0, carbon = 0, steel = 0;

        if (data.outputs) {
            data.outputs.forEach((output: { type: string; quantity: number }) => {
                if (output.type === 'OIL') oil = output.quantity || 0;
                if (output.type === 'CARBON') carbon = output.quantity || 0;
                if (output.type === 'STEEL') steel = output.quantity || 0;
            });
        }

        return {
            batchNumber: data.batchNumber,
            reactorId: data.reactorId,
            completedAt: data.endTime?.toDate() || new Date(),
            outputs: { oil, carbon, steel },
        };
    });
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
    if (data.length === 0) return;

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Build CSV content
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle special cases
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
                if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
                return String(value);
            }).join(',')
        )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

/**
 * Export report summary to CSV
 */
export function exportReportSummary(summary: ReportSummary, filters: ReportFilters): void {
    const data = [
        {
            'Report Type': 'Operations Summary',
            'Start Date': filters.startDate.toISOString().split('T')[0],
            'End Date': filters.endDate.toISOString().split('T')[0],
            'Total Users': summary.totalUsers,
            'Active Users': summary.activeUsers,
            'Total Batches': summary.totalBatches,
            'Completed Batches': summary.completedBatches,
            'In Progress Batches': summary.inProgressBatches,
            'Total Gate Entries': summary.totalGateEntries,
            'Completed Gate Entries': summary.completedGateEntries,
            'Oil Production (L)': summary.totalProduction.oil,
            'Carbon Production (KG)': summary.totalProduction.carbon,
            'Steel Production (KG)': summary.totalProduction.steel,
            'Raw Materials Items': summary.inventoryStats.rawMaterials,
            'Finished Products Items': summary.inventoryStats.finishedProducts,
            'Low Stock Alerts': summary.inventoryStats.lowStockItems,
        }
    ];

    exportToCSV(data, 'operations_summary');
}
