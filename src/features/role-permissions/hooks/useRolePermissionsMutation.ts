import { useMutation } from '@tanstack/react-query';
import { saveRolePermissions } from '../services/rolePermissionsService';
import type { PermissionMatrix } from '../../../config/permissionMapping';
import type { UserRole } from '../../../types';

export function useSavePermissions() {
    return useMutation({
        mutationFn: ({
            matrix,
            callerRole,
            callerUid,
        }: {
            matrix: PermissionMatrix;
            callerRole: UserRole | undefined;
            callerUid: string;
        }) => saveRolePermissions(matrix, callerRole, callerUid),
    });
}
