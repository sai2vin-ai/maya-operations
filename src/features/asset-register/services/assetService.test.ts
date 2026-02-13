import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetDocs, mockGetDoc, mockAddDoc, mockUpdateDoc, mockSetDoc, mockAssertAuthorized } = vi.hoisted(() => ({
    mockGetDocs: vi.fn(),
    mockGetDoc: vi.fn(),
    mockAddDoc: vi.fn(),
    mockUpdateDoc: vi.fn(),
    mockSetDoc: vi.fn(),
    mockAssertAuthorized: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDocs: mockGetDocs,
    getDoc: mockGetDoc,
    addDoc: mockAddDoc,
    setDoc: mockSetDoc,
    updateDoc: mockUpdateDoc,
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: () => ({ seconds: 1700000000, nanoseconds: 0 }),
        fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    },
}));
vi.mock('../../../lib/firebase', () => ({ db: {} }));
vi.mock('../../../lib/authorization', () => ({ assertAuthorized: mockAssertAuthorized }));

describe('assetService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddDoc.mockResolvedValue({ id: 'new-asset-id' });
    });

    describe('ASSET_CATEGORIES', () => {
        it('should have all required categories', async () => {
            const { ASSET_CATEGORIES } = await import('./assetService');
            const values = ASSET_CATEGORIES.map((c) => c.value);
            expect(values).toContain('REACTOR');
            expect(values).toContain('PUMP');
            expect(values).toContain('CONVEYOR');
            expect(values).toContain('MOTOR');
            expect(values).toContain('VALVE');
            expect(values).toContain('ELECTRICAL');
            expect(values).toContain('WEIGHBRIDGE');
            expect(values).toContain('OTHER');
        });

        it('should have labels for all categories', async () => {
            const { ASSET_CATEGORIES } = await import('./assetService');
            ASSET_CATEGORIES.forEach((c) => {
                expect(c.label).toBeTruthy();
                expect(typeof c.label).toBe('string');
            });
        });
    });

    describe('ASSET_STATUS_CONFIG', () => {
        it('should have all asset statuses', async () => {
            const { ASSET_STATUS_CONFIG } = await import('./assetService');
            expect(ASSET_STATUS_CONFIG).toHaveProperty('OPERATIONAL');
            expect(ASSET_STATUS_CONFIG).toHaveProperty('BREAKDOWN');
            expect(ASSET_STATUS_CONFIG).toHaveProperty('UNDER_MAINTENANCE');
            expect(ASSET_STATUS_CONFIG).toHaveProperty('DECOMMISSIONED');
        });

        it('should have label and color for each status', async () => {
            const { ASSET_STATUS_CONFIG } = await import('./assetService');
            Object.values(ASSET_STATUS_CONFIG).forEach((config) => {
                expect(config.label).toBeTruthy();
                expect(config.color).toBeTruthy();
            });
        });
    });

    describe('REACTOR_STATUSES', () => {
        it('should have all reactor statuses', async () => {
            const { REACTOR_STATUSES } = await import('./assetService');
            const values = REACTOR_STATUSES.map((s) => s.value);
            expect(values).toContain('IDLE');
            expect(values).toContain('IN_BATCH');
            expect(values).toContain('MAINTENANCE');
            expect(values).toContain('OFFLINE');
        });

        it('should have exactly 4 reactor statuses', async () => {
            const { REACTOR_STATUSES } = await import('./assetService');
            expect(REACTOR_STATUSES).toHaveLength(4);
        });

        it('should have labels and colors for all statuses', async () => {
            const { REACTOR_STATUSES } = await import('./assetService');
            REACTOR_STATUSES.forEach((s) => {
                expect(s.label).toBeTruthy();
                expect(s.color).toBeTruthy();
            });
        });
    });

    describe('getReactorStatusInfo', () => {
        it('should return correct info for IDLE', async () => {
            const { getReactorStatusInfo } = await import('./assetService');
            const info = getReactorStatusInfo('IDLE');
            expect(info.value).toBe('IDLE');
            expect(info.label).toBe('Idle');
        });

        it('should return correct info for IN_BATCH', async () => {
            const { getReactorStatusInfo } = await import('./assetService');
            const info = getReactorStatusInfo('IN_BATCH');
            expect(info.value).toBe('IN_BATCH');
            expect(info.label).toBe('In Batch');
        });

        it('should return default (IDLE) for unknown status', async () => {
            const { getReactorStatusInfo } = await import('./assetService');
            const info = getReactorStatusInfo('UNKNOWN' as never);
            expect(info.value).toBe('IDLE');
        });
    });

    describe('getAssets', () => {
        it('should return all assets', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    { id: 'asset-1', data: () => ({ name: 'Reactor M1', category: 'REACTOR' }) },
                    { id: 'asset-2', data: () => ({ name: 'Pump A', category: 'PUMP' }) },
                ],
            });

            const { getAssets } = await import('./assetService');
            const assets = await getAssets();
            expect(assets).toHaveLength(2);
            expect(assets[0].id).toBe('asset-1');
            expect(assets[1].id).toBe('asset-2');
        });
    });

    describe('getAssetById', () => {
        it('should return asset when found', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'asset-1',
                data: () => ({ name: 'Reactor M1', category: 'REACTOR' }),
            });

            const { getAssetById } = await import('./assetService');
            const asset = await getAssetById('asset-1');
            expect(asset).not.toBeNull();
            expect(asset?.id).toBe('asset-1');
            expect(asset?.name).toBe('Reactor M1');
        });

        it('should return null when not found', async () => {
            mockGetDoc.mockResolvedValue({ exists: () => false });

            const { getAssetById } = await import('./assetService');
            const asset = await getAssetById('nonexistent');
            expect(asset).toBeNull();
        });
    });

    describe('createAsset', () => {
        it('should call assertAuthorized with asset_register:create', async () => {
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createAsset } = await import('./assetService');
            await createAsset(
                { name: 'New Pump', category: 'PUMP', location: 'Workshop', criticality: 'MEDIUM' },
                'user-1',
                'SUPER_ADMIN',
            );

            expect(mockAssertAuthorized).toHaveBeenCalledWith('SUPER_ADMIN', 'asset_register:create');
        });

        it('should create asset with parentAssetIds when provided', async () => {
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createAsset } = await import('./assetService');
            await createAsset(
                {
                    name: 'Sub-Pump',
                    category: 'PUMP',
                    location: 'Reactor Bay 1',
                    criticality: 'HIGH',
                    parentAssetIds: ['reactor-M1'],
                },
                'user-1',
                'SUPER_ADMIN',
            );

            const addDocArgs = mockAddDoc.mock.calls[0][1];
            expect(addDocArgs.parentAssetIds).toEqual(['reactor-M1']);
        });

        it('should return the new document ID', async () => {
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createAsset } = await import('./assetService');
            const id = await createAsset(
                { name: 'Test', category: 'OTHER', location: 'Workshop', criticality: 'LOW' },
                'user-1',
                'SUPER_ADMIN',
            );

            expect(id).toBe('new-asset-id');
        });
    });

    describe('updateAsset', () => {
        it('should call assertAuthorized with asset_register:update', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { updateAsset } = await import('./assetService');
            await updateAsset('asset-1', { name: 'Updated' }, 'user-1', 'PLANT_MANAGER');

            expect(mockAssertAuthorized).toHaveBeenCalledWith('PLANT_MANAGER', 'asset_register:update');
        });

        it('should update parentAssetIds when provided', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { updateAsset } = await import('./assetService');
            await updateAsset('asset-1', { parentAssetIds: ['reactor-M1', 'reactor-M2'] }, 'user-1', 'SUPER_ADMIN');

            const updateArgs = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
            expect(updateArgs.parentAssetIds).toEqual(['reactor-M1', 'reactor-M2']);
        });

        it('should update inputItemIds and outputItemIds', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { updateAsset } = await import('./assetService');
            await updateAsset(
                'asset-1',
                { inputItemIds: ['item-1'], outputItemIds: ['item-2', 'item-3'] },
                'user-1',
                'SUPER_ADMIN',
            );

            const updateArgs = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
            expect(updateArgs.inputItemIds).toEqual(['item-1']);
            expect(updateArgs.outputItemIds).toEqual(['item-2', 'item-3']);
        });
    });

    describe('getReactorAssets', () => {
        it('should return only reactor-category assets', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    { id: 'reactor-M1', data: () => ({ name: 'M1', category: 'REACTOR', reactorNumber: 'M1' }) },
                    { id: 'reactor-M2', data: () => ({ name: 'M2', category: 'REACTOR', reactorNumber: 'M2' }) },
                ],
            });

            const { getReactorAssets } = await import('./assetService');
            const reactors = await getReactorAssets();

            expect(reactors).toHaveLength(2);
            expect(reactors[0].id).toBe('reactor-M1');
            expect(reactors[1].id).toBe('reactor-M2');
        });
    });

    describe('createReactorAsset', () => {
        it('should create with deterministic ID (reactor_{number})', async () => {
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
            mockSetDoc.mockResolvedValue(undefined);

            const { createReactorAsset } = await import('./assetService');
            const id = await createReactorAsset({ reactorNumber: 'M3', name: 'Reactor M3' }, 'user-1');

            expect(id).toBe('reactor_M3');
        });

        it('should set reactor-specific fields', async () => {
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
            mockSetDoc.mockResolvedValue(undefined);

            const { createReactorAsset } = await import('./assetService');
            await createReactorAsset({ reactorNumber: 'M3', name: 'Reactor M3' }, 'user-1');

            const setDocArgs = mockSetDoc.mock.calls[0][1] as Record<string, unknown>;
            expect(setDocArgs.category).toBe('REACTOR');
            expect(setDocArgs.reactorNumber).toBe('M3');
            expect(setDocArgs.reactorStatus).toBe('IDLE');
            expect(setDocArgs.totalBatches).toBe(0);
            expect(setDocArgs.criticality).toBe('HIGH');
        });
    });

    describe('updateReactorStatus', () => {
        it('should update reactorStatus field', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { updateReactorStatus } = await import('./assetService');
            await updateReactorStatus('reactor-M1', 'IN_BATCH', 'batch-1', 'user-1');

            const updateArgs = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
            expect(updateArgs.reactorStatus).toBe('IN_BATCH');
            expect(updateArgs.currentBatchId).toBe('batch-1');
            expect(updateArgs.updatedBy).toBe('user-1');
        });

        it('should clear currentBatchId when set to null', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { updateReactorStatus } = await import('./assetService');
            await updateReactorStatus('reactor-M1', 'IDLE', null, 'user-1');

            const updateArgs = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
            expect(updateArgs.reactorStatus).toBe('IDLE');
            expect(updateArgs.currentBatchId).toBeNull();
        });
    });

    describe('setReactorMaintenance', () => {
        it('should set status to MAINTENANCE', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { setReactorMaintenance } = await import('./assetService');
            await setReactorMaintenance('reactor-M1', 'user-1');

            const updateArgs = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
            expect(updateArgs.reactorStatus).toBe('MAINTENANCE');
        });
    });

    describe('setReactorIdle', () => {
        it('should set status to IDLE', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { setReactorIdle } = await import('./assetService');
            await setReactorIdle('reactor-M1', 'user-1');

            const updateArgs = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
            expect(updateArgs.reactorStatus).toBe('IDLE');
        });
    });

    describe('getChildAssets', () => {
        it('should return assets with matching parentAssetId', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    { id: 'pump-1', data: () => ({ name: 'Oil Pump', parentAssetIds: ['reactor-M1'] }) },
                    { id: 'motor-1', data: () => ({ name: 'Drive Motor', parentAssetIds: ['reactor-M1'] }) },
                ],
            });

            const { getChildAssets } = await import('./assetService');
            const children = await getChildAssets('reactor-M1');

            expect(children).toHaveLength(2);
            expect(children[0].id).toBe('pump-1');
            expect(children[1].id).toBe('motor-1');
        });

        it('should return empty array when no children', async () => {
            mockGetDocs.mockResolvedValue({ docs: [] });

            const { getChildAssets } = await import('./assetService');
            const children = await getChildAssets('reactor-M1');

            expect(children).toHaveLength(0);
        });
    });

    describe('getAssetsByIds', () => {
        it('should return assets for given IDs', async () => {
            mockGetDoc
                .mockResolvedValueOnce({
                    exists: () => true,
                    id: 'reactor-M1',
                    data: () => ({ name: 'Reactor M1' }),
                })
                .mockResolvedValueOnce({
                    exists: () => true,
                    id: 'reactor-M2',
                    data: () => ({ name: 'Reactor M2' }),
                });

            const { getAssetsByIds } = await import('./assetService');
            const assets = await getAssetsByIds(['reactor-M1', 'reactor-M2']);

            expect(assets).toHaveLength(2);
        });

        it('should skip non-existent assets', async () => {
            mockGetDoc
                .mockResolvedValueOnce({
                    exists: () => true,
                    id: 'reactor-M1',
                    data: () => ({ name: 'Reactor M1' }),
                })
                .mockResolvedValueOnce({ exists: () => false });

            const { getAssetsByIds } = await import('./assetService');
            const assets = await getAssetsByIds(['reactor-M1', 'nonexistent']);

            expect(assets).toHaveLength(1);
        });

        it('should return empty array for empty input', async () => {
            const { getAssetsByIds } = await import('./assetService');
            const assets = await getAssetsByIds([]);

            expect(assets).toHaveLength(0);
            expect(mockGetDoc).not.toHaveBeenCalled();
        });
    });

    describe('getAssetStats', () => {
        it('should return stats summary', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    { id: '1', data: () => ({ status: 'OPERATIONAL', assetCode: 'AST-0001' }) },
                    { id: '2', data: () => ({ status: 'OPERATIONAL', assetCode: 'AST-0002' }) },
                    { id: '3', data: () => ({ status: 'BREAKDOWN', assetCode: 'AST-0003' }) },
                    { id: '4', data: () => ({ status: 'UNDER_MAINTENANCE', assetCode: 'AST-0004' }) },
                ],
            });

            const { getAssetStats } = await import('./assetService');
            const stats = await getAssetStats();

            expect(stats.totalAssets).toBe(4);
            expect(stats.operationalAssets).toBe(2);
            expect(stats.breakdownAssets).toBe(1);
            expect(stats.underMaintenance).toBe(1);
        });
    });
});
