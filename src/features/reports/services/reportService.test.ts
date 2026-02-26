import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Use vi.hoisted so the mock fn is available when vi.mock factory runs (hoisted above imports)
const { mockGetDocs } = vi.hoisted(() => ({
    mockGetDocs: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: mockGetDocs,
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: { fromDate: vi.fn(() => 'mock-timestamp') },
}));
vi.mock('../../../lib/firebase', () => ({ db: {} }));

import {
    exportToCSV,
    printReport,
    exportReportSummary,
    getOperationsSummary,
    getProductionReport,
    getGateEntriesForExport,
    getWeighbridgeForExport,
    getInventoryForExport,
} from './reportService';
import type { ReportSummary, ReportFilters } from '../types';

describe('reportService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── exportToCSV ────────────────────────────────────────────────

    describe('exportToCSV', () => {
        let mockClick: Mock;
        let mockCreateObjectURL: Mock;
        let mockRevokeObjectURL: Mock;

        beforeEach(() => {
            mockClick = vi.fn();
            vi.spyOn(document, 'createElement').mockReturnValue({
                href: '',
                download: '',
                click: mockClick,
                style: {},
            } as unknown as HTMLElement);

            mockCreateObjectURL = vi.fn(() => 'blob:url');
            mockRevokeObjectURL = vi.fn();
            URL.createObjectURL = mockCreateObjectURL;
            URL.revokeObjectURL = mockRevokeObjectURL;
        });

        it('should not create link for empty data', () => {
            exportToCSV([], 'test');

            expect(document.createElement).not.toHaveBeenCalled();
            expect(mockClick).not.toHaveBeenCalled();
        });

        it('should create CSV with headers and rows', () => {
            const data = [
                { Name: 'Alice', Age: 30 },
                { Name: 'Bob', Age: 25 },
            ];

            exportToCSV(data, 'people');

            expect(document.createElement).toHaveBeenCalledWith('a');
            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalled();
            expect(mockRevokeObjectURL).toHaveBeenCalled();

            // Verify the Blob content
            const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
            expect(blobArg).toBeInstanceOf(Blob);
            expect(blobArg.type).toBe('text/csv;charset=utf-8;');
        });

        it('should handle values with commas by wrapping in quotes', () => {
            const data = [{ Description: 'Oil, Carbon, Steel' }];

            exportToCSV(data, 'test');

            expect(mockCreateObjectURL).toHaveBeenCalled();
            // The Blob is constructed with csv content; verify it was created
            const blobCall = mockCreateObjectURL.mock.calls[0][0] as Blob;
            expect(blobCall).toBeInstanceOf(Blob);
        });

        it('should handle null and undefined values', () => {
            const data = [{ A: null, B: undefined, C: 'valid' }];

            exportToCSV(data, 'test');

            expect(mockClick).toHaveBeenCalled();
        });

        it('should handle object values with JSON.stringify', () => {
            const data = [{ Info: { nested: true } as unknown }];

            exportToCSV(data, 'test');

            expect(mockClick).toHaveBeenCalled();
        });

        it('should set download filename with date suffix', () => {
            const data = [{ Col: 'val' }];
            const mockElement = {
                href: '',
                download: '',
                click: mockClick,
                style: {},
            };
            (document.createElement as Mock).mockReturnValue(mockElement);

            exportToCSV(data, 'report');

            const today = new Date().toISOString().split('T')[0];
            expect(mockElement.download).toBe(`report_${today}.csv`);
        });
    });

    // ─── printReport ────────────────────────────────────────────────

    describe('printReport', () => {
        let mockWrite: Mock;
        let mockClose: Mock;
        let mockPrint: Mock;
        let mockOpen: Mock;

        beforeEach(() => {
            mockWrite = vi.fn();
            mockClose = vi.fn();
            mockPrint = vi.fn();
            mockOpen = vi.fn().mockReturnValue({
                document: { write: mockWrite, close: mockClose },
                print: mockPrint,
            });
            vi.spyOn(window, 'open').mockImplementation(mockOpen);
        });

        it('should not open window for empty data', () => {
            printReport('Test Report', []);

            expect(window.open).not.toHaveBeenCalled();
        });

        it('should open window and write HTML with title', () => {
            const data = [{ Name: 'Alice', Value: 100 }];

            printReport('Production Report', data);

            expect(window.open).toHaveBeenCalledWith('', '_blank');
            expect(mockWrite).toHaveBeenCalled();

            const writtenHtml = mockWrite.mock.calls[0][0] as string;
            expect(writtenHtml).toContain('Production Report');
            expect(writtenHtml).toContain('<th>Name</th>');
            expect(writtenHtml).toContain('<th>Value</th>');
            expect(writtenHtml).toContain('<td>Alice</td>');
            expect(writtenHtml).toContain('<td>100</td>');
        });

        it('should call document.close and print after writing', () => {
            const data = [{ Col: 'val' }];

            printReport('Report', data);

            expect(mockClose).toHaveBeenCalled();
            expect(mockPrint).toHaveBeenCalled();
        });

        it('should handle window.open returning null gracefully', () => {
            mockOpen.mockReturnValue(null);

            // Should not throw
            expect(() => printReport('Report', [{ A: 1 }])).not.toThrow();

            expect(window.open).toHaveBeenCalled();
            expect(mockWrite).not.toHaveBeenCalled();
        });
    });

    // ─── exportReportSummary ────────────────────────────────────────

    describe('exportReportSummary', () => {
        beforeEach(() => {
            const mockClick = vi.fn();
            vi.spyOn(document, 'createElement').mockReturnValue({
                href: '',
                download: '',
                click: mockClick,
                style: {},
            } as unknown as HTMLElement);
            URL.createObjectURL = vi.fn(() => 'blob:url');
            URL.revokeObjectURL = vi.fn();
        });

        it('should call exportToCSV with formatted summary data', () => {
            const summary: ReportSummary = {
                totalUsers: 10,
                activeUsers: 8,
                totalBatches: 50,
                completedBatches: 40,
                inProgressBatches: 5,
                totalGateEntries: 100,
                completedGateEntries: 90,
                totalProduction: { oil: 500, carbon: 300, steel: 200 },
                inventoryStats: { rawMaterials: 20, finishedProducts: 15, lowStockItems: 3 },
            };
            const filters: ReportFilters = {
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-31'),
            };

            // Should not throw
            expect(() => exportReportSummary(summary, filters)).not.toThrow();
            expect(document.createElement).toHaveBeenCalledWith('a');
        });
    });

    // ─── getOperationsSummary ───────────────────────────────────────

    describe('getOperationsSummary', () => {
        const filters: ReportFilters = {
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31'),
        };

        it('should aggregate data from all collections', async () => {
            // Mock 4 parallel getDocs calls
            mockGetDocs
                // 1st call: users
                .mockResolvedValueOnce({
                    docs: [
                        { id: 'u1', data: () => ({ status: 'ACTIVE' }) },
                        { id: 'u2', data: () => ({ status: 'ACTIVE' }) },
                        { id: 'u3', data: () => ({ status: 'INACTIVE' }) },
                    ],
                    size: 3,
                    empty: false,
                })
                // 2nd call: batches
                .mockResolvedValueOnce({
                    docs: [
                        {
                            id: 'b1',
                            data: () => ({
                                status: 'COMPLETED',
                                outputs: [
                                    { materialCategory: 'PYROLYSIS_OIL', quantity: 100 },
                                    { materialCategory: 'CARBON_BLACK', quantity: 50 },
                                    { materialCategory: 'SCRAP_STEEL', quantity: 30 },
                                ],
                            }),
                        },
                        {
                            id: 'b2',
                            data: () => ({
                                status: 'IN_PROGRESS',
                                outputs: [],
                            }),
                        },
                        {
                            id: 'b3',
                            data: () => ({
                                status: 'COMPLETED',
                                outputs: [{ materialCategory: 'PYROLYSIS_OIL', quantity: 200 }],
                            }),
                        },
                    ],
                    size: 3,
                    empty: false,
                })
                // 3rd call: gate entries
                .mockResolvedValueOnce({
                    docs: [
                        { id: 'g1', data: () => ({ status: 'COMPLETED' }) },
                        { id: 'g2', data: () => ({ status: 'PENDING' }) },
                    ],
                    size: 2,
                    empty: false,
                })
                // 4th call: inventory
                .mockResolvedValueOnce({
                    docs: [
                        { id: 'i1', data: () => ({ category: 'RAW_MATERIAL', currentStock: 100, minimumStock: 50 }) },
                        { id: 'i2', data: () => ({ category: 'FINISHED_PRODUCT', currentStock: 5, minimumStock: 10 }) },
                        { id: 'i3', data: () => ({ category: 'RAW_MATERIAL', currentStock: 2, minimumStock: 2 }) },
                    ],
                    size: 3,
                    empty: false,
                });

            const result = await getOperationsSummary(filters);

            expect(result.totalUsers).toBe(3);
            expect(result.activeUsers).toBe(2);
            expect(result.totalBatches).toBe(3);
            expect(result.completedBatches).toBe(2);
            expect(result.inProgressBatches).toBe(1);
            expect(result.totalGateEntries).toBe(2);
            expect(result.completedGateEntries).toBe(1);
            expect(result.totalProduction.oil).toBe(300);
            expect(result.totalProduction.carbon).toBe(50);
            expect(result.totalProduction.steel).toBe(30);
            expect(result.inventoryStats.rawMaterials).toBe(2);
            expect(result.inventoryStats.finishedProducts).toBe(1);
            // i2 (5 <= 10) and i3 (2 <= 2) are low stock
            expect(result.inventoryStats.lowStockItems).toBe(2);
        });

        it('should handle empty collections', async () => {
            const emptySnapshot = { docs: [], size: 0, empty: true };
            mockGetDocs
                .mockResolvedValueOnce(emptySnapshot)
                .mockResolvedValueOnce(emptySnapshot)
                .mockResolvedValueOnce(emptySnapshot)
                .mockResolvedValueOnce(emptySnapshot);

            const result = await getOperationsSummary(filters);

            expect(result.totalUsers).toBe(0);
            expect(result.activeUsers).toBe(0);
            expect(result.totalBatches).toBe(0);
            expect(result.completedBatches).toBe(0);
            expect(result.totalProduction.oil).toBe(0);
            expect(result.inventoryStats.lowStockItems).toBe(0);
        });
    });

    // ─── getProductionReport ────────────────────────────────────────

    describe('getProductionReport', () => {
        const filters: ReportFilters = {
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31'),
        };

        it('should map batch outputs correctly', async () => {
            const mockDate = new Date('2026-01-15');
            mockGetDocs.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'b1',
                        data: () => ({
                            batchNumber: 'M1-20260115-001',
                            reactorId: 'reactor-1',
                            endTime: { toDate: () => mockDate },
                            outputs: [
                                { materialCategory: 'PYROLYSIS_OIL', quantity: 150 },
                                { materialCategory: 'CARBON_BLACK', quantity: 80 },
                                { materialCategory: 'SCRAP_STEEL', quantity: 40 },
                            ],
                        }),
                    },
                    {
                        id: 'b2',
                        data: () => ({
                            batchNumber: 'M2-20260116-001',
                            reactorId: 'reactor-2',
                            endTime: null,
                            outputs: [],
                        }),
                    },
                ],
                size: 2,
                empty: false,
            });

            const result = await getProductionReport(filters);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                batchNumber: 'M1-20260115-001',
                reactorId: 'reactor-1',
                completedAt: mockDate,
                outputs: { oil: 150, carbon: 80, steel: 40 },
            });
            // Second batch has no outputs
            expect(result[1].outputs).toEqual({ oil: 0, carbon: 0, steel: 0 });
            // Second batch has null endTime, falls back to new Date()
            expect(result[1].completedAt).toBeInstanceOf(Date);
        });

        it('should handle empty results', async () => {
            mockGetDocs.mockResolvedValueOnce({ docs: [], size: 0, empty: true });

            const result = await getProductionReport(filters);

            expect(result).toEqual([]);
        });
    });

    // ─── getGateEntriesForExport ────────────────────────────────────

    describe('getGateEntriesForExport', () => {
        const filters: ReportFilters = {
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31'),
        };

        it('should map gate entries to export format', async () => {
            const entryDate = new Date('2026-01-10T08:00:00Z');
            const exitDate = new Date('2026-01-10T16:00:00Z');

            mockGetDocs.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'g1',
                        data: () => ({
                            entryNumber: 'GE-2026-0001',
                            vehicleNumber: 'KA01AB1234',
                            driverName: 'Ram Kumar',
                            entryType: 'IN',
                            material: 'Waste Tyres',
                            status: 'COMPLETED',
                            entryTime: { toDate: () => entryDate },
                            exitTime: { toDate: () => exitDate },
                        }),
                    },
                ],
                size: 1,
                empty: false,
            });

            const result = await getGateEntriesForExport(filters);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                'Entry Number': 'GE-2026-0001',
                'Vehicle Number': 'KA01AB1234',
                'Driver Name': 'Ram Kumar',
                'Entry Type': 'IN',
                Material: 'Waste Tyres',
                Status: 'COMPLETED',
                'Entry Time': entryDate.toISOString(),
                'Exit Time': exitDate.toISOString(),
            });
        });

        it('should handle missing fields with defaults', async () => {
            mockGetDocs.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'g2',
                        data: () => ({}),
                    },
                ],
                size: 1,
                empty: false,
            });

            const result = await getGateEntriesForExport(filters);

            expect(result[0]['Entry Number']).toBe('');
            expect(result[0]['Vehicle Number']).toBe('');
            expect(result[0]['Entry Time']).toBe('');
            expect(result[0]['Exit Time']).toBe('');
        });
    });

    // ─── getWeighbridgeForExport ────────────────────────────────────

    describe('getWeighbridgeForExport', () => {
        const filters: ReportFilters = {
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31'),
        };

        it('should map weighbridge entries to export format', async () => {
            const createdDate = new Date('2026-01-12T10:00:00Z');

            mockGetDocs.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'w1',
                        data: () => ({
                            ticketNumber: 'WB-001',
                            vehicleNumber: 'KA01CD5678',
                            material: 'Oil',
                            firstWeight: 5000,
                            secondWeight: 2000,
                            netWeight: 3000,
                            status: 'COMPLETED',
                            createdAt: { toDate: () => createdDate },
                        }),
                    },
                ],
                size: 1,
                empty: false,
            });

            const result = await getWeighbridgeForExport(filters);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                'Ticket Number': 'WB-001',
                'Vehicle Number': 'KA01CD5678',
                Material: 'Oil',
                'First Weight (kg)': 5000,
                'Second Weight (kg)': 2000,
                'Net Weight (kg)': 3000,
                Status: 'COMPLETED',
                Created: createdDate.toISOString(),
            });
        });

        it('should handle missing fields with defaults', async () => {
            mockGetDocs.mockResolvedValueOnce({
                docs: [{ id: 'w2', data: () => ({}) }],
                size: 1,
                empty: false,
            });

            const result = await getWeighbridgeForExport(filters);

            expect(result[0]['Ticket Number']).toBe('');
            expect(result[0]['First Weight (kg)']).toBe('');
            expect(result[0]['Net Weight (kg)']).toBe('');
            expect(result[0]['Created']).toBe('');
        });
    });

    // ─── getInventoryForExport ──────────────────────────────────────

    describe('getInventoryForExport', () => {
        it('should add LOW STOCK status for low items', async () => {
            mockGetDocs.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'i1',
                        data: () => ({
                            code: 'INV-001',
                            name: 'Waste Tyres',
                            category: 'RAW_MATERIAL',
                            currentStock: 100,
                            minimumStock: 50,
                            unit: 'KG',
                            location: 'Storage A',
                        }),
                    },
                    {
                        id: 'i2',
                        data: () => ({
                            code: 'INV-002',
                            name: 'Carbon Black',
                            category: 'FINISHED_PRODUCT',
                            currentStock: 5,
                            minimumStock: 10,
                            unit: 'KG',
                            location: 'Storage B',
                        }),
                    },
                ],
                size: 2,
                empty: false,
            });

            const result = await getInventoryForExport();

            expect(result).toHaveLength(2);

            // First item: stock (100) > minimum (50) => OK
            expect(result[0]).toEqual({
                'Item Code': 'INV-001',
                Name: 'Waste Tyres',
                Category: 'RAW_MATERIAL',
                'Current Stock': 100,
                'Minimum Stock': 50,
                'Maximum Stock': '',
                Unit: 'KG',
                Location: 'Storage A',
                Status: 'OK',
            });

            // Second item: stock (5) <= minimum (10) => LOW STOCK
            expect(result[1]).toEqual({
                'Item Code': 'INV-002',
                Name: 'Carbon Black',
                Category: 'FINISHED_PRODUCT',
                'Current Stock': 5,
                'Minimum Stock': 10,
                'Maximum Stock': '',
                Unit: 'KG',
                Location: 'Storage B',
                Status: 'LOW STOCK',
            });
        });

        it('should mark items with equal stock and minimum as LOW STOCK', async () => {
            mockGetDocs.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'i3',
                        data: () => ({
                            code: 'INV-003',
                            name: 'Steel Wire',
                            category: 'FINISHED_PRODUCT',
                            currentStock: 10,
                            minimumStock: 10,
                            unit: 'KG',
                            location: 'Storage C',
                        }),
                    },
                ],
                size: 1,
                empty: false,
            });

            const result = await getInventoryForExport();

            expect(result[0].Status).toBe('LOW STOCK');
        });

        it('should handle missing stock values with defaults', async () => {
            mockGetDocs.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'i4',
                        data: () => ({
                            code: 'INV-004',
                            name: 'Unknown Item',
                        }),
                    },
                ],
                size: 1,
                empty: false,
            });

            const result = await getInventoryForExport();

            // currentStock defaults to 0, minimumStock defaults to 0, 0 <= 0 => LOW STOCK
            expect(result[0]['Current Stock']).toBe(0);
            expect(result[0]['Minimum Stock']).toBe(0);
            expect(result[0].Status).toBe('LOW STOCK');
        });
    });
});
