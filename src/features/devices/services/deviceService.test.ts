import { describe, it, expect } from 'vitest';
import { DEVICE_TYPES, OPERATING_SYSTEMS, DEVICE_STATUSES } from './deviceService';

describe('deviceService', () => {
    describe('DEVICE_TYPES', () => {
        it('should have all required device types', () => {
            const typeValues = DEVICE_TYPES.map(t => t.value);
            expect(typeValues).toContain('MOBILE');
            expect(typeValues).toContain('TABLET');
            expect(typeValues).toContain('DESKTOP');
            expect(typeValues).toContain('SCANNER');
        });

        it('should have exactly 4 device types', () => {
            expect(DEVICE_TYPES).toHaveLength(4);
        });

        it('should have labels for all types', () => {
            DEVICE_TYPES.forEach(type => {
                expect(type.label).toBeDefined();
                expect(typeof type.label).toBe('string');
                expect(type.label.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            const mobile = DEVICE_TYPES.find(t => t.value === 'MOBILE');
            expect(mobile?.label).toBe('Mobile Phone');

            const scanner = DEVICE_TYPES.find(t => t.value === 'SCANNER');
            expect(scanner?.label).toBe('Barcode Scanner');
        });
    });

    describe('OPERATING_SYSTEMS', () => {
        it('should have all required operating systems', () => {
            const osValues = OPERATING_SYSTEMS.map(os => os.value);
            expect(osValues).toContain('ANDROID');
            expect(osValues).toContain('IOS');
            expect(osValues).toContain('WINDOWS');
            expect(osValues).toContain('MACOS');
            expect(osValues).toContain('LINUX');
        });

        it('should have exactly 5 operating systems', () => {
            expect(OPERATING_SYSTEMS).toHaveLength(5);
        });

        it('should have labels for all operating systems', () => {
            OPERATING_SYSTEMS.forEach(os => {
                expect(os.label).toBeDefined();
                expect(typeof os.label).toBe('string');
            });
        });

        it('should have correct labels', () => {
            const android = OPERATING_SYSTEMS.find(os => os.value === 'ANDROID');
            expect(android?.label).toBe('Android');

            const ios = OPERATING_SYSTEMS.find(os => os.value === 'IOS');
            expect(ios?.label).toBe('iOS');

            const macos = OPERATING_SYSTEMS.find(os => os.value === 'MACOS');
            expect(macos?.label).toBe('macOS');
        });
    });

    describe('DEVICE_STATUSES', () => {
        it('should have all required statuses', () => {
            const statusValues = DEVICE_STATUSES.map(s => s.value);
            expect(statusValues).toContain('ACTIVE');
            expect(statusValues).toContain('INACTIVE');
            expect(statusValues).toContain('REVOKED');
        });

        it('should have exactly 3 statuses', () => {
            expect(DEVICE_STATUSES).toHaveLength(3);
        });

        it('should have labels for all statuses', () => {
            DEVICE_STATUSES.forEach(status => {
                expect(status.label).toBeDefined();
                expect(typeof status.label).toBe('string');
            });
        });

        it('should have unique values', () => {
            const values = DEVICE_STATUSES.map(s => s.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });
    });
});
