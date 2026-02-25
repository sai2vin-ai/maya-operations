import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JOB_STATUS_CONFIG, JOB_PRIORITY_CONFIG, JOB_TYPE_CONFIG } from './maintenanceService';

// Use vi.hoisted so mocks survive vi.mock hoisting
const { mockGetDocs, mockGetDoc, mockAddDoc, mockUpdateDoc, mockRunTransaction, mockAssertAuthorized } = vi.hoisted(
    () => ({
        mockGetDocs: vi.fn(),
        mockGetDoc: vi.fn(),
        mockAddDoc: vi.fn(),
        mockUpdateDoc: vi.fn(),
        mockRunTransaction: vi.fn(),
        mockAssertAuthorized: vi.fn(),
    }),
);

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDocs: mockGetDocs,
    getDoc: mockGetDoc,
    addDoc: mockAddDoc,
    updateDoc: mockUpdateDoc,
    runTransaction: mockRunTransaction,
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: () => ({ seconds: 1700000000, nanoseconds: 0 }),
        fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    },
}));

vi.mock('../../../lib/firebase', () => ({ db: {}, auth: {}, secondaryAuth: {} }));
vi.mock('../../../lib/authorization', () => ({
    assertAuthorized: mockAssertAuthorized,
}));

describe('maintenanceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddDoc.mockResolvedValue({ id: 'new-job-id' });
    });

    describe('JOB_STATUS_CONFIG', () => {
        it('should have all required job statuses', () => {
            const statusKeys = Object.keys(JOB_STATUS_CONFIG);
            expect(statusKeys).toContain('OPEN');
            expect(statusKeys).toContain('ASSIGNED');
            expect(statusKeys).toContain('IN_PROGRESS');
            expect(statusKeys).toContain('PENDING_PARTS');
            expect(statusKeys).toContain('COMPLETED');
            expect(statusKeys).toContain('CLOSED');
        });

        it('should have exactly 6 statuses', () => {
            expect(Object.keys(JOB_STATUS_CONFIG)).toHaveLength(6);
        });

        it('should have labels for all statuses', () => {
            Object.values(JOB_STATUS_CONFIG).forEach((config) => {
                expect(config.label).toBeDefined();
                expect(typeof config.label).toBe('string');
                expect(config.label.length).toBeGreaterThan(0);
            });
        });

        it('should have color classes for all statuses', () => {
            Object.values(JOB_STATUS_CONFIG).forEach((config) => {
                expect(config.color).toBeDefined();
                expect(typeof config.color).toBe('string');
                expect(config.color.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            expect(JOB_STATUS_CONFIG.OPEN.label).toBe('Open');
            expect(JOB_STATUS_CONFIG.ASSIGNED.label).toBe('Assigned');
            expect(JOB_STATUS_CONFIG.IN_PROGRESS.label).toBe('In Progress');
            expect(JOB_STATUS_CONFIG.PENDING_PARTS.label).toBe('Pending Parts');
            expect(JOB_STATUS_CONFIG.COMPLETED.label).toBe('Completed');
            expect(JOB_STATUS_CONFIG.CLOSED.label).toBe('Closed');
        });

        it('should have unique labels', () => {
            const labels = Object.values(JOB_STATUS_CONFIG).map((c) => c.label);
            const uniqueLabels = new Set(labels);
            expect(uniqueLabels.size).toBe(labels.length);
        });

        it('should use Tailwind CSS color classes', () => {
            Object.values(JOB_STATUS_CONFIG).forEach((config) => {
                expect(config.color).toMatch(/^bg-\w+-\d+\/\d+\s+text-\w+-\d+$/);
            });
        });
    });

    describe('JOB_PRIORITY_CONFIG', () => {
        it('should have all required priorities', () => {
            const priorityKeys = Object.keys(JOB_PRIORITY_CONFIG);
            expect(priorityKeys).toContain('CRITICAL');
            expect(priorityKeys).toContain('HIGH');
            expect(priorityKeys).toContain('MEDIUM');
            expect(priorityKeys).toContain('LOW');
        });

        it('should have exactly 4 priorities', () => {
            expect(Object.keys(JOB_PRIORITY_CONFIG)).toHaveLength(4);
        });

        it('should have labels for all priorities', () => {
            Object.values(JOB_PRIORITY_CONFIG).forEach((config) => {
                expect(config.label).toBeDefined();
                expect(typeof config.label).toBe('string');
                expect(config.label.length).toBeGreaterThan(0);
            });
        });

        it('should have color classes for all priorities', () => {
            Object.values(JOB_PRIORITY_CONFIG).forEach((config) => {
                expect(config.color).toBeDefined();
                expect(typeof config.color).toBe('string');
                expect(config.color.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            expect(JOB_PRIORITY_CONFIG.CRITICAL.label).toBe('Critical');
            expect(JOB_PRIORITY_CONFIG.HIGH.label).toBe('High');
            expect(JOB_PRIORITY_CONFIG.MEDIUM.label).toBe('Medium');
            expect(JOB_PRIORITY_CONFIG.LOW.label).toBe('Low');
        });

        it('should have unique labels', () => {
            const labels = Object.values(JOB_PRIORITY_CONFIG).map((c) => c.label);
            const uniqueLabels = new Set(labels);
            expect(uniqueLabels.size).toBe(labels.length);
        });

        it('should use red color for CRITICAL priority', () => {
            expect(JOB_PRIORITY_CONFIG.CRITICAL.color).toContain('red');
        });

        it('should use green color for LOW priority', () => {
            expect(JOB_PRIORITY_CONFIG.LOW.color).toContain('green');
        });
    });

    describe('JOB_TYPE_CONFIG', () => {
        it('should have all required job types', () => {
            const typeKeys = Object.keys(JOB_TYPE_CONFIG);
            expect(typeKeys).toContain('BREAKDOWN');
            expect(typeKeys).toContain('PREVENTIVE');
            expect(typeKeys).toContain('CORRECTIVE');
        });

        it('should have exactly 3 job types', () => {
            expect(Object.keys(JOB_TYPE_CONFIG)).toHaveLength(3);
        });

        it('should have labels for all job types', () => {
            Object.values(JOB_TYPE_CONFIG).forEach((config) => {
                expect(config.label).toBeDefined();
                expect(typeof config.label).toBe('string');
                expect(config.label.length).toBeGreaterThan(0);
            });
        });

        it('should have color classes for all job types', () => {
            Object.values(JOB_TYPE_CONFIG).forEach((config) => {
                expect(config.color).toBeDefined();
                expect(typeof config.color).toBe('string');
                expect(config.color.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            expect(JOB_TYPE_CONFIG.BREAKDOWN.label).toBe('Breakdown');
            expect(JOB_TYPE_CONFIG.PREVENTIVE.label).toBe('Preventive');
            expect(JOB_TYPE_CONFIG.CORRECTIVE.label).toBe('Corrective');
        });

        it('should have unique labels', () => {
            const labels = Object.values(JOB_TYPE_CONFIG).map((c) => c.label);
            const uniqueLabels = new Set(labels);
            expect(uniqueLabels.size).toBe(labels.length);
        });

        it('should use red color for BREAKDOWN type', () => {
            expect(JOB_TYPE_CONFIG.BREAKDOWN.color).toContain('red');
        });

        it('should use blue color for PREVENTIVE type', () => {
            expect(JOB_TYPE_CONFIG.PREVENTIVE.color).toContain('blue');
        });

        it('should use yellow color for CORRECTIVE type', () => {
            expect(JOB_TYPE_CONFIG.CORRECTIVE.color).toContain('yellow');
        });
    });

    describe('createJob', () => {
        it('should create job with generated job number', async () => {
            // generateJobNumber internally calls getDocs - return empty to get JOB-YYYY-0001
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
            mockUpdateDoc.mockResolvedValue(undefined);

            const { createJob } = await import('./maintenanceService');

            const result = await createJob(
                {
                    assetId: 'asset-1',
                    jobType: 'PREVENTIVE',
                    priority: 'MEDIUM',
                    description: 'Routine maintenance',
                },
                'user-1',
                'SUPER_ADMIN',
            );

            expect(result).toBe('new-job-id');
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            const jobData = mockAddDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(jobData.jobNumber).toMatch(/^JOB-\d{4}-0001$/);
            expect(jobData.assetId).toBe('asset-1');
            expect(jobData.jobType).toBe('PREVENTIVE');
            expect(jobData.priority).toBe('MEDIUM');
            expect(jobData.description).toBe('Routine maintenance');
            expect(jobData.reportedBy).toBe('user-1');
        });

        it('should set status to ASSIGNED when assignedTo provided', async () => {
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
            mockUpdateDoc.mockResolvedValue(undefined);

            const { createJob } = await import('./maintenanceService');

            await createJob(
                {
                    assetId: 'asset-1',
                    jobType: 'CORRECTIVE',
                    priority: 'HIGH',
                    description: 'Fix motor',
                    assignedTo: 'tech-1',
                },
                'user-1',
                'SUPER_ADMIN',
            );

            const jobData = mockAddDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(jobData.status).toBe('ASSIGNED');
            expect(jobData.assignedTo).toBe('tech-1');
        });

        it('should set status to OPEN when no assignedTo', async () => {
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createJob } = await import('./maintenanceService');

            await createJob(
                {
                    assetId: 'asset-1',
                    jobType: 'PREVENTIVE',
                    priority: 'LOW',
                    description: 'Inspect belt',
                },
                'user-1',
                'SUPER_ADMIN',
            );

            const jobData = mockAddDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(jobData.status).toBe('OPEN');
        });

        it('should update asset to BREAKDOWN for breakdown jobs atomically', async () => {
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
            mockRunTransaction.mockImplementation(async (_db: unknown, fn: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    update: vi.fn(),
                    set: vi.fn(),
                };
                await fn(mockTransaction);
                // Verify transaction.update was called for asset with BREAKDOWN
                expect(mockTransaction.update).toHaveBeenCalledTimes(1);
                const assetUpdate = mockTransaction.update.mock.calls[0][1];
                expect(assetUpdate.status).toBe('BREAKDOWN');
                // Verify transaction.set was called for the job
                expect(mockTransaction.set).toHaveBeenCalledTimes(1);
            });

            const { createJob } = await import('./maintenanceService');

            await createJob(
                {
                    assetId: 'asset-1',
                    jobType: 'BREAKDOWN',
                    priority: 'CRITICAL',
                    description: 'Motor failure',
                },
                'user-1',
                'SUPER_ADMIN',
            );

            expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        });

        it('should check authorization', async () => {
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const { createJob } = await import('./maintenanceService');

            await createJob(
                {
                    assetId: 'asset-1',
                    jobType: 'PREVENTIVE',
                    priority: 'LOW',
                    description: 'Check valve',
                },
                'user-1',
                'MAINTENANCE_TECH',
            );

            expect(mockAssertAuthorized).toHaveBeenCalledWith('MAINTENANCE_TECH', 'maintenance:create');
        });
    });

    describe('updateJob', () => {
        it('should set startedAt for IN_PROGRESS status', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);
            // Mock getJobById call (for COMPLETED/CLOSED branch - not hit here)

            const { updateJob } = await import('./maintenanceService');

            await updateJob('job-1', { status: 'IN_PROGRESS' }, 'user-1', 'SUPER_ADMIN');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.status).toBe('IN_PROGRESS');
            expect(updateArgs.startedAt).toBeDefined();
            expect(updateArgs.updatedBy).toBe('user-1');
        });

        it('should set completedAt for COMPLETED status (atomic transaction)', async () => {
            let capturedJobUpdate: Record<string, unknown> = {};
            mockRunTransaction.mockImplementation(async (_db: unknown, fn: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ assetId: 'asset-1' }),
                    }),
                    update: vi.fn(),
                };
                await fn(mockTransaction);
                // First update call is for the job
                capturedJobUpdate = mockTransaction.update.mock.calls[0][1] as Record<string, unknown>;
            });

            const { updateJob } = await import('./maintenanceService');

            await updateJob('job-1', { status: 'COMPLETED' }, 'user-1', 'SUPER_ADMIN');

            expect(mockRunTransaction).toHaveBeenCalledTimes(1);
            expect(capturedJobUpdate.status).toBe('COMPLETED');
            expect(capturedJobUpdate.completedAt).toBeDefined();
        });

        it('should update asset to OPERATIONAL when COMPLETED (atomic transaction)', async () => {
            let capturedAssetUpdate: Record<string, unknown> = {};
            mockRunTransaction.mockImplementation(async (_db: unknown, fn: (t: unknown) => Promise<void>) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ assetId: 'asset-1' }),
                    }),
                    update: vi.fn(),
                };
                await fn(mockTransaction);
                // Second update call is for the asset
                capturedAssetUpdate = mockTransaction.update.mock.calls[1][1] as Record<string, unknown>;
            });

            const { updateJob } = await import('./maintenanceService');

            await updateJob('job-1', { status: 'COMPLETED' }, 'user-1', 'SUPER_ADMIN');

            expect(capturedAssetUpdate.status).toBe('OPERATIONAL');
        });

        it('should check authorization', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { updateJob } = await import('./maintenanceService');

            await updateJob('job-1', { assignedTo: 'tech-2' }, 'user-1', 'PLANT_MANAGER');

            expect(mockAssertAuthorized).toHaveBeenCalledWith('PLANT_MANAGER', 'maintenance:update');
        });
    });

    describe('getJobs', () => {
        it('should return jobs', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'job-1',
                        data: () => ({
                            jobNumber: 'JOB-2026-0001',
                            assetId: 'asset-1',
                            status: 'OPEN',
                            priority: 'HIGH',
                        }),
                    },
                    {
                        id: 'job-2',
                        data: () => ({
                            jobNumber: 'JOB-2026-0002',
                            assetId: 'asset-2',
                            status: 'COMPLETED',
                            priority: 'LOW',
                        }),
                    },
                ],
            });

            const { getJobs } = await import('./maintenanceService');

            const result = await getJobs();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('job-1');
            expect(result[0].jobNumber).toBe('JOB-2026-0001');
            expect(result[1].id).toBe('job-2');
        });
    });

    describe('getJobById', () => {
        it('should return null when not found', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => false,
            });

            const { getJobById } = await import('./maintenanceService');

            const result = await getJobById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getJobsByAssets', () => {
        it('should return jobs for multiple asset IDs', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'job-1',
                        data: () => ({
                            jobNumber: 'JOB-0001',
                            assetId: 'asset-1',
                            reportedAt: { toMillis: () => 2000 },
                        }),
                    },
                    {
                        id: 'job-2',
                        data: () => ({
                            jobNumber: 'JOB-0002',
                            assetId: 'asset-2',
                            reportedAt: { toMillis: () => 1000 },
                        }),
                    },
                ],
            });

            const { getJobsByAssets } = await import('./maintenanceService');
            const jobs = await getJobsByAssets(['asset-1', 'asset-2']);

            expect(jobs).toHaveLength(2);
            // Should be sorted by reportedAt descending
            expect(jobs[0].id).toBe('job-1');
            expect(jobs[1].id).toBe('job-2');
        });

        it('should return empty array for empty input', async () => {
            const { getJobsByAssets } = await import('./maintenanceService');
            const jobs = await getJobsByAssets([]);

            expect(jobs).toHaveLength(0);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });

        it('should chunk requests for more than 30 IDs', async () => {
            // Create 35 asset IDs
            const assetIds = Array.from({ length: 35 }, (_, i) => `asset-${i}`);

            mockGetDocs.mockResolvedValue({
                docs: [],
            });

            const { getJobsByAssets } = await import('./maintenanceService');
            await getJobsByAssets(assetIds);

            // Should make 2 queries: chunk of 30 + chunk of 5
            expect(mockGetDocs).toHaveBeenCalledTimes(2);
        });
    });

    describe('getJobStats', () => {
        it('should compute stats from jobs', async () => {
            const now = new Date();
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'job-1',
                        data: () => ({
                            status: 'OPEN',
                            priority: 'CRITICAL',
                        }),
                    },
                    {
                        id: 'job-2',
                        data: () => ({
                            status: 'IN_PROGRESS',
                            priority: 'HIGH',
                        }),
                    },
                    {
                        id: 'job-3',
                        data: () => ({
                            status: 'PENDING_PARTS',
                            priority: 'MEDIUM',
                        }),
                    },
                    {
                        id: 'job-4',
                        data: () => ({
                            status: 'COMPLETED',
                            priority: 'LOW',
                            completedAt: {
                                toDate: () => now,
                            },
                        }),
                    },
                    {
                        id: 'job-5',
                        data: () => ({
                            status: 'CLOSED',
                            priority: 'LOW',
                        }),
                    },
                ],
            });

            const { getJobStats } = await import('./maintenanceService');

            const stats = await getJobStats();

            // Active jobs = not COMPLETED or CLOSED: job-1, job-2, job-3 = 3
            expect(stats.activeJobs).toBe(3);
            // Critical active jobs: job-1 = 1
            expect(stats.criticalJobs).toBe(1);
            // Pending parts: job-3 = 1
            expect(stats.pendingParts).toBe(1);
            // Completed this month: job-4 has completedAt this month = 1
            expect(stats.completedThisMonth).toBe(1);
        });
    });
});
