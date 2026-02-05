import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers, useUser, useCreateUser, useToggleUserStatus, userKeys } from './useUsers';
import { createWrapper, mockUser } from '../../../test/test-utils';
import * as userService from '../services/userService';

// Mock the user service
vi.mock('../services/userService', () => ({
    getUsers: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deactivateUser: vi.fn(),
    activateUser: vi.fn(),
    USER_ROLES: [
        { value: 'SUPER_ADMIN', label: 'Super Admin' },
        { value: 'REACTOR_OPERATOR', label: 'Reactor Operator' },
    ],
    USER_STATUSES: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
    ],
}));

describe('useUsers hooks integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useUsers', () => {
        it('should fetch and return users', async () => {
            const mockUsers = [
                mockUser({ id: '1', name: 'User 1', status: 'ACTIVE' }),
                mockUser({ id: '2', name: 'User 2', status: 'INACTIVE' }),
            ];

            vi.mocked(userService.getUsers).mockResolvedValue(mockUsers);

            const { result } = renderHook(() => useUsers(), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(2);
            expect(userService.getUsers).toHaveBeenCalledTimes(1);
        });

        it('should filter users by active status', async () => {
            const mockUsers = [
                mockUser({ id: '1', name: 'Active User', status: 'ACTIVE' }),
                mockUser({ id: '2', name: 'Inactive User', status: 'INACTIVE' }),
            ];

            vi.mocked(userService.getUsers).mockResolvedValue(mockUsers);

            const { result } = renderHook(
                () => useUsers({ status: 'active' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Active User');
        });

        it('should filter users by inactive status', async () => {
            const mockUsers = [
                mockUser({ id: '1', name: 'Active User', status: 'ACTIVE' }),
                mockUser({ id: '2', name: 'Inactive User', status: 'INACTIVE' }),
            ];

            vi.mocked(userService.getUsers).mockResolvedValue(mockUsers);

            const { result } = renderHook(
                () => useUsers({ status: 'inactive' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('Inactive User');
        });

        it('should filter users by search query on name', async () => {
            const mockUsers = [
                mockUser({ id: '1', name: 'John Doe', email: 'john@test.com' }),
                mockUser({ id: '2', name: 'Jane Smith', email: 'jane@test.com' }),
            ];

            vi.mocked(userService.getUsers).mockResolvedValue(mockUsers);

            const { result } = renderHook(
                () => useUsers({ searchQuery: 'john' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].name).toBe('John Doe');
        });

        it('should filter users by search query on email', async () => {
            const mockUsers = [
                mockUser({ id: '1', name: 'John Doe', email: 'john@test.com' }),
                mockUser({ id: '2', name: 'Jane Smith', email: 'jane@test.com' }),
            ];

            vi.mocked(userService.getUsers).mockResolvedValue(mockUsers);

            const { result } = renderHook(
                () => useUsers({ searchQuery: 'jane@' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].email).toBe('jane@test.com');
        });

        it('should filter users by search query on role', async () => {
            const mockUsers = [
                mockUser({ id: '1', name: 'Admin', role: 'SUPER_ADMIN' }),
                mockUser({ id: '2', name: 'Operator', role: 'REACTOR_OPERATOR' }),
            ];

            vi.mocked(userService.getUsers).mockResolvedValue(mockUsers);

            const { result } = renderHook(
                () => useUsers({ searchQuery: 'admin' }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].role).toBe('SUPER_ADMIN');
        });

        it('should handle error state', async () => {
            vi.mocked(userService.getUsers).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useUsers(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error?.message).toBe('Network error');
        });
    });

    describe('useUser', () => {
        it('should fetch a single user by ID', async () => {
            const user = mockUser({ id: 'user-123', name: 'Test User' });
            vi.mocked(userService.getUserById).mockResolvedValue(user);

            const { result } = renderHook(() => useUser('user-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.name).toBe('Test User');
            expect(userService.getUserById).toHaveBeenCalledWith('user-123');
        });

        it('should not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useUser(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(userService.getUserById).not.toHaveBeenCalled();
        });
    });

    describe('useCreateUser', () => {
        it('should create a user and return the ID', async () => {
            vi.mocked(userService.createUser).mockResolvedValue('new-user-id');

            const { result } = renderHook(() => useCreateUser(), {
                wrapper: createWrapper(),
            });

            const createData = {
                data: {
                    email: 'new@test.com',
                    password: 'password123',
                    name: 'New User',
                    phone: '1234567890',
                    role: 'REACTOR_OPERATOR' as const,
                    employeeId: 'EMP002',
                },
                createdBy: 'admin',
            };

            await result.current.mutateAsync(createData);

            expect(userService.createUser).toHaveBeenCalledWith(
                createData.data,
                createData.createdBy
            );
        });
    });

    describe('useToggleUserStatus', () => {
        it('should deactivate an active user', async () => {
            vi.mocked(userService.deactivateUser).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleUserStatus(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                userId: 'user-123',
                currentStatus: 'ACTIVE',
                updatedBy: 'admin',
            });

            expect(userService.deactivateUser).toHaveBeenCalledWith('user-123', 'admin');
            expect(userService.activateUser).not.toHaveBeenCalled();
        });

        it('should activate an inactive user', async () => {
            vi.mocked(userService.activateUser).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleUserStatus(), {
                wrapper: createWrapper(),
            });

            await result.current.mutateAsync({
                userId: 'user-123',
                currentStatus: 'INACTIVE',
                updatedBy: 'admin',
            });

            expect(userService.activateUser).toHaveBeenCalledWith('user-123', 'admin');
            expect(userService.deactivateUser).not.toHaveBeenCalled();
        });
    });

    describe('userKeys', () => {
        it('should generate correct query keys', () => {
            expect(userKeys.all).toEqual(['users']);
            expect(userKeys.lists()).toEqual(['users', 'list']);
            expect(userKeys.list({ status: 'active' })).toEqual(['users', 'list', { status: 'active' }]);
            expect(userKeys.details()).toEqual(['users', 'detail']);
            expect(userKeys.detail('123')).toEqual(['users', 'detail', '123']);
        });
    });
});
