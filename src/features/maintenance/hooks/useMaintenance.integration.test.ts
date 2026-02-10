import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useJobs,
    useJobsByAsset,
    useJob,
    useCreateJob,
    useUpdateJob,
    useJobStats,
    useIssuePartsToJob,
    maintenanceKeys,
} from './useMaintenance';
import { createWrapper, mockTimestamp } from '../../../test/test-utils';
import type { MaintenanceJob } from '../../../types';
import * as maintenanceService from '../services/maintenanceService';

// Mock the maintenance service
vi.mock('../services/maintenanceService', () => ({
    getJobs: vi.fn(),
    getJobsByAsset: vi.fn(),
    getJobById: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    getJobStats: vi.fn(),
    issuePartsToJob: vi.fn(),
    JOB_STATUS_CONFIG: {},
    JOB_PRIORITY_CONFIG: {},
    JOB_TYPE_CONFIG: {},
}));

// Helper: create a mock MaintenanceJob
function mockMaintenanceJob(overrides: Partial<MaintenanceJob> = {}): MaintenanceJob {
    return {
        id: 'job-1',
        jobNumber: 'JOB-2026-0001',
        assetId: 'asset-1',
        jobType: 'BREAKDOWN',
        priority: 'HIGH',
        status: 'OPEN',
        description: 'Motor overheating',
        reportedBy: 'user-1',
        reportedAt: mockTimestamp(),
        createdAt: mockTimestamp(),
        createdBy: 'user-1',
        updatedAt: mockTimestamp(),
        updatedBy: 'user-1',
        ...overrides,
    } as MaintenanceJob;
}

