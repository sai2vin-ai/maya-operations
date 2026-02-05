/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { User, Device, InventoryItem, SparePart, GateEntry, Batch, Reactor, WeighbridgeEntry } from '../types';

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

// Mock Firestore Timestamp that satisfies the Timestamp interface
export function mockTimestamp(date: Date = new Date()) {
    const seconds = Math.floor(date.getTime() / 1000);
    const nanoseconds = (date.getTime() % 1000) * 1000000;
    return {
        seconds,
        nanoseconds,
        toDate: () => date,
        toMillis: () => date.getTime(),
        isEqual: (other: { seconds: number; nanoseconds: number }) =>
            other.seconds === seconds && other.nanoseconds === nanoseconds,
        toJSON: () => ({ seconds, nanoseconds, type: 'timestamp' }),
        valueOf: () => `Timestamp(seconds=${seconds}, nanoseconds=${nanoseconds})`,
    };
}

// Mock data factories - with explicit type assertions for proper TypeScript compatibility
export const mockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: 'REACTOR_OPERATOR',
    status: 'ACTIVE',
    employeeId: 'EMP001',
    allowedDeviceIds: [],
    createdAt: mockTimestamp(),
    createdBy: 'admin',
    updatedAt: mockTimestamp(),
    updatedBy: 'admin',
    ...overrides,
} as User);

export const mockDevice = (overrides: Partial<Device> = {}): Device => ({
    id: 'device-1',
    deviceId: 'DEV-001',
    name: 'Test Device',
    deviceType: 'MOBILE',
    os: 'ANDROID',
    osVersion: '13',
    appVersion: '1.0.0',
    fcmToken: '',
    status: 'ACTIVE',
    registeredAt: mockTimestamp(),
    registeredBy: 'admin',
    ...overrides,
} as Device);

export const mockInventoryItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
    id: 'item-1',
    code: 'INV-RM-0001',
    name: 'Waste Tyres',
    category: 'RAW_MATERIAL',
    unit: 'KG',
    currentStock: 5000,
    minimumStock: 1000,
    location: 'Storage A',
    createdAt: mockTimestamp(),
    createdBy: 'admin',
    updatedAt: mockTimestamp(),
    updatedBy: 'admin',
    ...overrides,
} as InventoryItem);

export const mockSparePart = (overrides: Partial<SparePart> = {}): SparePart => ({
    id: 'part-1',
    partNumber: 'MOT-001',
    name: 'Motor 5HP',
    category: 'MOTOR',
    unit: 'PCS',
    currentStock: 5,
    minimumStock: 2,
    location: 'Rack A-1',
    createdAt: mockTimestamp(),
    createdBy: 'admin',
    updatedAt: mockTimestamp(),
    updatedBy: 'admin',
    ...overrides,
} as SparePart);

export const mockGateEntry = (overrides: Partial<GateEntry> = {}): GateEntry => ({
    id: 'entry-1',
    entryNumber: 'GE-2026-0001',
    entryType: 'IN',
    vehicleNumber: 'KA01AB1234',
    status: 'PENDING',
    materialCategory: 'TW-WHOLE',
    quantity: 5000,
    unit: 'KG',
    entryTime: mockTimestamp(),
    createdAt: mockTimestamp(),
    createdBy: 'admin',
    updatedAt: mockTimestamp(),
    updatedBy: 'admin',
    ...overrides,
} as GateEntry);

export const mockBatch = (overrides: Partial<Batch> = {}): Batch => ({
    id: 'batch-1',
    batchNumber: 'M1-20260128-001',
    reactorId: 'reactor-1',
    status: 'IN_PROGRESS',
    currentStep: 3,
    totalSteps: 14,
    stepHistory: [],
    outputs: [],
    startTime: mockTimestamp(),
    createdAt: mockTimestamp(),
    createdBy: 'admin',
    updatedAt: mockTimestamp(),
    updatedBy: 'admin',
    ...overrides,
} as Batch);

export const mockReactor = (overrides: Partial<Reactor> = {}): Reactor => ({
    id: 'reactor-1',
    reactorNumber: 'M1',
    name: 'Main Reactor 1',
    status: 'IDLE',
    capacity: 10000,
    totalBatchCount: 150,
    createdAt: mockTimestamp(),
    createdBy: 'admin',
    updatedAt: mockTimestamp(),
    updatedBy: 'admin',
    ...overrides,
} as Reactor);

export const mockWeighbridgeEntry = (overrides: Partial<WeighbridgeEntry> = {}): WeighbridgeEntry => ({
    id: 'wb-1',
    entryNumber: 'WB-2026-00001',
    entryType: 'RM_IN',
    vehicleNumber: 'KA01AB1234',
    status: 'PENDING',
    unit: 'KG',
    grossWeight: null,
    tareWeight: null,
    netWeight: null,
    createdAt: mockTimestamp(),
    createdBy: 'admin',
    updatedAt: mockTimestamp(),
    updatedBy: 'admin',
    ...overrides,
} as WeighbridgeEntry);
