import { describe, it, expect } from 'vitest';
import { hasPermission, assertAuthorized } from './authorization';

describe('authorization', () => {
    describe('hasPermission', () => {
        it('should grant SUPER_ADMIN all permissions', () => {
            expect(hasPermission('SUPER_ADMIN', 'users:create')).toBe(true);
            expect(hasPermission('SUPER_ADMIN', 'users:update')).toBe(true);
            expect(hasPermission('SUPER_ADMIN', 'users:delete')).toBe(true);
            expect(hasPermission('SUPER_ADMIN', 'devices:manage')).toBe(true);
            expect(hasPermission('SUPER_ADMIN', 'gate:create')).toBe(true);
            expect(hasPermission('SUPER_ADMIN', 'batch:create')).toBe(true);
            expect(hasPermission('SUPER_ADMIN', 'inventory:create')).toBe(true);
            expect(hasPermission('SUPER_ADMIN', 'webhooks:manage')).toBe(true);
            expect(hasPermission('SUPER_ADMIN', 'spare_parts:create')).toBe(true);
        });

        it('should restrict GATE_OPERATOR to gate and weighbridge', () => {
            expect(hasPermission('GATE_OPERATOR', 'gate:create')).toBe(true);
            expect(hasPermission('GATE_OPERATOR', 'gate:update')).toBe(true);
            expect(hasPermission('GATE_OPERATOR', 'weighbridge:create')).toBe(true);
            expect(hasPermission('GATE_OPERATOR', 'users:create')).toBe(false);
            expect(hasPermission('GATE_OPERATOR', 'batch:create')).toBe(false);
            expect(hasPermission('GATE_OPERATOR', 'webhooks:manage')).toBe(false);
        });

        it('should restrict REACTOR_OPERATOR to batch operations', () => {
            expect(hasPermission('REACTOR_OPERATOR', 'batch:create')).toBe(true);
            expect(hasPermission('REACTOR_OPERATOR', 'batch:complete_step')).toBe(true);
            expect(hasPermission('REACTOR_OPERATOR', 'batch:cancel')).toBe(false);
            expect(hasPermission('REACTOR_OPERATOR', 'gate:create')).toBe(false);
            expect(hasPermission('REACTOR_OPERATOR', 'users:create')).toBe(false);
        });

        it('should give VIEWER no permissions', () => {
            expect(hasPermission('VIEWER', 'users:create')).toBe(false);
            expect(hasPermission('VIEWER', 'gate:create')).toBe(false);
            expect(hasPermission('VIEWER', 'batch:create')).toBe(false);
            expect(hasPermission('VIEWER', 'inventory:create')).toBe(false);
        });

        it('should allow STORES_KEEPER inventory and spare parts', () => {
            expect(hasPermission('STORES_KEEPER', 'inventory:create')).toBe(true);
            expect(hasPermission('STORES_KEEPER', 'inventory:update')).toBe(true);
            expect(hasPermission('STORES_KEEPER', 'inventory:transact')).toBe(true);
            expect(hasPermission('STORES_KEEPER', 'spare_parts:create')).toBe(true);
            expect(hasPermission('STORES_KEEPER', 'gate:create')).toBe(false);
        });

        it('should allow PLANT_MANAGER broad access without devices/webhooks', () => {
            expect(hasPermission('PLANT_MANAGER', 'users:create')).toBe(true);
            expect(hasPermission('PLANT_MANAGER', 'gate:create')).toBe(true);
            expect(hasPermission('PLANT_MANAGER', 'batch:create')).toBe(true);
            expect(hasPermission('PLANT_MANAGER', 'devices:manage')).toBe(false);
            expect(hasPermission('PLANT_MANAGER', 'webhooks:manage')).toBe(false);
        });

        it('should allow MAINTENANCE_TECH spare parts transactions only', () => {
            expect(hasPermission('MAINTENANCE_TECH', 'spare_parts:transact')).toBe(true);
            expect(hasPermission('MAINTENANCE_TECH', 'spare_parts:create')).toBe(false);
            expect(hasPermission('MAINTENANCE_TECH', 'inventory:create')).toBe(false);
        });
    });

    describe('assertAuthorized', () => {
        it('should not throw for authorized actions', () => {
            expect(() => assertAuthorized('SUPER_ADMIN', 'users:create')).not.toThrow();
            expect(() => assertAuthorized('GATE_OPERATOR', 'gate:create')).not.toThrow();
        });

        it('should throw for unauthorized actions', () => {
            expect(() => assertAuthorized('VIEWER', 'users:create')).toThrow('Unauthorized');
            expect(() => assertAuthorized('GATE_OPERATOR', 'batch:create')).toThrow('Unauthorized');
        });

        it('should throw for undefined role', () => {
            expect(() => assertAuthorized(undefined, 'users:create')).toThrow('Authentication required');
        });
    });
});
