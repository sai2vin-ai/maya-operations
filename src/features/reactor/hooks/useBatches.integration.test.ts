import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useBatches,
    useBatch,
    useBatchesByReactor,
    useActiveBatch,
    useReactors,
    useReactor,
    useCreateBatch,
    useCompleteStep,
    useRecordOutput,
    useCancelBatch,
    batchKeys,
    reactorKeys,
} from './useBatches';
import { createWrapper, mockBatch, mockReactor } from '../../../test/test-utils';
import * as batchService from '../services/batchService';
import * as reactorService from '../services/reactorService';

// Mock the batch service
vi.mock('../services/batchService', () => ({
    getBatches: vi.fn(),
    getBatchById: vi.fn(),
    getBatchesByReactor: vi.fn(),
    getActiveBatch: vi.fn(),
    createBatch: vi.fn(),
    completeStep: vi.fn(),
    recordOutput: vi.fn(),
    cancelBatch: vi.fn(),
    BATCH_STEPS: [
        { stepNumber: 1, stepName: 'CLEANING' },
        { stepNumber: 2, stepName: 'INSPECTION' },
    ],
    BATCH_STATUSES: [
        { value: 'IN_PROGRESS', label: 'In Progress', color: 'green' },
        { value: 'COMPLETED', label: 'Completed', color: 'gray' },
    ],
}));

// Mock the reactor service
vi.mock('../services/reactorService', () => ({
    getReactors: vi.fn(),
    getReactorById: vi.fn(),
}));

