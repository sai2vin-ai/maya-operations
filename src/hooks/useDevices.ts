import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deactivateDevice,
    activateDevice,
    type CreateDeviceData,
    type UpdateDeviceData,
} from '../services/deviceService';

// Query keys
export const deviceKeys = {
    all: ['devices'] as const,
    lists: () => [...deviceKeys.all, 'list'] as const,
    list: (filters: DeviceFilters) => [...deviceKeys.lists(), filters] as const,
    details: () => [...deviceKeys.all, 'detail'] as const,
    detail: (id: string) => [...deviceKeys.details(), id] as const,
};

// Filter types
export interface DeviceFilters {
    status?: 'all' | 'active' | 'inactive';
    searchQuery?: string;
}

// Apply filters to device list
function applyFilters(devices: Awaited<ReturnType<typeof getDevices>>, filters?: DeviceFilters) {
    if (!filters) return devices;

    return devices.filter((device) => {
        // Status filter
        if (filters.status === 'active' && device.status !== 'ACTIVE') return false;
        if (filters.status === 'inactive' && device.status === 'ACTIVE') return false;

        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
                device.name?.toLowerCase().includes(query) ||
                device.deviceId?.toLowerCase().includes(query) ||
                device.deviceType?.toLowerCase().includes(query) ||
                device.location?.toLowerCase().includes(query)
            );
        }

        return true;
    });
}

// Hook to fetch all devices with optional filters
export function useDevices(filters?: DeviceFilters) {
    return useQuery({
        queryKey: deviceKeys.list(filters || {}),
        queryFn: getDevices,
        select: (data) => applyFilters(data, filters),
    });
}

// Hook to fetch a single device by ID
export function useDevice(id: string | undefined) {
    return useQuery({
        queryKey: deviceKeys.detail(id || ''),
        queryFn: () => getDeviceById(id!),
        enabled: !!id,
    });
}

// Hook to create a new device
export function useCreateDevice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, registeredBy }: { data: CreateDeviceData; registeredBy: string }) =>
            createDevice(data, registeredBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deviceKeys.all });
        },
    });
}

// Hook to update a device
export function useUpdateDevice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ deviceId, data }: { deviceId: string; data: UpdateDeviceData }) =>
            updateDevice(deviceId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: deviceKeys.all });
            queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.deviceId) });
        },
    });
}

// Hook to toggle device status (activate/deactivate)
export function useToggleDeviceStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ deviceId, currentStatus }: { deviceId: string; currentStatus: string }) => {
            if (currentStatus === 'ACTIVE') {
                return deactivateDevice(deviceId);
            } else {
                return activateDevice(deviceId);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deviceKeys.all });
        },
    });
}
