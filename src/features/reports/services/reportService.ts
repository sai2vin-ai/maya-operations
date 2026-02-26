import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { ReportSummary, ProductionReportItem, ReportFilters } from '../types';

/**
 * Get operations summary for a date range
 */
export async function getOperationsSummary(filters: ReportFilters): Promise<ReportSummary> {
    const startTs = Timestamp.fromDate(filters.startDate);
    const endTs = Timestamp.fromDate(filters.endDate);

    // Parallel queries for efficiency (bounded to prevent excessive reads)
    const [usersSnapshot, batchesSnapshot, gateEntriesSnapshot, inventorySnapshot] = await Promise.all([
        // Users - only count active, bounded
        getDocs(query(collection(db, 'users'), limit(1000))),
        // Batches in date range
        getDocs(
            query(
                collection(db, 'batches'),
                where('createdAt', '>=', startTs),
                where('createdAt', '<=', endTs),
                limit(1000),
            ),
        ),
        // Gate entries in date range
        getDocs(
            query(
                collection(db, 'gateEntries'),
                where('entryTime', '>=', startTs),
                where('entryTime', '<=', endTs),
                limit(1000),
            ),
        ),
        // Inventory - bounded
        getDocs(query(collection(db, 'inventory'), limit(1000))),
    ]);

    // Process users
    const users = usersSnapshot.docs.map((doc) => doc.data());
    const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;

    // Process batches
    const batches = batchesSnapshot.docs.map((doc) => doc.data());
    const completedBatches = batches.filter((b) => b.status === 'COMPLETED').length;
    const inProgressBatches = batches.filter((b) => b.status === 'IN_PROGRESS').length;

    // Calculate production totals from completed batches
    let totalOil = 0;
    let totalCarbon = 0;
    let totalSteel = 0;

    batches.forEach((batch) => {
        if (batch.status === 'COMPLETED' && batch.outputs) {
            batch.outputs.forEach((output: { materialCategory: string; quantity: number }) => {
                if (output.materialCategory === 'PYROLYSIS_OIL') totalOil += output.quantity || 0;
                if (output.materialCategory === 'CARBON_BLACK') totalCarbon += output.quantity || 0;
                if (output.materialCategory === 'SCRAP_STEEL') totalSteel += output.quantity || 0;
            });
        }
    });

    // Process gate entries
    const gateEntries = gateEntriesSnapshot.docs.map((doc) => doc.data());
    const completedGateEntries = gateEntries.filter((e) => e.status === 'COMPLETED').length;

    // Process inventory
    const inventory = inventorySnapshot.docs.map((doc) => doc.data());
    const rawMaterials = inventory.filter((i) => i.category === 'RAW_MATERIAL').length;
    const finishedProducts = inventory.filter((i) => i.category === 'FINISHED_PRODUCT').length;
    const lowStockItems = inventory.filter(
        (i) => i.currentStock !== undefined && i.minimumStock !== undefined && i.currentStock <= i.minimumStock,
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

    const snapshot = await getDocs(
        query(
            collection(db, 'batches'),
            where('status', '==', 'COMPLETED'),
            where('endTime', '>=', startTs),
            where('endTime', '<=', endTs),
            orderBy('endTime', 'desc'),
            limit(100),
        ),
    );

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        let oil = 0,
            carbon = 0,
            steel = 0;

        if (data.outputs) {
            data.outputs.forEach((output: { materialCategory: string; quantity: number }) => {
                if (output.materialCategory === 'PYROLYSIS_OIL') oil = output.quantity || 0;
                if (output.materialCategory === 'CARBON_BLACK') carbon = output.quantity || 0;
                if (output.materialCategory === 'SCRAP_STEEL') steel = output.quantity || 0;
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
 * Get gate entries for export
 */
export async function getGateEntriesForExport(filters: ReportFilters): Promise<Record<string, unknown>[]> {
    const startTs = Timestamp.fromDate(filters.startDate);
    const endTs = Timestamp.fromDate(filters.endDate);

    const snapshot = await getDocs(
        query(
            collection(db, 'gateEntries'),
            where('entryTime', '>=', startTs),
            where('entryTime', '<=', endTs),
            orderBy('entryTime', 'desc'),
            limit(500),
        ),
    );

    return snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
            'Entry Number': d.entryNumber || '',
            'Vehicle Number': d.vehicleNumber || '',
            'Driver Name': d.driverName || '',
            'Entry Type': d.entryType || '',
            Material: d.material || '',
            Status: d.status || '',
            'Entry Time': d.entryTime?.toDate?.()?.toISOString() || '',
            'Exit Time': d.exitTime?.toDate?.()?.toISOString() || '',
        };
    });
}

/**
 * Get weighbridge records for export
 */
export async function getWeighbridgeForExport(filters: ReportFilters): Promise<Record<string, unknown>[]> {
    const startTs = Timestamp.fromDate(filters.startDate);
    const endTs = Timestamp.fromDate(filters.endDate);

    const snapshot = await getDocs(
        query(
            collection(db, 'weighbridgeEntries'),
            where('createdAt', '>=', startTs),
            where('createdAt', '<=', endTs),
            orderBy('createdAt', 'desc'),
            limit(500),
        ),
    );

    return snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
            'Ticket Number': d.ticketNumber || '',
            'Vehicle Number': d.vehicleNumber || '',
            Material: d.material || '',
            'First Weight (kg)': d.firstWeight || '',
            'Second Weight (kg)': d.secondWeight || '',
            'Net Weight (kg)': d.netWeight || '',
            Status: d.status || '',
            Created: d.createdAt?.toDate?.()?.toISOString() || '',
        };
    });
}