describe('useBatches hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useBatches', () => {
        it('should fetch and return batches', async () => {
            const mockBatches = [
                mockBatch({ id: '1', batchNumber: 'M1-20260128-001' }),
                mockBatch({ id: '2', batchNumber: 'M1-20260128-002' }),
            ];

            vi.mocked(batchService.getBatches).mockResolvedValue(mockBatches);

            const { result } = renderHook(() => useBatches(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(batchService.getBatches).toHaveBeenCalledTimes(1);
        });

        it('should pass limit parameter', async () => {
            vi.mocked(batchService.getBatches).mockResolvedValue([]);

            const { result } = renderHook(() => useBatches(10), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(batchService.getBatches).toHaveBeenCalledWith(10);
        });
    });

    describe('useBatch', () => {
        it('should fetch a single batch by ID', async () => {
            const batch = mockBatch({ id: 'batch-123', batchNumber: 'M1-20260128-001' });
            vi.mocked(batchService.getBatchById).mockResolvedValue(batch);

            const { result } = renderHook(() => useBatch('batch-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.batchNumber).toBe('M1-20260128-001');
            expect(batchService.getBatchById).toHaveBeenCalledWith('batch-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useBatch(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(batchService.getBatchById).not.toHaveBeenCalled();
        });
    });

    describe('useBatchesByReactor', () => {
        it('should fetch batches for a specific reactor', async () => {
            const mockBatches = [
                mockBatch({ id: '1', reactorId: 'reactor-1' }),
                mockBatch({ id: '2', reactorId: 'reactor-1' }),
            ];

            vi.mocked(batchService.getBatchesByReactor).mockResolvedValue(mockBatches);

            const { result } = renderHook(() => useBatchesByReactor('reactor-1'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(batchService.getBatchesByReactor).toHaveBeenCalledWith('reactor-1');
        });

        it('should not fetch when reactor ID is undefined', async () => {
            const { result } = renderHook(() => useBatchesByReactor(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(batchService.getBatchesByReactor).not.toHaveBeenCalled();
        });
    });

    describe('useActiveBatch', () => {
        it('should fetch active batch for a reactor', async () => {
            const activeBatch = mockBatch({ id: 'active-1', status: 'IN_PROGRESS' });
            vi.mocked(batchService.getActiveBatch).mockResolvedValue(activeBatch);

            const { result } = renderHook(() => useActiveBatch('reactor-1'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.status).toBe('IN_PROGRESS');
            expect(batchService.getActiveBatch).toHaveBeenCalledWith('reactor-1');
        });

        it('should return null when no active batch exists', async () => {
            vi.mocked(batchService.getActiveBatch).mockResolvedValue(null);

            const { result } = renderHook(() => useActiveBatch('reactor-1'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBeNull();
        });
    });

    describe('useReactors', () => {
        it('should fetch and return reactors', async () => {
            const mockReactors = [
                mockReactor({ id: '1', reactorNumber: 'M1' }),
                mockReactor({ id: '2', reactorNumber: 'M2' }),
            ];

            vi.mocked(reactorService.getReactors).mockResolvedValue(mockReactors);

            const { result } = renderHook(() => useReactors(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(reactorService.getReactors).toHaveBeenCalledTimes(1);
        });
    });

    describe('useReactor', () => {
        it('should fetch a single reactor by ID', async () => {
            const reactor = mockReactor({ id: 'reactor-123', reactorNumber: 'M1' });
            vi.mocked(reactorService.getReactorById).mockResolvedValue(reactor);

            const { result } = renderHook(() => useReactor('reactor-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.reactorNumber).toBe('M1');
            expect(reactorService.getReactorById).toHaveBeenCalledWith('reactor-123');
        });
    });

    describe('useCreateBatch', () => {
        it('should create a new batch', async () => {
            vi.mocked(batchService.createBatch).mockResolvedValue('new-batch-id');

            const { result } = renderHook(() => useCreateBatch(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    reactorId: 'reactor-1',
                    reactorNumber: 'M1',
                    inputWeight: 8000,
                    notes: 'Test batch',
                },
                createdBy: 'admin',
            };

            await result.current.mutateAsync(createData);

            expect(batchService.createBatch).toHaveBeenCalledWith(
                createData.data,
                createData.createdBy
            );
        });
    });

    describe('useCompleteStep', () => {
        it('should complete a batch step', async () => {
            vi.mocked(batchService.completeStep).mockResolvedValue(undefined);

            const { result } = renderHook(() => useCompleteStep(), {
                wrapper: createWrapper(),
            });

            const stepData = {
                batchId: 'batch-123',
                stepData: {
                    stepNumber: 1,
                    notes: 'Cleaning completed',
                    photoUrls: ['http://photo.url/1.jpg'],
                },
                completedBy: 'admin',
            };

            await result.current.mutateAsync(stepData);

            expect(batchService.completeStep).toHaveBeenCalledWith(
                'batch-123',
                stepData.stepData,
                'admin'
            );
        });
    });

    describe('useRecordOutput', () => {
        it('should record batch output', async () => {
            vi.mocked(batchService.recordOutput).mockResolvedValue(undefined);

            const { result } = renderHook(() => useRecordOutput(), {
                wrapper: createWrapper(),
            });

            const outputData = {
                batchId: 'batch-123',
                outputData: {
                    materialCategory: 'CB-STD' as const,
                    quantity: 500,
                    unit: 'KG' as const,
                    qualityGrade: 'A',
                },
                recordedBy: 'admin',
            };

            await result.current.mutateAsync(outputData);

            expect(batchService.recordOutput).toHaveBeenCalledWith(
                'batch-123',
                outputData.outputData,
                'admin'
            );
        });
    });

    describe('useCancelBatch', () => {
        it('should cancel a batch with reason', async () => {
            vi.mocked(batchService.cancelBatch).mockResolvedValue(undefined);

            const { result } = renderHook(() => useCancelBatch(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                batchId: 'batch-123',
                reason: 'Equipment malfunction',
                cancelledBy: 'admin',
            });

            expect(batchService.cancelBatch).toHaveBeenCalledWith(
                'batch-123',
                'Equipment malfunction',
                'admin'
            );
        });
    });

    describe('batchKeys', () => {
        it('should generate correct query keys', () => {
            expect(batchKeys.all).toEqual(['batches']);
            expect(batchKeys.lists()).toEqual(['batches', 'list']);
            expect(batchKeys.list({ status: 'IN_PROGRESS' })).toEqual([
                'batches',
                'list',
                { status: 'IN_PROGRESS' },
            ]);
            expect(batchKeys.details()).toEqual(['batches', 'detail']);
            expect(batchKeys.detail('123')).toEqual(['batches', 'detail', '123']);
            expect(batchKeys.byReactor('reactor-1')).toEqual(['batches', 'reactor', 'reactor-1']);
            expect(batchKeys.active('reactor-1')).toEqual(['batches', 'active', 'reactor-1']);
        });
    });

    describe('reactorKeys', () => {
        it('should generate correct query keys', () => {
            expect(reactorKeys.all).toEqual(['reactors']);
            expect(reactorKeys.lists()).toEqual(['reactors', 'list']);
            expect(reactorKeys.details()).toEqual(['reactors', 'detail']);
            expect(reactorKeys.detail('123')).toEqual(['reactors', 'detail', '123']);
        });
    });
});
