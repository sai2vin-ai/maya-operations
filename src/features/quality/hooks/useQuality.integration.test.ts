import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useQualityChecks,
    useQualityChecksByBatch,
    useQualityCheck,
    useCreateQualityCheck,
    useUpdateQualityCheck,
    useQCStats,
    qualityKeys,
} from './useQuality';
import { createWrapper, mockTimestamp } from '../../../test/test-utils';
import * as qualityService from '../services/qualityService';
import type { QualityCheck } from '../services/qualityService';

// Mock the quality service
vi.mock('../services/qualityService', () => ({
    getQualityChecks: vi.fn(),
    getQualityChecksByBatch: vi.fn(),
    getQualityCheckById: vi.fn(),
    createQualityCheck: vi.fn(),
    updateQualityCheck: vi.fn(),
    getQCStats: vi.fn(),
    QC_STATUS_CONFIG: {
        PENDING: { label: 'Pending', color: 'bg-blue-500/20 text-blue-400' },
        PASSED: { label: 'Passed', color: 'bg-green-500/20 text-green-400' },
        FAILED: { label: 'Failed', color: 'bg-red-500/20 text-red-400' },
        ON_HOLD: { label: 'On Hold', color: 'bg-yellow-500/20 text-yellow-400' },
    },
    QC_CHECK_TYPES: [
        { value: 'VISUAL', label: 'Visual Inspection' },
        { value: 'MEASUREMENT', label: 'Measurement' },
        { value: 'CHEMICAL', label: 'Chemical Analysis' },
        { value: 'PHYSICAL', label: 'Physical Test' },
    ],
    DEFAULT_PARAMETERS: {},
}));

// Helper to create mock quality check data
function mockQualityCheck(overrides: Partial<QualityCheck> = {}): QualityCheck {
    return {
        id: 'qc-1',
        checkNumber: 'QC-2026-0001',
        batchId: 'batch-1',
        batchNumber: 'M1-20260128-001',
        checkType: 'VISUAL',
        status: 'PENDING',
        parameters: [
            { name: 'Color', expected: 'Dark Brown', actual: 'Dark Brown', passed: true },
            { name: 'Viscosity', expected: '< 5 cSt', actual: '4.2 cSt', passed: true },
        ],
        inspector: 'inspector-1',
        inspectedAt: mockTimestamp(),
        notes: 'Initial inspection',
        createdAt: mockTimestamp(),
        createdBy: 'inspector-1',
        updatedAt: mockTimestamp(),
        updatedBy: 'inspector-1',
        ...overrides,
    };
}

