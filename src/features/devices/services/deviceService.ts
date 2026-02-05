import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Device, DeviceType, DeviceStatus, OperatingSystem } from '../types';

const DEVICES_COLLECTION = 'devices';

// Get all devices
export async function getDevices(): Promise<Device[]> {
    const devicesRef = collection(db, DEVICES_COLLECTION);
    const snapshot = await getDocs(devicesRef);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Device[];
}

// Get device by ID
export async function getDeviceById(deviceId: string): Promise<Device | null> {
    const deviceRef = doc(db, DEVICES_COLLECTION, deviceId);
    const snapshot = await getDoc(deviceRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as Device;
}

// Get devices by status
export async function getDevicesByStatus(status: DeviceStatus): Promise<Device[]> {
    const devicesRef = collection(db, DEVICES_COLLECTION);
    const q = query(devicesRef, where('status', '==', status));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Device[];
}

// Create device
export interface CreateDeviceData {
    deviceId: string;
    name: string;
    deviceType: DeviceType;
    os: OperatingSystem;
    osVersion?: string;
    appVersion?: string;
    assignedUserId?: string;
    location?: string;
}

export async function createDevice(data: CreateDeviceData, registeredBy: string): Promise<string> {
    const deviceRef = doc(db, DEVICES_COLLECTION, data.deviceId);

    const deviceDoc: Omit<Device, 'id'> = {
        deviceId: data.deviceId,
        name: data.name,
        deviceType: data.deviceType,
        os: data.os,
        osVersion: data.osVersion || '',
        appVersion: data.appVersion || '',
        fcmToken: '',
        status: 'ACTIVE',
        assignedUserId: data.assignedUserId,
        location: data.location,
        registeredAt: Timestamp.now(),
        registeredBy: registeredBy,
    };

    await setDoc(deviceRef, deviceDoc);
    return data.deviceId;
}

// Update device
export interface UpdateDeviceData {
    name?: string;
    deviceType?: DeviceType;
    os?: OperatingSystem;
    osVersion?: string;
    appVersion?: string;
    status?: DeviceStatus;
    assignedUserId?: string;
    location?: string;
}

export async function updateDevice(deviceId: string, data: UpdateDeviceData): Promise<void> {
    const deviceRef = doc(db, DEVICES_COLLECTION, deviceId);
    await updateDoc(deviceRef, { ...data });
}

// Deactivate device
export async function deactivateDevice(deviceId: string): Promise<void> {
    await updateDevice(deviceId, { status: 'INACTIVE' });
}

// Activate device
export async function activateDevice(deviceId: string): Promise<void> {
    await updateDevice(deviceId, { status: 'ACTIVE' });
}

// Revoke device
export async function revokeDevice(deviceId: string): Promise<void> {
    await updateDevice(deviceId, { status: 'REVOKED' });
}

// Get active devices count
export async function getActiveDevicesCount(): Promise<number> {
    const devicesRef = collection(db, DEVICES_COLLECTION);
    const q = query(devicesRef, where('status', '==', 'ACTIVE'));
    const snapshot = await getDocs(q);
    return snapshot.size;
}

// Device types for dropdown
export const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
    { value: 'MOBILE', label: 'Mobile Phone' },
    { value: 'TABLET', label: 'Tablet' },
    { value: 'DESKTOP', label: 'Desktop' },
    { value: 'SCANNER', label: 'Barcode Scanner' },
];

// Operating systems for dropdown
export const OPERATING_SYSTEMS: { value: OperatingSystem; label: string }[] = [
    { value: 'ANDROID', label: 'Android' },
    { value: 'IOS', label: 'iOS' },
    { value: 'WINDOWS', label: 'Windows' },
    { value: 'MACOS', label: 'macOS' },
    { value: 'LINUX', label: 'Linux' },
];

// Device statuses for dropdown
export const DEVICE_STATUSES: { value: DeviceStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'REVOKED', label: 'Revoked' },
];
