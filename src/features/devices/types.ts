// Device Types
import { Timestamp } from 'firebase/firestore';

export type DeviceType = 'TABLET' | 'MOBILE' | 'DESKTOP' | 'SCANNER';
export type DeviceStatus = 'REGISTERED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED';
export type OperatingSystem = 'ANDROID' | 'IOS' | 'WINDOWS' | 'MACOS' | 'LINUX';

export interface Device {
    id: string;
    deviceId: string; // Hardware device ID
    name: string;
    deviceType: DeviceType;
    os: OperatingSystem;
    osVersion?: string;
    appVersion?: string;
    fcmToken?: string;
    status: DeviceStatus;
    assignedUserId?: string; // User ID
    lastSeen?: Timestamp;
    location?: string;
    registeredAt?: Timestamp;
    registeredBy?: string;
}