/**
 * Get inventory items for export
 */
export async function getInventoryForExport(): Promise<Record<string, unknown>[]> {
    const snapshot = await getDocs(query(collection(db, 'inventory'), orderBy('code', 'asc'), limit(1000)));

    return snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
            'Item Code': d.code || '',
            Name: d.name || '',
            Category: d.category || '',
            'Current Stock': d.currentStock ?? 0,
            'Minimum Stock': d.minimumStock ?? 0,
            'Maximum Stock': d.maximumStock ?? '',
            Unit: d.unit || '',
            Location: d.location || '',
            Status: (d.currentStock ?? 0) <= (d.minimumStock ?? 0) ? 'LOW STOCK' : 'OK',
        };
    });
}

/**
 * Get spare parts for export
 */
export async function getSparePartsForExport(): Promise<Record<string, unknown>[]> {
    const snapshot = await getDocs(query(collection(db, 'spareParts'), orderBy('partNumber', 'asc'), limit(1000)));

    return snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
            'Part Number': d.partNumber || '',
            'File Number': d.fileNumber || '',
            Name: d.name || '',
            Category: d.category || '',
            'Sub Category': d.subCategory || '',
            Unit: d.unit || '',
            'Current Stock': d.currentStock ?? 0,
            'Minimum Stock': d.minimumStock ?? 0,
            'Unit Price': d.unitPrice ?? '',
            Location: d.location || '',
            'Used For': d.usedFor || '',
            Status: (d.currentStock ?? 0) <= (d.minimumStock ?? 0) ? 'LOW STOCK' : 'OK',
        };
    });
}

/**
 * Generate printable HTML report and open print dialog
 */
export function printReport(title: string, data: Record<string, unknown>[]): void {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);

    const html = `
        <!DOCTYPE html>
        <html><head><title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 5px; }
            p { color: #666; font-size: 12px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #f0f0f0; padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: 600; }
            td { padding: 6px 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background: #fafafa; }
            @media print { body { padding: 0; } }
        </style></head><body>
        <h1>${title}</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
            <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        </body></html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }
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
        ...data.map((row) =>
            headers
                .map((header) => {
                    const value = row[header];
                    // Handle special cases
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
                    if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
                    return String(value);
                })
                .join(','),
        ),
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
        },
    ];

    exportToCSV(data, 'operations_summary');
}
