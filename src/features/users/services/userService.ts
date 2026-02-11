import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth, secondaryAuth } from '../../../lib/firebase';
import type { User, UserRole, UserStatus } from '../types';
import { validateEmail, validateName, validatePhone, validateEmployeeId } from '../../../utils/validation';
import { assertAuthorized } from '../../../lib/authorization';
import { userSchema, parseDocs, parseDoc } from '../../../lib/schemas';

const USERS_COLLECTION = 'users';

/** Fetches all users from Firestore. */
export async function getUsers(): Promise<User[]> {
    const usersRef = collection(db, USERS_COLLECTION);
    // Note: Not ordering by createdAt since manually created docs may not have this field
    const snapshot = await getDocs(usersRef);

    const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return parseDocs(userSchema, raw, 'getUsers') as User[];
}

/**
 * Fetches a single user by their document ID.
 * @param userId - The Firestore document ID (Auth UID)
 * @returns The user object, or null if not found
 */
export async function getUserById(userId: string): Promise<User | null> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return parseDoc(userSchema, { id: snapshot.id, ...snapshot.data() }, 'getUserById') as User;
}

/**
 * Fetches all users matching a specific role.
 * @param role - The user role to filter by
 * @returns Array of users with the specified role
 */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as User[];
}

export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: UserRole;
    employeeId: string;
    allowedDeviceIds?: string[];
}

/**
 * Creates a new user in Firebase Auth and Firestore. Validates all input fields
 * and checks authorization before creation.
 * @param data - User registration data including email, password, name, and role
 * @param createdBy - UID of the user performing the creation
 * @param callerRole - Role of the caller, used for authorization check
 * @returns The newly created user's Auth UID
 */
export async function createUser(data: CreateUserData, createdBy: string, callerRole?: UserRole): Promise<string> {
    // Authorization check
    assertAuthorized(callerRole, 'users:create');

    // Input validation
    const emailVal = validateEmail(data.email);
    if (!emailVal.isValid) throw new Error(emailVal.error);

    const nameVal = validateName(data.name);
    if (!nameVal.isValid) throw new Error(nameVal.error);

    const phoneVal = validatePhone(data.phone);
    if (!phoneVal.isValid) throw new Error(phoneVal.error);

    const empIdVal = validateEmployeeId(data.employeeId);
    if (!empIdVal.isValid) throw new Error(empIdVal.error);

    // Create user in secondary Auth instance so admin session is preserved
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
    const uid = userCredential.user.uid;
    // Sign out from secondary auth to clean up
    await signOut(secondaryAuth);

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
    await setDoc(doc(db, USERS_COLLECTION, uid), userDoc as Record<string, unknown>);

    return uid;
}

/**
 * Creates a Firestore user document for an existing Firebase Auth user.
 * @param uid - The existing Auth UID to use as the document ID
 * @param data - User profile data (without password)
 * @param createdBy - UID of the user performing the creation
 */
export async function createUserDocument(
    uid: string,
    data: Omit<CreateUserData, 'password'>,
    createdBy: string,
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

    await setDoc(userRef, userDoc as Record<string, unknown>);
}

export interface UpdateUserData {
    name?: string;
    phone?: string;
    role?: UserRole;
    status?: UserStatus;
    employeeId?: string;
    allowedDeviceIds?: string[];
}

/**
 * Updates a user's profile fields in Firestore.
 * @param userId - The user document ID to update
 * @param data - Partial user data to merge
 * @param updatedBy - UID of the user performing the update
 */
export async function updateUser(
    userId: string,
    data: UpdateUserData,
    updatedBy: string,
    callerRole?: UserRole,
): Promise<void> {
    assertAuthorized(callerRole, 'users:update');
    const userRef = doc(db, USERS_COLLECTION, userId);

    await updateDoc(userRef, {
        ...data,
        updatedAt: Timestamp.now(),
        updatedBy: updatedBy,
    });
}

/** Sets a user's status to INACTIVE. */
export async function deactivateUser(userId: string, updatedBy: string, callerRole?: UserRole): Promise<void> {
    await updateUser(userId, { status: 'INACTIVE' }, updatedBy, callerRole);
}

/** Sets a user's status to ACTIVE. */
export async function activateUser(userId: string, updatedBy: string, callerRole?: UserRole): Promise<void> {
    await updateUser(userId, { status: 'ACTIVE' }, updatedBy, callerRole);
}

/** Soft-deletes a user by deactivating their account. */
export async function deleteUser(userId: string, updatedBy: string, callerRole?: UserRole): Promise<void> {
    await deactivateUser(userId, updatedBy, callerRole);
}

/** Sends a password reset email via Firebase Auth. */
export async function sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
}

/** Returns the total count of users with ACTIVE status. */
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
