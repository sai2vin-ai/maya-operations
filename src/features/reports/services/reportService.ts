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
 * Format weighbridge entries for export (works with already-loaded data)
 */
export function formatWeighbridgeForExport(
    entries: Array<{
        entryNumber?: string;
        entryType?: string;
        vehicleNumber?: string;
        driverName?: string;
        partyName?: string;
        materialName?: string;
        grossWeight?: number;
        tareWeight?: number;
        netWeight?: number;
        unit?: string;
        status?: string;
        notes?: string;
        createdAt?: unknown;
    }>,
): Record<string, unknown>[] {
    return entries.map((e) => {
        let dateStr = '';
        if (e.createdAt) {
            const ts = e.createdAt as { toDate?: () => Date };
            const date = ts.toDate ? ts.toDate() : new Date(e.createdAt as string | number);
            dateStr = date.toLocaleString();
        }
        return {
            'Entry #': e.entryNumber || '',
            Type: e.entryType === 'RM_IN' ? 'Raw Material IN' : 'Finished Goods OUT',
            Vehicle: e.vehicleNumber || '',
            Driver: e.driverName || '',
            'Supplier / Customer': e.partyName || '',
            Material: e.materialName || '',
            'Gross (KG)': e.grossWeight ?? '',
            'Tare (KG)': e.tareWeight ?? '',
            'Net (KG)': e.netWeight ?? '',
            Status: e.status || '',
            Date: dateStr,
            Notes: e.notes || '',
        };
    });
}

/**
 * Color map for status columns: maps cell values to colors.
 * Used by both printReport (HTML) and exportToExcel (XLSX).
 */
export interface StatusColorRule {
    bg: string; // hex color for background (e.g. '#E6F4EA')
    text: string; // hex color for text (e.g. '#1E7E34')
}
export type StatusColorMap = Record<string, Record<string, StatusColorRule>>;

/** Preset color maps for common modules */
export const STATUS_COLORS = {
    inventory: {
        Status: {
            'In Stock': { bg: 'E6F4EA', text: '1E7E34' },
            OK: { bg: 'E6F4EA', text: '1E7E34' },
            'LOW STOCK': { bg: 'FFF3CD', text: 'B8860B' },
            'Low Stock': { bg: 'FFF3CD', text: 'B8860B' },
            'OUT OF STOCK': { bg: 'F8D7DA', text: 'CC0000' },
            'Out of Stock': { bg: 'F8D7DA', text: 'CC0000' },
        },
    } as StatusColorMap,
    weighbridge: {
        Status: {
            COMPLETED: { bg: 'E6F4EA', text: '1E7E34' },
            PENDING: { bg: 'FFF3CD', text: 'B8860B' },
            FIRST_WEIGHT: { bg: 'D6E9F8', text: '1A6DB0' },
            CANCELLED: { bg: 'F8D7DA', text: 'CC0000' },
        },
    } as StatusColorMap,
};

/**
 * Generate printable HTML report with optional colored status columns
 */
export function printReport(title: string, data: Record<string, unknown>[], colorMap?: StatusColorMap): void {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);

    const renderCell = (header: string, value: unknown) => {
        const strValue = String(value ?? '');
        const rule = colorMap?.[header]?.[strValue];
        if (rule) {
            return `<td style="border:1px solid #ddd;padding:6px 8px"><span style="background:#${rule.bg};color:#${rule.text};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600">${strValue}</span></td>`;
        }
        return `<td style="border:1px solid #ddd;padding:6px 8px">${strValue}</td>`;
    };

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
            <tbody>${data.map((row) => `<tr>${headers.map((h) => renderCell(h, row[h])).join('')}</tr>`).join('')}</tbody>
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
 * Export data to CSV (kept for backwards compatibility)
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
 * Export data to Excel (.xlsx) with optional colored status columns
 */
export async function exportToExcel(
    data: Record<string, unknown>[],
    filename: string,
    colorMap?: StatusColorMap,
): Promise<void> {
    if (data.length === 0) return;

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    const headers = Object.keys(data[0]);

    // Add header row with styling
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
    });

    // Add data rows
    for (const row of data) {
        const dataRow = sheet.addRow(headers.map((h) => row[h] ?? ''));
        // Apply color map
        if (colorMap) {
            dataRow.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                const strValue = String(cell.value ?? '');
                const rule = colorMap[header]?.[strValue];
                if (rule) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${rule.bg}` } };
                    cell.font = { bold: true, color: { argb: `FF${rule.text}` } };
                }
            });
        }
    }

    // Auto-fit column widths
    sheet.columns.forEach((column) => {
        let maxLength = 10;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
            const len = String(cell.value ?? '').length;
            if (len > maxLength) maxLength = len;
        });
        column.width = Math.min(maxLength + 2, 40);
    });

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