describe('useQuality hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useQualityChecks', () => {
        it('should fetch and return quality checks', async () => {
            const mockChecks = [
                mockQualityCheck({ id: 'qc-1', checkNumber: 'QC-2026-0001', status: 'PASSED' }),
                mockQualityCheck({ id: 'qc-2', checkNumber: 'QC-2026-0002', status: 'FAILED' }),
            ];

            vi.mocked(qualityService.getQualityChecks).mockResolvedValue(mockChecks);

            const { result } = renderHook(() => useQualityChecks(), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(qualityService.getQualityChecks).toHaveBeenCalledTimes(1);
        });

        it('should handle error state', async () => {
            vi.mocked(qualityService.getQualityChecks).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useQualityChecks(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Network error');
        });

        it('should return empty array when no checks exist', async () => {
            vi.mocked(qualityService.getQualityChecks).mockResolvedValue([]);

            const { result } = renderHook(() => useQualityChecks(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(0);
        });
    });

    describe('useQualityChecksByBatch', () => {
        it('should fetch quality checks for a specific batch', async () => {
            const mockChecks = [
                mockQualityCheck({ id: 'qc-1', batchId: 'batch-1' }),
                mockQualityCheck({ id: 'qc-2', batchId: 'batch-1' }),
            ];

            vi.mocked(qualityService.getQualityChecksByBatch).mockResolvedValue(mockChecks);

            const { result } = renderHook(() => useQualityChecksByBatch('batch-1'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(qualityService.getQualityChecksByBatch).toHaveBeenCalledWith('batch-1');
        });

        it('should not fetch when batchId is undefined', async () => {
            const { result } = renderHook(() => useQualityChecksByBatch(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(qualityService.getQualityChecksByBatch).not.toHaveBeenCalled();
        });
    });

    describe('useQualityCheck', () => {
        it('should fetch a single quality check by ID', async () => {
            const check = mockQualityCheck({ id: 'qc-123', checkNumber: 'QC-2026-0042' });
            vi.mocked(qualityService.getQualityCheckById).mockResolvedValue(check);

            const { result } = renderHook(() => useQualityCheck('qc-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.checkNumber).toBe('QC-2026-0042');
            expect(qualityService.getQualityCheckById).toHaveBeenCalledWith('qc-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useQualityCheck(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(qualityService.getQualityCheckById).not.toHaveBeenCalled();
        });

        it('should return null when check does not exist', async () => {
            vi.mocked(qualityService.getQualityCheckById).mockResolvedValue(null);

            const { result } = renderHook(() => useQualityCheck('nonexistent'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBeNull();
        });
    });

    describe('useCreateQualityCheck', () => {
        it('should create a quality check and return the ID', async () => {
            vi.mocked(qualityService.createQualityCheck).mockResolvedValue('new-qc-id');

            const { result } = renderHook(() => useCreateQualityCheck(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    batchId: 'batch-1',
                    batchNumber: 'M1-20260128-001',
                    checkType: 'VISUAL' as const,
                    parameters: [{ name: 'Color', expected: 'Dark Brown', actual: 'Dark Brown', passed: true }],
                    notes: 'Test inspection',
                },
                inspector: 'inspector-1',
            };

            const resultId = await result.current.mutateAsync(createData);

            expect(resultId).toBe('new-qc-id');
            expect(qualityService.createQualityCheck).toHaveBeenCalledWith(createData.data, createData.inspector);
        });

        it('should handle creation failure', async () => {
            vi.mocked(qualityService.createQualityCheck).mockRejectedValue(new Error('Failed to create quality check'));

            const { result } = renderHook(() => useCreateQualityCheck(), {
                wrapper: createWrapper(),
            });

            await expect(
                result.current.mutateAsync({
                    data: {
                        batchId: 'batch-1',
                        batchNumber: 'M1-20260128-001',
                        checkType: 'MEASUREMENT' as const,
                        parameters: [],
                    },
                    inspector: 'inspector-1',
                }),
            ).rejects.toThrow('Failed to create quality check');
        });
    });

    describe('useUpdateQualityCheck', () => {
        it('should update quality check status', async () => {
            vi.mocked(qualityService.updateQualityCheck).mockResolvedValue(undefined);

            const { result } = renderHook(() => useUpdateQualityCheck(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                checkId: 'qc-123',
                data: { status: 'PASSED' },
                updatedBy: 'inspector-1',
            });

            expect(qualityService.updateQualityCheck).toHaveBeenCalledWith(
                'qc-123',
                { status: 'PASSED' },
                'inspector-1',
            );
        });

        it('should update quality check parameters', async () => {
            vi.mocked(qualityService.updateQualityCheck).mockResolvedValue(undefined);

            const { result } = renderHook(() => useUpdateQualityCheck(), {
                wrapper: createWrapper(),
            });

            const updatedParams = [
                { name: 'Color', expected: 'Dark Brown', actual: 'Dark Brown', passed: true },
                { name: 'Viscosity', expected: '< 5 cSt', actual: '3.8 cSt', passed: true },
            ];

            await result.current.mutateAsync({
                checkId: 'qc-123',
                data: { parameters: updatedParams },
                updatedBy: 'inspector-2',
            });

            expect(qualityService.updateQualityCheck).toHaveBeenCalledWith(
                'qc-123',
                { parameters: updatedParams },
                'inspector-2',
            );
        });

        it('should update quality check notes', async () => {
            vi.mocked(qualityService.updateQualityCheck).mockResolvedValue(undefined);

            const { result } = renderHook(() => useUpdateQualityCheck(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                checkId: 'qc-123',
                data: { notes: 'Updated notes after re-inspection' },
                updatedBy: 'inspector-1',
            });

            expect(qualityService.updateQualityCheck).toHaveBeenCalledWith(
                'qc-123',
                { notes: 'Updated notes after re-inspection' },
                'inspector-1',
            );
        });

        it('should handle update failure', async () => {
            vi.mocked(qualityService.updateQualityCheck).mockRejectedValue(new Error('Update failed'));

            const { result } = renderHook(() => useUpdateQualityCheck(), {
                wrapper: createWrapper(),
            });

            await expect(
                result.current.mutateAsync({
                    checkId: 'qc-123',
                    data: { status: 'FAILED' },
                    updatedBy: 'inspector-1',
                }),
            ).rejects.toThrow('Update failed');
        });
    });

    describe('useQCStats', () => {
        it('should fetch quality check statistics', async () => {
            const mockStats = {
                totalChecks: 50,
                passed: 40,
                failed: 5,
                pending: 5,
                passRate: 80,
            };

            vi.mocked(qualityService.getQCStats).mockResolvedValue(mockStats);

            const { result } = renderHook(() => useQCStats(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockStats);
            expect(qualityService.getQCStats).toHaveBeenCalledTimes(1);
        });

        it('should handle stats fetch error', async () => {
            vi.mocked(qualityService.getQCStats).mockRejectedValue(new Error('Stats error'));

            const { result } = renderHook(() => useQCStats(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Stats error');
        });
    });

    describe('qualityKeys', () => {
        it('should generate correct query keys', () => {
            expect(qualityKeys.all).toEqual(['quality']);
            expect(qualityKeys.lists()).toEqual(['quality', 'list']);
            expect(qualityKeys.byBatch('batch-123')).toEqual(['quality', 'batch', 'batch-123']);
            expect(qualityKeys.detail('qc-456')).toEqual(['quality', 'detail', 'qc-456']);
            expect(qualityKeys.stats()).toEqual(['quality', 'stats']);
        });
    });
});
