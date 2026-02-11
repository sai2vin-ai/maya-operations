/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToRolePermissions,
    matrixToDynamicPermissions,
} from '../features/role-permissions/services/rolePermissionsService';
import { setDynamicPermissions } from '../lib/authorization';
import { buildDefaultMatrix, type PermissionMatrix } from '../config/permissionMapping';

interface RolePermissionsContextType {
    /** The current permission matrix (from Firestore or defaults) */
    matrix: PermissionMatrix;
    /** Whether the initial load from Firestore is still pending */
    loading: boolean;
    /** Whether permissions have been customized (Firestore doc exists) */
    isCustomized: boolean;
    /** Timestamp of last update, if customized */
    lastUpdated: string | null;
}

const RolePermissionsContext = createContext<RolePermissionsContextType | undefined>(undefined);

export function RolePermissionsProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    const currentUid = currentUser?.uid ?? null;
    const [matrix, setMatrix] = useState<PermissionMatrix>(() => buildDefaultMatrix());
    const [loadedUid, setLoadedUid] = useState<string | null>(null);
    const [isCustomized, setIsCustomized] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Derive loading: true when we have a user whose permissions haven't loaded yet
    const loading = currentUid !== null && loadedUid !== currentUid;

    useEffect(() => {
        if (!currentUser) {
            setDynamicPermissions(null);
            return;
        }

        const unsubscribe = subscribeToRolePermissions((data) => {
            if (data) {
                setMatrix(data.matrix);
                setIsCustomized(true);
                setLastUpdated(data.updatedAt);
                setDynamicPermissions(matrixToDynamicPermissions(data.matrix));
            } else {
                const defaults = buildDefaultMatrix();
                setMatrix(defaults);
                setIsCustomized(false);
                setLastUpdated(null);
                setDynamicPermissions(null);
            }
            setLoadedUid(currentUser.uid);
        });

        return () => {
            unsubscribe();
            setDynamicPermissions(null);
        };
    }, [currentUser]);

    return (
        <RolePermissionsContext.Provider value={{ matrix, loading, isCustomized, lastUpdated }}>
            {children}
        </RolePermissionsContext.Provider>
    );
}

export function useRolePermissions() {
    const context = useContext(RolePermissionsContext);
    if (!context) {
        throw new Error('useRolePermissions must be used within RolePermissionsProvider');
    }
    return context;
}
