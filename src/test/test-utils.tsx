/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a fresh QueryClient for each test
function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

// Mock Auth Context
export const mockAuthContext = {
    user: { uid: 'test-user-id', email: 'test@example.com' },
    userData: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'SUPER_ADMIN' as const,
        status: 'ACTIVE' as const,
    },
    loading: false,
    login: async () => {},
    logout: async () => {},
    isAuthorized: () => true,
};

// All-in-one wrapper for tests
interface WrapperProps {
    children: React.ReactNode;
}

export function createWrapper() {
    const queryClient = createTestQueryClient();

    return function Wrapper({ children }: WrapperProps) {
        return (
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    {children}
                </BrowserRouter>
            </QueryClientProvider>
        );
    };
}

// Custom render function with all providers
function customRender(
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { wrapper: createWrapper(), ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Helper to wait for async operations
export async function waitForLoadingToFinish() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

// Mock data factories
export const mockUser = (overrides = {}) => ({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: 'REACTOR_OPERATOR' as const,
    status: 'ACTIVE' as const,
    employeeId: 'EMP001',
    allowedDeviceIds: [],
    createdAt: { toDate: () => new Date() },
    createdBy: 'admin',
    updatedAt: { toDate: () => new Date() },
    updatedBy: 'admin',
    ...overrides,
});

export const mockDevice = (overrides = {}) => ({
    id: 'device-1',
    deviceId: 'DEV-001',
    name: 'Test Device',
    deviceType: 'MOBILE' as const,
    os: 'ANDROID' as const,
    osVersion: '13',
    appVersion: '1.0.0',
    fcmToken: '',
    status: 'ACTIVE' as const,
    registeredAt: { toDate: () => new Date() },
    registeredBy: 'admin',
    ...overrides,
});

export const mockInventoryItem = (overrides = {}) => ({
    id: 'item-1',
    code: 'INV-RM-0001',
    name: 'Waste Tyres',
    category: 'RAW_MATERIAL' as const,
    unit: 'KG',
    currentStock: 5000,
    minimumStock: 1000,
    location: 'Storage A',
    createdAt: { toDate: () => new Date() },
    createdBy: 'admin',
    updatedAt: { toDate: () => new Date() },
    updatedBy: 'admin',
    ...overrides,
});

export const mockSparePart = (overrides = {}) => ({
    id: 'part-1',
    partNumber: 'MOT-001',
    name: 'Motor 5HP',
    category: 'MOTOR' as const,
    unit: 'PCS',
    currentStock: 5,
    minimumStock: 2,
    location: 'Rack A-1',
    createdAt: { toDate: () => new Date() },
    createdBy: 'admin',
    updatedAt: { toDate: () => new Date() },
    updatedBy: 'admin',
    ...overrides,
});

export const mockGateEntry = (overrides = {}) => ({
    id: 'entry-1',
    entryNumber: 'GE-2026-0001',
    entryType: 'IN' as const,
    vehicleNumber: 'KA01AB1234',
    status: 'PENDING' as const,
    materialCategory: 'TW-WHOLE',
    quantity: 5000,
    unit: 'KG' as const,
    entryTime: { toDate: () => new Date() },
    createdAt: { toDate: () => new Date() },
    createdBy: 'admin',
    updatedAt: { toDate: () => new Date() },
    updatedBy: 'admin',
    ...overrides,
});

export const mockBatch = (overrides = {}) => ({
    id: 'batch-1',
    batchNumber: 'M1-20260128-001',
    reactorId: 'reactor-1',
    status: 'IN_PROGRESS' as const,
    currentStep: 3,
    totalSteps: 14,
    stepHistory: [],
    outputs: [],
    startTime: { toDate: () => new Date() },
    createdAt: { toDate: () => new Date() },
    createdBy: 'admin',
    updatedAt: { toDate: () => new Date() },
    updatedBy: 'admin',
    ...overrides,
});

export const mockReactor = (overrides = {}) => ({
    id: 'reactor-1',
    reactorNumber: 'M1',
    name: 'Main Reactor 1',
    status: 'IDLE' as const,
    capacity: 10000,
    totalBatchCount: 150,
    createdAt: { toDate: () => new Date() },
    createdBy: 'admin',
    updatedAt: { toDate: () => new Date() },
    updatedBy: 'admin',
    ...overrides,
});

export const mockWeighbridgeEntry = (overrides = {}) => ({
    id: 'wb-1',
    entryNumber: 'WB-2026-00001',
    entryType: 'RM_IN' as const,
    vehicleNumber: 'KA01AB1234',
    status: 'PENDING' as const,
    unit: 'KG' as const,
    grossWeight: null,
    tareWeight: null,
    netWeight: null,
    createdAt: { toDate: () => new Date() },
    createdBy: 'admin',
    updatedAt: { toDate: () => new Date() },
    updatedBy: 'admin',
    ...overrides,
});
