import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deactivateUser,
    activateUser,
    type CreateUserData,
    type UpdateUserData,
} from '../services/userService';

// Query keys
export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
};

// Filter types
export interface UserFilters {
    status?: 'all' | 'active' | 'inactive';
    searchQuery?: string;
}

// Apply filters to user list
function applyFilters(users: Awaited<ReturnType<typeof getUsers>>, filters?: UserFilters) {
    if (!filters) return users;

    return users.filter((user) => {
        // Status filter
        if (filters.status === 'active' && user.status !== 'ACTIVE') return false;
        if (filters.status === 'inactive' && user.status === 'ACTIVE') return false;

        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.employeeId?.toLowerCase().includes(query) ||
                user.role?.toLowerCase().includes(query)
            );
        }

        return true;
    });
}

// Hook to fetch all users with optional filters
export function useUsers(filters?: UserFilters) {
    return useQuery({
        queryKey: userKeys.list(filters || {}),
        queryFn: getUsers,
        select: (data) => applyFilters(data, filters),
    });
}

// Hook to fetch a single user by ID
export function useUser(id: string | undefined) {
    return useQuery({
        queryKey: userKeys.detail(id || ''),
        queryFn: () => getUserById(id!),
        enabled: !!id,
    });
}

// Hook to create a new user
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, createdBy }: { data: CreateUserData; createdBy: string }) =>
            createUser(data, createdBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

// Hook to update a user
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            userId,
            data,
            updatedBy,
        }: {
            userId: string;
            data: UpdateUserData;
            updatedBy: string;
        }) => updateUser(userId, data, updatedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
            queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
        },
    });
}

// Hook to toggle user status (activate/deactivate)
export function useToggleUserStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            userId,
            currentStatus,
            updatedBy,
        }: {
            userId: string;
            currentStatus: string;
            updatedBy: string;
        }) => {
            if (currentStatus === 'ACTIVE') {
                return deactivateUser(userId, updatedBy);
            } else {
                return activateUser(userId, updatedBy);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}
