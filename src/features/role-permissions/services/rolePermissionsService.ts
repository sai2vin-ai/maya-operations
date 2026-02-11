import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { UserRole } from '../../../types';
import type { PermissionAction } from '../../../lib/authorization';
import { deriveActionsFromMatrix, type PermissionMatrix } from '../../../config/permissionMapping';

const DOC_REF = doc(db, 'appConfig', 'rolePermissions');
const CURRENT_VERSION = 1;

export interface RolePermissionsDoc {
    matrix: PermissionMatrix;
    updatedAt: string;
    updatedBy: string;
    version: number;
}

/**
 * Fetches the role permissions document from Firestore.
 * Returns null if the document doesn't exist.
 */
export async function getRolePermissions(): Promise<RolePermissionsDoc | null> {
    const snap = await getDoc(DOC_REF);
    if (!snap.exists()) return null;
    return snap.data() as RolePermissionsDoc;
}

/**
 * Subscribes to real-time changes on the role permissions document.
 * Returns an unsubscribe function.
 */
export function subscribeToRolePermissions(callback: (data: RolePermissionsDoc | null) => void): () => void {
    return onSnapshot(
        DOC_REF,
        (snap) => {
            callback(snap.exists() ? (snap.data() as RolePermissionsDoc) : null);
        },
        (error) => {
            console.warn('Role permissions subscription error:', error);
            callback(null);
        },
    );
}

/**
 * Saves the permission matrix to Firestore.
 * Only SUPER_ADMIN may call this.
 */
export async function saveRolePermissions(
    matrix: PermissionMatrix,
    callerRole: UserRole | undefined,
    callerUid: string,
): Promise<void> {
    if (callerRole !== 'SUPER_ADMIN') {
        throw new Error('Only SUPER_ADMIN can modify role permissions');
    }

    if (matrix['SUPER_ADMIN']) {
        throw new Error('SUPER_ADMIN permissions cannot be modified');
    }

    for (const roleKey of Object.keys(matrix)) {
        const dashPerms = matrix[roleKey]?.DASHBOARD;
        if (!dashPerms || !dashPerms.includes('view')) {
            throw new Error(`Cannot remove dashboard view access for ${roleKey}`);
        }
    }

    await setDoc(DOC_REF, {
        matrix,
        updatedAt: new Date().toISOString(),
        updatedBy: callerUid,
        version: CURRENT_VERSION,
    });
}

/**
 * Converts the stored matrix into the dynamic permissions format
 * expected by authorization.ts setDynamicPermissions().
 */
export function matrixToDynamicPermissions(matrix: PermissionMatrix): Record<string, PermissionAction[]> {
    const result: Record<string, PermissionAction[]> = {};

    for (const [roleKey, modulePerms] of Object.entries(matrix)) {
        if (roleKey === 'SUPER_ADMIN') continue;
        result[roleKey] = deriveActionsFromMatrix(modulePerms);
    }

    return result;
}
