import { describe, it, expect } from 'vitest';
import {
    deriveActionsFromMatrix,
    buildDefaultMatrix,
    MODULE_ACTION_MAP,
    ALWAYS_GRANTED_ACTIONS,
} from './permissionMapping';
import { ROLE_DEFINITIONS } from './roles';

describe('permissionMapping', () => {
    describe('deriveActionsFromMatrix', () => {
        it('should include ALWAYS_GRANTED_ACTIONS for empty permissions', () => {
            const actions = deriveActionsFromMatrix({ DASHBOARD: ['view'] });
            expect(actions).toEqual(expect.arrayContaining(ALWAYS_GRANTED_ACTIONS));
        });

        it('should derive user management actions', () => {
            const actions = deriveActionsFromMatrix({
                USERS: ['view', 'create', 'edit', 'delete'],
            });
            expect(actions).toContain('users:create');
            expect(actions).toContain('users:update');
            expect(actions).toContain('users:delete');
        });

        it('should derive gate actions from create and edit', () => {
            const actions = deriveActionsFromMatrix({
                GATE: ['view', 'create', 'edit'],
            });
            expect(actions).toContain('gate:create');
            expect(actions).toContain('gate:update');
            expect(actions).toContain('gate:cancel');
        });

        it('should derive reactor actions', () => {
            const actions = deriveActionsFromMatrix({
                REACTOR: ['view', 'create', 'edit'],
            });
            expect(actions).toContain('batch:create');
            expect(actions).toContain('batch:complete_step');
            expect(actions).toContain('batch:cancel');
        });

        it('should derive inventory actions', () => {
            const actions = deriveActionsFromMatrix({
                INVENTORY: ['view', 'create', 'edit'],
            });
            expect(actions).toContain('inventory:create');
            expect(actions).toContain('inventory:update');
            expect(actions).toContain('inventory:transact');
        });

        it('should derive spare parts actions', () => {
            const actions = deriveActionsFromMatrix({
                SPARE_PARTS: ['view', 'create', 'edit'],
            });
            expect(actions).toContain('spare_parts:create');
            expect(actions).toContain('spare_parts:update');
            expect(actions).toContain('spare_parts:transact');
        });

        it('should derive maintenance actions including asset_register', () => {
            const actions = deriveActionsFromMatrix({
                MAINTENANCE: ['view', 'create', 'edit'],
            });
            expect(actions).toContain('maintenance:create');
            expect(actions).toContain('maintenance:update');
            expect(actions).toContain('asset_register:create');
            expect(actions).toContain('asset_register:update');
        });

        it('should derive weighbridge actions', () => {
            const actions = deriveActionsFromMatrix({
                WEIGHBRIDGE: ['view', 'create', 'edit'],
            });
            expect(actions).toContain('weighbridge:create');
            expect(actions).toContain('weighbridge:update');
        });

        it('should not derive actions for view-only permission', () => {
            const actions = deriveActionsFromMatrix({
                GATE: ['view'],
            });
            expect(actions).not.toContain('gate:create');
            expect(actions).not.toContain('gate:update');
            // but always-granted are present
            expect(actions).toContain('bug_reports:create');
        });

        it('should ignore unknown module keys', () => {
            const actions = deriveActionsFromMatrix({
                UNKNOWN_MODULE: ['view', 'create'],
            });
            // Only always-granted actions
            expect(actions).toEqual(ALWAYS_GRANTED_ACTIONS);
        });

        it('should not include SUPER_ADMIN-only actions', () => {
            const actions = deriveActionsFromMatrix({
                USERS: ['view', 'create', 'edit', 'delete'],
                GATE: ['view', 'create', 'edit'],
            });
            expect(actions).not.toContain('webhooks:manage');
            expect(actions).not.toContain('bug_reports:manage');
        });
    });

    describe('buildDefaultMatrix', () => {
        it('should exclude SUPER_ADMIN', () => {
            const matrix = buildDefaultMatrix();
            expect(matrix['SUPER_ADMIN']).toBeUndefined();
        });

        it('should include all other roles', () => {
            const matrix = buildDefaultMatrix();
            const nonAdminRoles = ROLE_DEFINITIONS.filter((r) => r.value !== 'SUPER_ADMIN');
            for (const role of nonAdminRoles) {
                expect(matrix[role.value]).toBeDefined();
            }
        });

        it('should match static ROLE_DEFINITIONS permissions', () => {
            const matrix = buildDefaultMatrix();
            const plantManager = ROLE_DEFINITIONS.find((r) => r.value === 'PLANT_MANAGER');
            expect(matrix['PLANT_MANAGER']).toEqual(plantManager?.permissions);
        });

        it('should create deep copies (not share references)', () => {
            const matrix = buildDefaultMatrix();
            const matrix2 = buildDefaultMatrix();
            matrix['PLANT_MANAGER']['USERS'].push('delete');
            expect(matrix2['PLANT_MANAGER']['USERS']).not.toContain('delete');
        });
    });

    describe('MODULE_ACTION_MAP completeness', () => {
        it('should have mappings for all write-capable modules', () => {
            const expectedModules = [
                'USERS',
                'DEVICES',
                'GATE',
                'REACTOR',
                'INVENTORY',
                'WEIGHBRIDGE',
                'SPARE_PARTS',
                'MAINTENANCE',
            ];
            for (const mod of expectedModules) {
                expect(MODULE_ACTION_MAP[mod]).toBeDefined();
            }
        });

        it('should not have mappings for view-only modules', () => {
            expect(MODULE_ACTION_MAP['DASHBOARD']).toBeUndefined();
            expect(MODULE_ACTION_MAP['ROLES']).toBeUndefined();
        });
    });
});
