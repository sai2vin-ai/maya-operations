import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDevices, useDevice, useCreateDevice, useUpdateDevice, useToggleDeviceStatus, deviceKeys } from './useDevices';
import { createWrapper, mockDevice } from '../../../test/test-utils';
import * as deviceService from '../services/deviceService';

// Mock the device service
vi.mock('../services/deviceService', () => ({
    getDevices: vi.fn(),
    getDeviceById: vi.fn(),
    createDevice: vi.fn(),
    updateDevice: vi.fn(),
    deactivateDevice: vi.fn(),
    activateDevice: vi.fn(),
}));

describe('useDevices hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useDevices', () => {
        it('should fetch and return devices', async () => {
            const mockDevices = [
                mockDevice({ id: '1', name: 'Device 1', status: 'ACTIVE' }),
                mockDevice({ id: '2', name: 'Device 2', status: 'INACTIVE' }),
            ];

            vi.mocked(deviceService.getDevices).mockResolvedValue(mockDevices);

            const { result } = renderHook(() => useDevices(), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(deviceService.getDevices).toHaveBeenCalledTimes(1);
        });

        it('should filter devices by active status', async () => {
            const mockDevices = [
                mockDevice({ id: '1', name: 'Active Device', status: 'ACTIVE' }),
                mockDevice({ id: '2', name: 'Inactive Device', status: 'INACTIVE' }),
            ];

            vi.mocked(deviceService.getDevices).mockResolvedValue(mockDevices);

            const { result } = renderHook(
                () => useDevices({ status: 'active' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Active Device');
        });

        it('should filter devices by inactive status', async () => {
            const mockDevices = [
                mockDevice({ id: '1', name: 'Active Device', status: 'ACTIVE' }),
                mockDevice({ id: '2', name: 'Inactive Device', status: 'INACTIVE' }),
            ];

            vi.mocked(deviceService.getDevices).mockResolvedValue(mockDevices);

            const { result } = renderHook(
                () => useDevices({ status: 'inactive' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Inactive Device');
        });

        it('should filter devices by search query on name', async () => {
            const mockDevices = [
                mockDevice({ id: '1', name: 'Gate Scanner', deviceId: 'DEV-001', deviceType: 'TABLET' }),
                mockDevice({ id: '2', name: 'Control Panel', deviceId: 'DEV-002', deviceType: 'DESKTOP' }),
            ];

            vi.mocked(deviceService.getDevices).mockResolvedValue(mockDevices);

            const { result } = renderHook(
                () => useDevices({ searchQuery: 'scanner' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Gate Scanner');
        });

        it('should filter devices by search query on deviceId', async () => {
            const mockDevices = [
                mockDevice({ id: '1', name: 'Device A', deviceId: 'DEV-001' }),
                mockDevice({ id: '2', name: 'Device B', deviceId: 'DEV-002' }),
            ];

            vi.mocked(deviceService.getDevices).mockResolvedValue(mockDevices);

            const { result } = renderHook(
                () => useDevices({ searchQuery: 'DEV-001' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].deviceId).toBe('DEV-001');
        });

        it('should filter devices by search query on device type', async () => {
            const mockDevices = [
                mockDevice({ id: '1', name: 'Phone', deviceType: 'MOBILE' }),
                mockDevice({ id: '2', name: 'Tab', deviceType: 'TABLET' }),
            ];

            vi.mocked(deviceService.getDevices).mockResolvedValue(mockDevices);

            const { result } = renderHook(
                () => useDevices({ searchQuery: 'tablet' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].deviceType).toBe('TABLET');
        });

        it('should filter devices by search query on location', async () => {
            const mockDevices = [
                mockDevice({ id: '1', name: 'Device A', location: 'Gate House' }),
                mockDevice({ id: '2', name: 'Device B', location: 'Control Room' }),
            ];

            vi.mocked(deviceService.getDevices).mockResolvedValue(mockDevices);

            const { result } = renderHook(
                () => useDevices({ searchQuery: 'gate' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].location).toBe('Gate House');
        });

        it('should handle error state', async () => {
            vi.mocked(deviceService.getDevices).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useDevices(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Network error');
        });
    });

    describe('useDevice', () => {
        it('should fetch a single device by ID', async () => {
            const device = mockDevice({ id: 'device-123', name: 'Test Device' });
            vi.mocked(deviceService.getDeviceById).mockResolvedValue(device);

            const { result } = renderHook(() => useDevice('device-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.name).toBe('Test Device');
            expect(deviceService.getDeviceById).toHaveBeenCalledWith('device-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useDevice(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(deviceService.getDeviceById).not.toHaveBeenCalled();
        });
    });

    describe('useCreateDevice', () => {
        it('should create a device and return the ID', async () => {
            vi.mocked(deviceService.createDevice).mockResolvedValue('new-device-id');

            const { result } = renderHook(() => useCreateDevice(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    deviceId: 'DEV-NEW-001',
                    name: 'New Device',
                    deviceType: 'MOBILE' as const,
                    os: 'ANDROID' as const,
                    osVersion: '13',
                    appVersion: '1.0.0',
                },
                registeredBy: 'admin',
            };

            await result.current.mutateAsync(createData);

            expect(deviceService.createDevice).toHaveBeenCalledWith(
                createData.data,
                createData.registeredBy
            );
        });
    });

    describe('useUpdateDevice', () => {
        it('should update a device', async () => {
            vi.mocked(deviceService.updateDevice).mockResolvedValue(undefined);

            const { result } = renderHook(() => useUpdateDevice(), {
                wrapper: createWrapper(),
            });

            const updateData = {
                deviceId: 'device-123',
                data: {
                    name: 'Updated Device',
                    location: 'New Location',
                },
            };

            await result.current.mutateAsync(updateData);

            expect(deviceService.updateDevice).toHaveBeenCalledWith(
                updateData.deviceId,
                updateData.data
            );
        });
    });

    describe('useToggleDeviceStatus', () => {
        it('should deactivate an active device', async () => {
            vi.mocked(deviceService.deactivateDevice).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleDeviceStatus(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                deviceId: 'device-123',
                currentStatus: 'ACTIVE',
            });

            expect(deviceService.deactivateDevice).toHaveBeenCalledWith('device-123');
            expect(deviceService.activateDevice).not.toHaveBeenCalled();
        });

        it('should activate an inactive device', async () => {
            vi.mocked(deviceService.activateDevice).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleDeviceStatus(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                deviceId: 'device-123',
                currentStatus: 'INACTIVE',
            });

            expect(deviceService.activateDevice).toHaveBeenCalledWith('device-123');
            expect(deviceService.deactivateDevice).not.toHaveBeenCalled();
        });
    });

    describe('deviceKeys', () => {
        it('should generate correct query keys', () => {
            expect(deviceKeys.all).toEqual(['devices']);
            expect(deviceKeys.lists()).toEqual(['devices', 'list']);
            expect(deviceKeys.list({ status: 'active' })).toEqual(['devices', 'list', { status: 'active' }]);
            expect(deviceKeys.details()).toEqual(['devices', 'detail']);
            expect(deviceKeys.detail('123')).toEqual(['devices', 'detail', '123']);
        });
    });
});
