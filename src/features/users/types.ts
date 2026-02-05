// User & Auth Types
import type { AuditFields } from '../../types';

export type UserRole =
    | 'SUPER_ADMIN'
    | 'PLANT_MANAGER'
    | 'SHIFT_SUPERVISOR'
    | 'GATE_OPERATOR'
    | 'WEIGHBRIDGE_OPERATOR'
    | 'REACTOR_OPERATOR'
    | 'STORES_KEEPER'
    | 'MAINTENANCE_TECH'
    | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User extends AuditFields {
    id: string;
    uid?: string; // Firebase Auth UID
    employeeId: string;
    name: string;
    phone: string;
    email?: string;
    role: UserRole;
    status: UserStatus;
    defaultShift?: 'A' | 'B' | 'C';
    photoUrl?: string;
    allowedDeviceIds?: string[];
}