describe('useMaintenance hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useJobs', () => {
        it('should fetch and return maintenance jobs', async () => {
            const mockJobs = [
                mockMaintenanceJob({ id: 'job-1', jobNumber: 'JOB-2026-0001', status: 'OPEN' }),
                mockMaintenanceJob({ id: 'job-2', jobNumber: 'JOB-2026-0002', status: 'IN_PROGRESS' }),
            ];

            vi.mocked(maintenanceService.getJobs).mockResolvedValue(mockJobs);

            const { result } = renderHook(() => useJobs(), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(maintenanceService.getJobs).toHaveBeenCalledTimes(1);
        });

        it('should handle empty job list', async () => {
            vi.mocked(maintenanceService.getJobs).mockResolvedValue([]);

            const { result } = renderHook(() => useJobs(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(0);
        });

        it('should handle error state', async () => {
            vi.mocked(maintenanceService.getJobs).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useJobs(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Network error');
        });
    });

    describe('useJobsByAsset', () => {
        it('should fetch jobs for a specific asset', async () => {
            const mockJobs = [
                mockMaintenanceJob({ id: 'job-1', assetId: 'asset-42' }),
                mockMaintenanceJob({ id: 'job-2', assetId: 'asset-42' }),
            ];

            vi.mocked(maintenanceService.getJobsByAsset).mockResolvedValue(mockJobs);

            const { result } = renderHook(() => useJobsByAsset('asset-42'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(maintenanceService.getJobsByAsset).toHaveBeenCalledWith('asset-42');
        });

        it('should not fetch when assetId is undefined', async () => {
            const { result } = renderHook(() => useJobsByAsset(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(maintenanceService.getJobsByAsset).not.toHaveBeenCalled();
        });

        it('should handle error state', async () => {
            vi.mocked(maintenanceService.getJobsByAsset).mockRejectedValue(new Error('Asset not found'));

            const { result } = renderHook(() => useJobsByAsset('asset-999'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Asset not found');
        });
    });

    describe('useJob', () => {
        it('should fetch a single job by ID', async () => {
            const job = mockMaintenanceJob({ id: 'job-123', description: 'Bearing failure' });
            vi.mocked(maintenanceService.getJobById).mockResolvedValue(job);

            const { result } = renderHook(() => useJob('job-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.description).toBe('Bearing failure');
            expect(maintenanceService.getJobById).toHaveBeenCalledWith('job-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useJob(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(maintenanceService.getJobById).not.toHaveBeenCalled();
        });

        it('should handle null response (job not found)', async () => {
            vi.mocked(maintenanceService.getJobById).mockResolvedValue(null);

            const { result } = renderHook(() => useJob('nonexistent'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBeNull();
        });

        it('should handle error state', async () => {
            vi.mocked(maintenanceService.getJobById).mockRejectedValue(new Error('Permission denied'));

            const { result } = renderHook(() => useJob('job-403'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Permission denied');
        });
    });

    describe('useCreateJob', () => {
        it('should create a job and return the ID', async () => {
            vi.mocked(maintenanceService.createJob).mockResolvedValue('new-job-id');

            const { result } = renderHook(() => useCreateJob(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    assetId: 'asset-1',
                    jobType: 'BREAKDOWN' as const,
                    priority: 'HIGH' as const,
                    description: 'Pump failure',
                    assignedTo: 'tech-1',
                },
                reportedBy: 'user-1',
                callerRole: 'SUPER_ADMIN' as const,
            };

            const jobId = await result.current.mutateAsync(createData);

            expect(jobId).toBe('new-job-id');
            expect(maintenanceService.createJob).toHaveBeenCalledWith(
                createData.data,
                createData.reportedBy,
                createData.callerRole,
            );
        });

        it('should create a job without optional assignedTo', async () => {
            vi.mocked(maintenanceService.createJob).mockResolvedValue('new-job-id-2');

            const { result } = renderHook(() => useCreateJob(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    assetId: 'asset-2',
                    jobType: 'PREVENTIVE' as const,
                    priority: 'MEDIUM' as const,
                    description: 'Scheduled maintenance',
                },
                reportedBy: 'user-2',
            };

            const jobId = await result.current.mutateAsync(createData);

            expect(jobId).toBe('new-job-id-2');
            expect(maintenanceService.createJob).toHaveBeenCalledWith(
                createData.data,
                createData.reportedBy,
                undefined,
            );
        });

        it('should handle creation error', async () => {
            vi.mocked(maintenanceService.createJob).mockRejectedValue(new Error('Unauthorized'));

            const { result } = renderHook(() => useCreateJob(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    assetId: 'asset-1',
                    jobType: 'BREAKDOWN' as const,
                    priority: 'HIGH' as const,
                    description: 'Test job',
                },
                reportedBy: 'user-1',
            };

            await expect(result.current.mutateAsync(createData)).rejects.toThrow('Unauthorized');
        });
    });

    describe('useUpdateJob', () => {
        it('should update a job status', async () => {
            vi.mocked(maintenanceService.updateJob).mockResolvedValue(undefined);

            const { result } = renderHook(() => useUpdateJob(), {
                wrapper: createWrapper(),
            });

            const updateData = {
                jobId: 'job-123',
                data: {
                    status: 'IN_PROGRESS' as const,
                },
                updatedBy: 'tech-1',
                callerRole: 'MAINTENANCE_TECH' as const,
            };

            await result.current.mutateAsync(updateData);

            expect(maintenanceService.updateJob).toHaveBeenCalledWith(
                updateData.jobId,
                updateData.data,
                updateData.updatedBy,
                updateData.callerRole,
            );
        });

        it('should update job with root cause and action taken', async () => {
            vi.mocked(maintenanceService.updateJob).mockResolvedValue(undefined);

            const { result } = renderHook(() => useUpdateJob(), {
                wrapper: createWrapper(),
            });

            const updateData = {
                jobId: 'job-456',
                data: {
                    status: 'COMPLETED' as const,
                    rootCause: 'Worn bearings',
                    actionTaken: 'Replaced bearings and realigned shaft',
                },
                updatedBy: 'tech-2',
            };

            await result.current.mutateAsync(updateData);

            expect(maintenanceService.updateJob).toHaveBeenCalledWith(
                updateData.jobId,
                updateData.data,
                updateData.updatedBy,
                undefined,
            );
        });

        it('should update job assignment', async () => {
            vi.mocked(maintenanceService.updateJob).mockResolvedValue(undefined);

            const { result } = renderHook(() => useUpdateJob(), {
                wrapper: createWrapper(),
            });

            const updateData = {
                jobId: 'job-789',
                data: {
                    assignedTo: 'tech-3',
                },
                updatedBy: 'supervisor-1',
                callerRole: 'SUPER_ADMIN' as const,
            };

            await result.current.mutateAsync(updateData);

            expect(maintenanceService.updateJob).toHaveBeenCalledWith(
                'job-789',
                { assignedTo: 'tech-3' },
                'supervisor-1',
                'SUPER_ADMIN',
            );
        });

        it('should handle update error', async () => {
            vi.mocked(maintenanceService.updateJob).mockRejectedValue(new Error('Job not found'));

            const { result } = renderHook(() => useUpdateJob(), {
                wrapper: createWrapper(),
            });

            const updateData = {
                jobId: 'nonexistent',
                data: { status: 'CLOSED' as const },
                updatedBy: 'admin',
            };

            await expect(result.current.mutateAsync(updateData)).rejects.toThrow('Job not found');
        });
    });

    describe('useJobStats', () => {
        it('should fetch job statistics', async () => {
            const mockStats = {
                activeJobs: 12,
                criticalJobs: 3,
                pendingParts: 2,
                completedThisMonth: 8,
            };

            vi.mocked(maintenanceService.getJobStats).mockResolvedValue(mockStats);

            const { result } = renderHook(() => useJobStats(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockStats);
            expect(maintenanceService.getJobStats).toHaveBeenCalledTimes(1);
        });

        it('should handle zero stats', async () => {
            const emptyStats = {
                activeJobs: 0,
                criticalJobs: 0,
                pendingParts: 0,
                completedThisMonth: 0,
            };

            vi.mocked(maintenanceService.getJobStats).mockResolvedValue(emptyStats);

            const { result } = renderHook(() => useJobStats(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.activeJobs).toBe(0);
            expect(result.current.data?.criticalJobs).toBe(0);
        });

        it('should handle error state', async () => {
            vi.mocked(maintenanceService.getJobStats).mockRejectedValue(new Error('Stats unavailable'));

            const { result } = renderHook(() => useJobStats(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Stats unavailable');
        });
    });

    describe('useIssuePartsToJob', () => {
        it('should issue parts to a job', async () => {
            vi.mocked(maintenanceService.issuePartsToJob).mockResolvedValue(undefined);

            const { result } = renderHook(() => useIssuePartsToJob(), {
                wrapper: createWrapper(),
            });

            const issueData = {
                data: {
                    jobId: 'job-123',
                    parts: [
                        { partId: 'part-1', quantity: 2 },
                        { partId: 'part-2', quantity: 1 },
                    ],
                },
                issuedBy: 'tech-1',
                callerRole: 'SUPER_ADMIN' as const,
            };

            await result.current.mutateAsync(issueData);

            expect(maintenanceService.issuePartsToJob).toHaveBeenCalledWith(
                issueData.data,
                issueData.issuedBy,
                issueData.callerRole,
            );
        });

        it('should issue a single part to a job', async () => {
            vi.mocked(maintenanceService.issuePartsToJob).mockResolvedValue(undefined);

            const { result } = renderHook(() => useIssuePartsToJob(), {
                wrapper: createWrapper(),
            });

            const issueData = {
                data: {
                    jobId: 'job-456',
                    parts: [{ partId: 'part-3', quantity: 5 }],
                },
                issuedBy: 'tech-2',
            };

            await result.current.mutateAsync(issueData);

            expect(maintenanceService.issuePartsToJob).toHaveBeenCalledWith(
                issueData.data,
                issueData.issuedBy,
                undefined,
            );
        });

        it('should handle insufficient stock error', async () => {
            vi.mocked(maintenanceService.issuePartsToJob).mockRejectedValue(
                new Error('Insufficient stock for Motor 5HP: available 1, requested 3'),
            );

            const { result } = renderHook(() => useIssuePartsToJob(), {
                wrapper: createWrapper(),
            });

            const issueData = {
                data: {
                    jobId: 'job-789',
                    parts: [{ partId: 'part-1', quantity: 3 }],
                },
                issuedBy: 'tech-1',
            };

            await expect(result.current.mutateAsync(issueData)).rejects.toThrow('Insufficient stock for Motor 5HP');
        });

        it('should handle job not found error', async () => {
            vi.mocked(maintenanceService.issuePartsToJob).mockRejectedValue(new Error('Job not found'));

            const { result } = renderHook(() => useIssuePartsToJob(), {
                wrapper: createWrapper(),
            });

            const issueData = {
                data: {
                    jobId: 'nonexistent',
                    parts: [{ partId: 'part-1', quantity: 1 }],
                },
                issuedBy: 'tech-1',
            };

            await expect(result.current.mutateAsync(issueData)).rejects.toThrow('Job not found');
        });
    });

    describe('maintenanceKeys', () => {
        it('should generate correct base key', () => {
            expect(maintenanceKeys.all).toEqual(['maintenance']);
        });

        it('should generate correct jobs list key', () => {
            expect(maintenanceKeys.jobs()).toEqual(['maintenance', 'jobs']);
        });

        it('should generate correct jobs-by-asset key', () => {
            expect(maintenanceKeys.jobsByAsset('asset-1')).toEqual(['maintenance', 'jobs', 'asset', 'asset-1']);
        });

        it('should generate correct job detail key', () => {
            expect(maintenanceKeys.jobDetail('job-123')).toEqual(['maintenance', 'job', 'job-123']);
        });

        it('should generate correct stats key', () => {
            expect(maintenanceKeys.stats()).toEqual(['maintenance', 'stats']);
        });

        it('should nest all keys under the maintenance namespace', () => {
            expect(maintenanceKeys.all[0]).toBe('maintenance');
            expect(maintenanceKeys.jobs()[0]).toBe('maintenance');
            expect(maintenanceKeys.jobsByAsset('x')[0]).toBe('maintenance');
            expect(maintenanceKeys.jobDetail('x')[0]).toBe('maintenance');
            expect(maintenanceKeys.stats()[0]).toBe('maintenance');
        });

        it('should produce unique keys for different assets', () => {
            const key1 = maintenanceKeys.jobsByAsset('asset-1');
            const key2 = maintenanceKeys.jobsByAsset('asset-2');
            expect(key1).not.toEqual(key2);
        });

        it('should produce unique keys for different job IDs', () => {
            const key1 = maintenanceKeys.jobDetail('job-1');
            const key2 = maintenanceKeys.jobDetail('job-2');
            expect(key1).not.toEqual(key2);
        });
    });
});
