import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetDocs, mockGetDoc, mockAddDoc, mockUpdateDoc } = vi.hoisted(() => ({
    mockGetDocs: vi.fn(),
    mockGetDoc: vi.fn(),
    mockAddDoc: vi.fn(),
    mockUpdateDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDocs: mockGetDocs,
    getDoc: mockGetDoc,
    setDoc: vi.fn(),
    updateDoc: mockUpdateDoc,
    addDoc: mockAddDoc,
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
        fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    },
    runTransaction: vi.fn(),
}));
vi.mock('../../../lib/firebase', () => ({ db: {} }));

describe('shiftService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });
    });

    describe('SHIFT_TYPES', () => {
        it('should have A, B, C shifts', async () => {
            const { SHIFT_TYPES } = await import('./shiftService');
            const values = SHIFT_TYPES.map((s) => s.value);
            expect(values).toContain('A');
            expect(values).toContain('B');
            expect(values).toContain('C');
            expect(SHIFT_TYPES).toHaveLength(3);
        });
    });

    describe('startShift', () => {
        it('should create shift and return id', async () => {
            mockAddDoc.mockResolvedValue({ id: 'new-shift-id' });

            const { startShift } = await import('./shiftService');

            const result = await startShift(
                {
                    shiftType: 'A',
                    supervisorId: 'supervisor-1',
                },
                'user-1',
            );

            expect(result).toBe('new-shift-id');
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            const shiftData = mockAddDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(shiftData.shiftType).toBe('A');
            expect(shiftData.supervisorId).toBe('supervisor-1');
            expect(shiftData.createdBy).toBe('user-1');
        });

        it('should set endTime to null', async () => {
            mockAddDoc.mockResolvedValue({ id: 'new-shift-id' });

            const { startShift } = await import('./shiftService');

            await startShift(
                {
                    shiftType: 'B',
                    supervisorId: 'supervisor-1',
                },
                'user-1',
            );

            const shiftData = mockAddDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(shiftData.endTime).toBeNull();
            expect(shiftData.handoverNotes).toBeNull();
            expect(shiftData.handoverAcknowledged).toBe(false);
        });
    });

    describe('endShift', () => {
        it('should set endTime and handoverNotes', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { endShift } = await import('./shiftService');

            await endShift(
                'shift-1',
                {
                    handoverNotes: 'All tasks completed',
                },
                'user-1',
            );

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateData = mockUpdateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(updateData.handoverNotes).toBe('All tasks completed');
            expect(updateData.endTime).toBeDefined();
            expect(updateData.updatedBy).toBe('user-1');
        });

        it('should set incomingSupervisorId when provided', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { endShift } = await import('./shiftService');

            await endShift(
                'shift-1',
                {
                    handoverNotes: 'Handover to next shift',
                    incomingSupervisorId: 'supervisor-2',
                },
                'user-1',
            );

            const updateData = mockUpdateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(updateData.incomingSupervisorId).toBe('supervisor-2');
        });
    });

    describe('acknowledgeHandover', () => {
        it('should set handoverAcknowledged to true', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { acknowledgeHandover } = await import('./shiftService');

            await acknowledgeHandover('shift-1', 'user-2');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateData = mockUpdateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
            expect(updateData.handoverAcknowledged).toBe(true);
            expect(updateData.updatedBy).toBe('user-2');
        });
    });

    describe('getShifts', () => {
        it('should return shifts', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'shift-1',
                        data: () => ({
                            shiftType: 'A',
                            supervisorId: 'supervisor-1',
                            endTime: null,
                        }),
                    },
                    {
                        id: 'shift-2',
                        data: () => ({
                            shiftType: 'B',
                            supervisorId: 'supervisor-2',
                            endTime: { seconds: 1700000000 },
                        }),
                    },
                ],
            });

            const { getShifts } = await import('./shiftService');

            const shifts = await getShifts();

            expect(shifts).toHaveLength(2);
            expect(shifts[0].id).toBe('shift-1');
            expect(shifts[1].id).toBe('shift-2');
        });
    });

    describe('getShiftById', () => {
        it('should return null when not found', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => false,
            });

            const { getShiftById } = await import('./shiftService');

            const result = await getShiftById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getActiveShift', () => {
        it('should return null when no active shift', async () => {
            mockGetDocs.mockResolvedValue({
                empty: true,
                docs: [],
            });

            const { getActiveShift } = await import('./shiftService');

            const result = await getActiveShift();

            expect(result).toBeNull();
        });
    });
});
