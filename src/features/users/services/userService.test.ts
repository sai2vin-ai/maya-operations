import { describe, it, expect } from 'vitest';
import { USER_ROLES, USER_STATUSES } from './userService';

describe('userService', () => {
    describe('USER_ROLES', () => {
        it('should have all required roles', () => {
            const roleValues = USER_ROLES.map(r => r.value);
            expect(roleValues).toContain('SUPER_ADMIN');
            expect(roleValues).toContain('PLANT_MANAGER');
            expect(roleValues).toContain('SHIFT_SUPERVISOR');
            expect(roleValues).toContain('GATE_OPERATOR');
            expect(roleValues).toContain('REACTOR_OPERATOR');
            expect(roleValues).toContain('MAINTENANCE_TECH');
            expect(roleValues).toContain('STORES_KEEPER');
            expect(roleValues).toContain('VIEWER');
        });

        it('should have exactly 8 roles', () => {
            expect(USER_ROLES).toHaveLength(8);
        });

        it('should have labels for all roles', () => {
            USER_ROLES.forEach(role => {
                expect(role.label).toBeDefined();
                expect(typeof role.label).toBe('string');
                expect(role.label.length).toBeGreaterThan(0);
            });
        });

        it('should have unique values', () => {
            const values = USER_ROLES.map(r => r.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });

        it('should have human-readable labels', () => {
            const superAdmin = USER_ROLES.find(r => r.value === 'SUPER_ADMIN');
            expect(superAdmin?.label).toBe('Super Admin');

            const gateOperator = USER_ROLES.find(r => r.value === 'GATE_OPERATOR');
            expect(gateOperator?.label).toBe('Gate Operator');

            const maintenanceTech = USER_ROLES.find(r => r.value === 'MAINTENANCE_TECH');
            expect(maintenanceTech?.label).toBe('Maintenance Technician');
        });
    });

    describe('USER_STATUSES', () => {
        it('should have all required statuses', () => {
            const statusValues = USER_STATUSES.map(s => s.value);
            expect(statusValues).toContain('ACTIVE');
            expect(statusValues).toContain('INACTIVE');
            expect(statusValues).toContain('SUSPENDED');
        });

        it('should have exactly 3 statuses', () => {
            expect(USER_STATUSES).toHaveLength(3);
        });

        it('should have labels for all statuses', () => {
            USER_STATUSES.forEach(status => {
                expect(status.label).toBeDefined();
                expect(typeof status.label).toBe('string');
            });
        });

        it('should have correct labels', () => {
            const active = USER_STATUSES.find(s => s.value === 'ACTIVE');
            expect(active?.label).toBe('Active');

            const inactive = USER_STATUSES.find(s => s.value === 'INACTIVE');
            expect(inactive?.label).toBe('Inactive');

            const suspended = USER_STATUSES.find(s => s.value === 'SUSPENDED');
            expect(suspended?.label).toBe('Suspended');
        });
    });
});
