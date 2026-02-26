import { describe, it, expect, vi, beforeEach } from 'vitest';
import { USER_ROLES, USER_STATUSES } from './userService';

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

const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();
const mockSendPasswordResetEmail = vi.fn();

vi.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
    sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
}));

vi.mock('../../../lib/firebase', () => ({
    db: 'mock-db',
    auth: 'mock-auth',
    secondaryAuth: 'mock-secondary-auth',
}));

vi.mock('../../../lib/authorization', () => ({ assertAuthorized: vi.fn() }));

const mockValidateEmail = vi.fn();
const mockValidateName = vi.fn();
const mockValidatePhone = vi.fn();
const mockValidateEmployeeId = vi.fn();

vi.mock('../../../utils/validation', () => ({
    validateEmail: (...args: unknown[]) => mockValidateEmail(...args),
    validateName: (...args: unknown[]) => mockValidateName(...args),
    validatePhone: (...args: unknown[]) => mockValidatePhone(...args),
    validateEmployeeId: (...args: unknown[]) => mockValidateEmployeeId(...args),
}));

vi.mock('../../../lib/schemas', () => ({
    userSchema: {},
    parseDocs: vi.fn((_schema: unknown, data: unknown) => data),
    parseDoc: vi.fn((_schema: unknown, data: unknown) => data),
}));

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset validation mocks to default valid state
        mockValidateEmail.mockReturnValue({ isValid: true });
        mockValidateName.mockReturnValue({ isValid: true });
        mockValidatePhone.mockReturnValue({ isValid: true });
        mockValidateEmployeeId.mockReturnValue({ isValid: true });
        mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'new-user-uid' } });
    });

    describe('USER_ROLES', () => {
        it('should have all required roles', () => {
            const roleValues = USER_ROLES.map((r) => r.value);
            expect(roleValues).toContain('SUPER_ADMIN');
            expect(roleValues).toContain('PLANT_MANAGER');
            expect(roleValues).toContain('SHIFT_SUPERVISOR');
            expect(roleValues).toContain('GATE_OPERATOR');
            expect(roleValues).toContain('WEIGHBRIDGE_OPERATOR');
            expect(roleValues).toContain('REACTOR_OPERATOR');
            expect(roleValues).toContain('MAINTENANCE_TECH');
            expect(roleValues).toContain('STORES_KEEPER');
            expect(roleValues).toContain('VIEWER');
        });

        it('should have exactly 9 roles', () => {
            expect(USER_ROLES).toHaveLength(9);
        });

        it('should have labels for all roles', () => {
            USER_ROLES.forEach((role) => {
                expect(role.label).toBeDefined();
                expect(typeof role.label).toBe('string');
                expect(role.label.length).toBeGreaterThan(0);
            });
        });

        it('should have unique values', () => {
            const values = USER_ROLES.map((r) => r.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });

        it('should have human-readable labels', () => {
            const superAdmin = USER_ROLES.find((r) => r.value === 'SUPER_ADMIN');
            expect(superAdmin?.label).toBe('Super Admin');

            const gateOperator = USER_ROLES.find((r) => r.value === 'GATE_OPERATOR');
            expect(gateOperator?.label).toBe('Gate Operator');

            const maintenanceTech = USER_ROLES.find((r) => r.value === 'MAINTENANCE_TECH');
            expect(maintenanceTech?.label).toBe('Maintenance Technician');
        });
    });

    describe('USER_STATUSES', () => {
        it('should have all required statuses', () => {
            const statusValues = USER_STATUSES.map((s) => s.value);
            expect(statusValues).toContain('ACTIVE');
            expect(statusValues).toContain('INACTIVE');
            expect(statusValues).toContain('SUSPENDED');
        });

        it('should have exactly 3 statuses', () => {
            expect(USER_STATUSES).toHaveLength(3);
        });

        it('should have labels for all statuses', () => {
            USER_STATUSES.forEach((status) => {
                expect(status.label).toBeDefined();
                expect(typeof status.label).toBe('string');
            });
        });

        it('should have correct labels', () => {
            const active = USER_STATUSES.find((s) => s.value === 'ACTIVE');
            expect(active?.label).toBe('Active');

            const inactive = USER_STATUSES.find((s) => s.value === 'INACTIVE');
            expect(inactive?.label).toBe('Inactive');

            const suspended = USER_STATUSES.find((s) => s.value === 'SUSPENDED');
            expect(suspended?.label).toBe('Suspended');
        });
    });

    describe('createUser', () => {
        const validUserData = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            phone: '+1234567890',
            role: 'SHIFT_SUPERVISOR' as const,
            employeeId: 'EMP-001',
        };

        it('should create auth user and Firestore doc', async () => {
            mockSetDoc.mockResolvedValue(undefined);

            const { createUser } = await import('./userService');

            const result = await createUser(validUserData, 'admin-uid', 'SUPER_ADMIN');

            expect(result).toBe('new-user-uid');
            expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
            expect(mockSetDoc).toHaveBeenCalledTimes(1);
            const docData = mockSetDoc.mock.calls[0][1];
            expect(docData.email).toBe('test@example.com');
            expect(docData.name).toBe('Test User');
            expect(docData.role).toBe('SHIFT_SUPERVISOR');
            expect(docData.status).toBe('ACTIVE');
            expect(docData.createdBy).toBe('admin-uid');
        });

        it('should use secondaryAuth, not primary auth', async () => {
            mockSetDoc.mockResolvedValue(undefined);

            const { createUser } = await import('./userService');

            await createUser(validUserData, 'admin-uid', 'SUPER_ADMIN');

            // secondaryAuth is 'mock-secondary-auth' from our mock
            expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
                'mock-secondary-auth',
                validUserData.email,
                validUserData.password,
            );
        });

        it('should sign out of secondaryAuth after creation', async () => {
            mockSetDoc.mockResolvedValue(undefined);

            const { createUser } = await import('./userService');

            await createUser(validUserData, 'admin-uid', 'SUPER_ADMIN');

            expect(mockSignOut).toHaveBeenCalledTimes(1);
            expect(mockSignOut).toHaveBeenCalledWith('mock-secondary-auth');
        });

        it('should reject invalid email', async () => {
            mockValidateEmail.mockReturnValue({ isValid: false, error: 'Invalid email address' } as {
                isValid: boolean;
            });

            const { createUser } = await import('./userService');

            await expect(createUser(validUserData, 'admin-uid', 'SUPER_ADMIN')).rejects.toThrow(
                'Invalid email address',
            );
        });
    });

    describe('createUserDocument', () => {
        it('should create doc with uid', async () => {
            mockSetDoc.mockResolvedValue(undefined);

            const { createUserDocument } = await import('./userService');

            await createUserDocument(
                'existing-uid',
                {
                    email: 'test@example.com',
                    name: 'Test User',
                    phone: '+1234567890',
                    role: 'GATE_OPERATOR',
                    employeeId: 'EMP-002',
                },
                'admin-uid',
            );

            expect(mockSetDoc).toHaveBeenCalledTimes(1);
            const docData = mockSetDoc.mock.calls[0][1];
            expect(docData.email).toBe('test@example.com');
            expect(docData.name).toBe('Test User');
            expect(docData.role).toBe('GATE_OPERATOR');
            expect(docData.status).toBe('ACTIVE');
            expect(docData.createdBy).toBe('admin-uid');
        });
    });

    describe('updateUser', () => {
        it('should call assertAuthorized and updateDoc', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);
            const { assertAuthorized } = await import('../../../lib/authorization');

            const { updateUser } = await import('./userService');

            await updateUser('user-123', { name: 'Updated Name' }, 'admin-uid', 'SUPER_ADMIN');

            expect(assertAuthorized).toHaveBeenCalledWith('SUPER_ADMIN', 'users:update');
            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.name).toBe('Updated Name');
            expect(updateArgs.updatedBy).toBe('admin-uid');
            expect(updateArgs.updatedAt).toBeDefined();
        });
    });

    describe('deactivateUser', () => {
        it('should set status INACTIVE', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { deactivateUser } = await import('./userService');

            await deactivateUser('user-123', 'admin-uid', 'SUPER_ADMIN');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.status).toBe('INACTIVE');
        });
    });

    describe('activateUser', () => {
        it('should set status ACTIVE', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { activateUser } = await import('./userService');

            await activateUser('user-123', 'admin-uid', 'SUPER_ADMIN');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.status).toBe('ACTIVE');
        });
    });

    describe('deleteUser', () => {
        it('should deactivate user', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            const { deleteUser } = await import('./userService');

            await deleteUser('user-123', 'admin-uid', 'SUPER_ADMIN');

            // deleteUser calls deactivateUser which calls updateUser with status INACTIVE
            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            const updateArgs = mockUpdateDoc.mock.calls[0][1];
            expect(updateArgs.status).toBe('INACTIVE');
        });
    });

    describe('sendPasswordReset', () => {
        it('should call sendPasswordResetEmail', async () => {
            mockSendPasswordResetEmail.mockResolvedValue(undefined);

            const { sendPasswordReset } = await import('./userService');

            await sendPasswordReset('test@example.com');

            expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
            expect(mockSendPasswordResetEmail).toHaveBeenCalledWith('mock-auth', 'test@example.com');
        });
    });

    describe('getUsers', () => {
        it('should return parsed users', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [
                    {
                        id: 'user-1',
                        data: () => ({ name: 'User 1', role: 'SUPER_ADMIN', status: 'ACTIVE' }),
                    },
                    {
                        id: 'user-2',
                        data: () => ({ name: 'User 2', role: 'VIEWER', status: 'ACTIVE' }),
                    },
                ],
            });

            const { getUsers } = await import('./userService');

            const result = await getUsers();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('user-1');
            expect(result[1].id).toBe('user-2');
        });
    });

    describe('getUserById', () => {
        it('should return null when not found', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => false,
            });

            const { getUserById } = await import('./userService');

            const result = await getUserById('nonexistent');

            expect(result).toBeNull();
        });
    });
});
