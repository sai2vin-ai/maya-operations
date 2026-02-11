import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEVICE_TYPES, OPERATING_SYSTEMS, DEVICE_STATUSES } from './deviceService';

// Mock firebase/firestore at the SDK level
const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
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

describe('deviceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('DEVICE_TYPES', () => {
        it('should have all required device types', () => {
            const typeValues = DEVICE_TYPES.map((t) => t.value);
            expect(typeValues).toContain('MOBILE');
            expect(typeValues).toContain('TABLET');
            expect(typeValues).toContain('DESKTOP');
            expect(typeValues).toContain('SCANNER');
        });

        it('should have exactly 4 device types', () => {
            expect(DEVICE_TYPES).toHaveLength(4);
        });

        it('should have labels for all types', () => {
            DEVICE_TYPES.forEach((type) => {
                expect(type.label).toBeDefined();
                expect(typeof type.label).toBe('string');
                expect(type.label.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            const mobile = DEVICE_TYPES.find((t) => t.value === 'MOBILE');
            expect(mobile?.label).toBe('Mobile Phone');

            const scanner = DEVICE_TYPES.find((t) => t.value === 'SCANNER');
            expect(scanner?.label).toBe('Barcode Scanner');
        });
    });

    describe('OPERATING_SYSTEMS', () => {
        it('should have all required operating systems', () => {
            const osValues = OPERATING_SYSTEMS.map((os) => os.value);
            expect(osValues).toContain('ANDROID');
            expect(osValues).toContain('IOS');
            expect(osValues).toContain('WINDOWS');
            expect(osValues).toContain('MACOS');
            expect(osValues).toContain('LINUX');
        });

        it('should have exactly 5 operating systems', () => {
            expect(OPERATING_SYSTEMS).toHaveLength(5);
        });

        it('should have labels for all operating systems', () => {
            OPERATING_SYSTEMS.forEach((os) => {
                expect(os.label).toBeDefined();
                expect(typeof os.label).toBe('string');
            });
        });

        it('should have correct labels', () => {
            const android = OPERATING_SYSTEMS.find((os) => os.value === 'ANDROID');
            expect(android?.label).toBe('Android');

            const ios = OPERATING_SYSTEMS.find((os) => os.value === 'IOS');
            expect(ios?.label).toBe('iOS');

            const macos = OPERATING_SYSTEMS.find((os) => os.value === 'MACOS');
            expect(macos?.label).toBe('macOS');
        });
    });

    describe('DEVICE_STATUSES', () => {
        it('should have all required statuses', () => {
            const statusValues = DEVICE_STATUSES.map((s) => s.value);
            expect(statusValues).toContain('ACTIVE');
            expect(statusValues).toContain('INACTIVE');
            expect(statusValues).toContain('REVOKED');
        });

        it('should have exactly 3 statuses', () => {
            expect(DEVICE_STATUSES).toHaveLength(3);
        });

        it('should have labels for all statuses', () => {
            DEVICE_STATUSES.forEach((status) => {
                expect(status.label).toBeDefined();
                expect(typeof status.label).toBe('string');
            });
        });

        it('should have unique values', () => {
            const values = DEVICE_STATUSES.map((s) => s.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });
    });

    describe('createDevice', () => {
        it('should create device and return deviceId', async () => {
            mockSetDoc.mockResolvedValue(undefined);

            const { createDevice } = await import('./deviceService');

            const result = await createDevice(
                {
                    deviceId: 'device-123',
                    name: 'Test Device',
                    deviceType: 'MOBILE',
                    os: 'ANDROID',
                    osVersion: '13',
                    appVersion: '1.0.0',
                },
                'user-1',
            );

            expect(result).toBe('device-123');
            expect(mockSetDoc).toHaveBeenCalledTimes(1);
            const docData = mockSetDoc.mock.calls[0][1];
            expect(docData.deviceId).toBe('device-123');
            expect(docData.name).toBe('Test Device');
            expect(docData.deviceType).toBe('MOBILE');
            expect(docData.os).toBe('ANDROID');
            expect(docData.status).toBe('ACTIVE');
            expect(docData.registeredBy).toBe('user-1');
            expect(docData.registeredAt).toBeDefined();
        });
    });

    describe('updateDevice', () => {
        it('should call updateDoc with correct data', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { updateDevice } = await import('./deviceService');

            await updateDevice('device-123', { name: 'Updated Device', osVersion: '14' });

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.name).toBe('Updated Device');
            expect(updateArgs.osVersion).toBe('14');
        });
    });

    describe('deactivateDevice', () => {
        it('should set status to INACTIVE', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { deactivateDevice } = await import('./deviceService');

            await deactivateDevice('device-123');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.status).toBe('INACTIVE');
        });
    });

    describe('activateDevice', () => {
        it('should set status to ACTIVE', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { activateDevice } = await import('./deviceService');

            await activateDevice('device-123');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.status).toBe('ACTIVE');
        });
    });

    describe('revokeDevice', () => {
        it('should set status to REVOKED', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { revokeDevice } = await import('./deviceService');

            await revokeDevice('device-123');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.status).toBe('REVOKED');
        });
    });

    describe('getDeviceById', () => {
        it('should return device when exists', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'device-123',
                data: () => ({
                    deviceId: 'device-123',
                    name: 'Test Device',
                    deviceType: 'MOBILE',
                    os: 'ANDROID',
                    status: 'ACTIVE',
                }),
            });

            const { getDeviceById } = await import('./deviceService');

            const result = await getDeviceById('device-123');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('device-123');
            expect(result?.name).toBe('Test Device');
            expect(result?.deviceType).toBe('MOBILE');
        });

        it('should return null when not found', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => false,
            });

            const { getDeviceById } = await import('./deviceService');

            const result = await getDeviceById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getDevices', () => {
        it('should return all devices', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'device-1',
                        data: () => ({ name: 'Device 1', status: 'ACTIVE' }),
                    },
                    {
                        id: 'device-2',
                        data: () => ({ name: 'Device 2', status: 'INACTIVE' }),
                    },
                ],
            });

            const { getDevices } = await import('./deviceService');

            const result = await getDevices();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('device-1');
            expect(result[0].name).toBe('Device 1');
            expect(result[1].id).toBe('device-2');
            expect(result[1].name).toBe('Device 2');
        });
    });

    describe('getActiveDevicesCount', () => {
        it('should return count', async () => {
            mockGetDocs.mockResolvedValue({
                size: 5,
            });

            const { getActiveDevicesCount } = await import('./deviceService');

            const result = await getActiveDevicesCount();

            expect(result).toBe(5);
        });
    });
});
