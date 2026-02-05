import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { db, auth } from '../../../lib/firebase';
import type { User, UserRole, UserStatus } from '../types';

const USERS_COLLECTION = 'users';

// Get all users
export async function getUsers(): Promise<User[]> {
    const usersRef = collection(db, USERS_COLLECTION);
    // Note: Not ordering by createdAt since manually created docs may not have this field
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as User[];
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as User;
}

// Get users by role
export async function getUsersByRole(role: UserRole): Promise<User[]> {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as User[];
}

// Create new user (Auth + Firestore)
export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: UserRole;
    employeeId: string;
    allowedDeviceIds?: string[];
}

export async function createUser(data: CreateUserData, createdBy: string): Promise<string> {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = userCredential.user.uid;

    // Create user document in Firestore
    const userDoc: Omit<User, 'id'> = {
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        status: 'ACTIVE',
        employeeId: data.employeeId,
        allowedDeviceIds: data.allowedDeviceIds || [],
        createdAt: Timestamp.now(),
        createdBy: createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    // Use the Auth UID as the document ID
    await updateDoc(doc(db, USERS_COLLECTION, uid), userDoc as Record<string, unknown>);

    return uid;
}

// Alternative: Create user document only (when Auth user already exists)
export async function createUserDocument(
    uid: string,
    data: Omit<CreateUserData, 'password'>,
    createdBy: string
): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, uid);

    const userDoc: Omit<User, 'id'> = {
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        status: 'ACTIVE',
        employeeId: data.employeeId,
        allowedDeviceIds: data.allowedDeviceIds || [],
        createdAt: Timestamp.now(),
        createdBy: createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy,
    };

    await updateDoc(userRef, userDoc as Record<string, unknown>);
}

// Update user
export interface UpdateUserData {
    name?: string;
    phone?: string;
    role?: UserRole;
    status?: UserStatus;
    employeeId?: string;
    allowedDeviceIds?: string[];
}

export async function updateUser(
    userId: string,
    data: UpdateUserData,
    updatedBy: string
): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, userId);

    await updateDoc(userRef, {
        ...data,
        updatedAt: Timestamp.now(),
        updatedBy: updatedBy,
    });
}

// Deactivate user
export async function deactivateUser(userId: string, updatedBy: string): Promise<void> {
    await updateUser(userId, { status: 'INACTIVE' }, updatedBy);
}

// Activate user
export async function activateUser(userId: string, updatedBy: string): Promise<void> {
    await updateUser(userId, { status: 'ACTIVE' }, updatedBy);
}

// Delete user (soft delete - just deactivate)
export async function deleteUser(userId: string, updatedBy: string): Promise<void> {
    await deactivateUser(userId, updatedBy);
}

// Send password reset email
export async function sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
}

// Get active users count
export async function getActiveUsersCount(): Promise<number> {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('status', '==', 'ACTIVE'));
    const snapshot = await getDocs(q);
    return snapshot.size;
}

// User roles for dropdown
export const USER_ROLES: { value: UserRole; label: string }[] = [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'PLANT_MANAGER', label: 'Plant Manager' },
    { value: 'SHIFT_SUPERVISOR', label: 'Shift Supervisor' },
    { value: 'GATE_OPERATOR', label: 'Gate Operator' },
    { value: 'REACTOR_OPERATOR', label: 'Reactor Operator' },
    { value: 'MAINTENANCE_TECH', label: 'Maintenance Technician' },
    { value: 'STORES_KEEPER', label: 'Stores Keeper' },
    { value: 'VIEWER', label: 'Viewer' },
];

// User statuses for dropdown
export const USER_STATUSES: { value: UserStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' },
];
