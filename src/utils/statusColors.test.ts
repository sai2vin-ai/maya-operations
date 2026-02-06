import { describe, it, expect } from 'vitest';
import {
    STATUS_COLORS,
    USER_STATUS,
    DEVICE_STATUS,
    GATE_ENTRY_STATUS,
    BATCH_STATUS,
    REACTOR_STATUS,
    WEIGHBRIDGE_STATUS,
    INVENTORY_CATEGORY,
    USER_ROLE,
    getStatusConfig,
    getStatusBadgeClasses,
} from './statusColors';

describe('statusColors utilities', () => {
    describe('STATUS_COLORS', () => {
        it('should have all defined colors', () => {
            const colors = ['green', 'yellow', 'red', 'blue', 'orange', 'purple', 'gray', 'cyan', 'indigo', 'teal'];
            colors.forEach(color => {
                expect(STATUS_COLORS[color as keyof typeof STATUS_COLORS]).toBeDefined();
                expect(STATUS_COLORS[color as keyof typeof STATUS_COLORS].bgClass).toBeTruthy();
                expect(STATUS_COLORS[color as keyof typeof STATUS_COLORS].textClass).toBeTruthy();
                expect(STATUS_COLORS[color as keyof typeof STATUS_COLORS].borderClass).toBeTruthy();
            });
        });

        it('should have correct class patterns', () => {
            expect(STATUS_COLORS.green.bgClass).toContain('bg-green');
            expect(STATUS_COLORS.green.textClass).toContain('text-green');
            expect(STATUS_COLORS.green.borderClass).toContain('border-green');
        });
    });

    describe('USER_STATUS', () => {
        it('should have all user statuses', () => {
            expect(USER_STATUS.ACTIVE).toBeDefined();
            expect(USER_STATUS.INACTIVE).toBeDefined();
            expect(USER_STATUS.SUSPENDED).toBeDefined();
        });

        it('should have correct colors for statuses', () => {
            expect(USER_STATUS.ACTIVE.color).toBe('green');
            expect(USER_STATUS.INACTIVE.color).toBe('red');
            expect(USER_STATUS.SUSPENDED.color).toBe('yellow');
        });

        it('should have labels', () => {
            expect(USER_STATUS.ACTIVE.label).toBe('Active');
            expect(USER_STATUS.INACTIVE.label).toBe('Inactive');
        });
    });

    describe('DEVICE_STATUS', () => {
        it('should have all device statuses', () => {
            expect(DEVICE_STATUS.ACTIVE).toBeDefined();
            expect(DEVICE_STATUS.INACTIVE).toBeDefined();
            expect(DEVICE_STATUS.PENDING).toBeDefined();
        });
    });

    describe('GATE_ENTRY_STATUS', () => {
        it('should have all gate entry statuses', () => {
            expect(GATE_ENTRY_STATUS.PENDING).toBeDefined();
            expect(GATE_ENTRY_STATUS.COMPLETED).toBeDefined();
            expect(GATE_ENTRY_STATUS.CANCELLED).toBeDefined();
        });

        it('should have correct colors', () => {
            expect(GATE_ENTRY_STATUS.PENDING.color).toBe('yellow');
            expect(GATE_ENTRY_STATUS.COMPLETED.color).toBe('green');
            expect(GATE_ENTRY_STATUS.CANCELLED.color).toBe('red');
        });
    });

    describe('BATCH_STATUS', () => {
        it('should have all batch statuses', () => {
            expect(BATCH_STATUS.IN_PROGRESS).toBeDefined();
            expect(BATCH_STATUS.COMPLETED).toBeDefined();
            expect(BATCH_STATUS.CANCELLED).toBeDefined();
        });

        it('should have correct labels', () => {
            expect(BATCH_STATUS.IN_PROGRESS.label).toBe('In Progress');
        });
    });

    describe('REACTOR_STATUS', () => {
        it('should have all reactor statuses', () => {
            expect(REACTOR_STATUS.IDLE).toBeDefined();
            expect(REACTOR_STATUS.RUNNING).toBeDefined();
            expect(REACTOR_STATUS.MAINTENANCE).toBeDefined();
            expect(REACTOR_STATUS.OFFLINE).toBeDefined();
        });

        it('should have correct colors', () => {
            expect(REACTOR_STATUS.IDLE.color).toBe('gray');
            expect(REACTOR_STATUS.RUNNING.color).toBe('green');
            expect(REACTOR_STATUS.MAINTENANCE.color).toBe('yellow');
            expect(REACTOR_STATUS.OFFLINE.color).toBe('red');
        });
    });

    describe('WEIGHBRIDGE_STATUS', () => {
        it('should have all weighbridge statuses', () => {
            expect(WEIGHBRIDGE_STATUS.PENDING).toBeDefined();
            expect(WEIGHBRIDGE_STATUS.COMPLETED).toBeDefined();
            expect(WEIGHBRIDGE_STATUS.CANCELLED).toBeDefined();
        });
    });

    describe('INVENTORY_CATEGORY', () => {
        it('should have all inventory categories', () => {
            expect(INVENTORY_CATEGORY.RAW_MATERIAL).toBeDefined();
            expect(INVENTORY_CATEGORY.FINISHED_PRODUCT).toBeDefined();
            expect(INVENTORY_CATEGORY.CONSUMABLE).toBeDefined();
            expect(INVENTORY_CATEGORY.FUEL).toBeDefined();
        });

        it('should have correct labels', () => {
            expect(INVENTORY_CATEGORY.RAW_MATERIAL.label).toBe('Raw Material');
            expect(INVENTORY_CATEGORY.FINISHED_PRODUCT.label).toBe('Finished Product');
        });
    });

    describe('USER_ROLE', () => {
        it('should have all user roles', () => {
            const roles = [
                'SUPER_ADMIN',
                'PLANT_MANAGER',
                'SHIFT_SUPERVISOR',
                'REACTOR_OPERATOR',
                'GATE_OPERATOR',
                'WEIGHBRIDGE_OPERATOR',
                'STORES_KEEPER',
                'MAINTENANCE_TECH',
                'VIEWER',
            ];
            roles.forEach(role => {
                expect(USER_ROLE[role]).toBeDefined();
            });
        });

        it('should have distinct colors for different roles', () => {
            expect(USER_ROLE.SUPER_ADMIN.color).toBe('purple');
            expect(USER_ROLE.PLANT_MANAGER.color).toBe('blue');
            expect(USER_ROLE.VIEWER.color).toBe('gray');
        });

        it('should have human-readable labels', () => {
            expect(USER_ROLE.SUPER_ADMIN.label).toBe('Super Admin');
            expect(USER_ROLE.SHIFT_SUPERVISOR.label).toBe('Shift Supervisor');
        });
    });

    describe('getStatusConfig', () => {
        it('should return config for existing status', () => {
            const config = getStatusConfig(USER_STATUS, 'ACTIVE');
            expect(config.label).toBe('Active');
            expect(config.color).toBe('green');
        });

        it('should return default gray config for unknown status', () => {
            const config = getStatusConfig(USER_STATUS, 'UNKNOWN_STATUS');
            expect(config.label).toBe('UNKNOWN_STATUS');
            expect(config.color).toBe('gray');
        });

        it('should include CSS classes in returned config', () => {
            const config = getStatusConfig(GATE_ENTRY_STATUS, 'COMPLETED');
            expect(config.bgClass).toContain('bg-green');
            expect(config.textClass).toContain('text-green');
        });
    });

    describe('getStatusBadgeClasses', () => {
        it('should return combined bg and text classes', () => {
            const classes = getStatusBadgeClasses('green');
            expect(classes).toContain('bg-green');
            expect(classes).toContain('text-green');
        });

        it('should work for all colors', () => {
            const colors = ['green', 'yellow', 'red', 'blue', 'orange', 'purple', 'gray', 'cyan', 'indigo', 'teal'] as const;
            colors.forEach(color => {
                const classes = getStatusBadgeClasses(color);
                expect(classes).toContain(`bg-${color === 'gray' ? 'slate' : color}`);
                expect(classes).toContain(`text-${color === 'gray' ? 'slate' : color}`);
            });
        });
    });
});
