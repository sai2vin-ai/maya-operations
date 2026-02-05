import { describe, it, expect } from 'vitest';
import { INVENTORY_CATEGORIES, TRANSACTION_TYPES, COMMON_UNITS } from './inventoryService';

describe('inventoryService', () => {
    describe('INVENTORY_CATEGORIES', () => {
        it('should have all required categories', () => {
            const categoryValues = INVENTORY_CATEGORIES.map(c => c.value);
            expect(categoryValues).toContain('RAW_MATERIAL');
            expect(categoryValues).toContain('FINISHED_PRODUCT');
            expect(categoryValues).toContain('CONSUMABLE');
            expect(categoryValues).toContain('SPARE_PART');
        });

        it('should have exactly 4 categories', () => {
            expect(INVENTORY_CATEGORIES).toHaveLength(4);
        });

        it('should have labels for all categories', () => {
            INVENTORY_CATEGORIES.forEach(category => {
                expect(category.label).toBeDefined();
                expect(typeof category.label).toBe('string');
                expect(category.label.length).toBeGreaterThan(0);
            });
        });

        it('should have human-readable labels', () => {
            const rawMaterial = INVENTORY_CATEGORIES.find(c => c.value === 'RAW_MATERIAL');
            expect(rawMaterial?.label).toBe('Raw Material');

            const finishedProduct = INVENTORY_CATEGORIES.find(c => c.value === 'FINISHED_PRODUCT');
            expect(finishedProduct?.label).toBe('Finished Product');
        });

        it('should have unique values', () => {
            const values = INVENTORY_CATEGORIES.map(c => c.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });
    });

    describe('TRANSACTION_TYPES', () => {
        it('should have all required transaction types', () => {
            const typeValues = TRANSACTION_TYPES.map(t => t.value);
            expect(typeValues).toContain('RECEIPT');
            expect(typeValues).toContain('ISSUE');
            expect(typeValues).toContain('ADJUSTMENT');
            expect(typeValues).toContain('TRANSFER');
        });

        it('should have exactly 4 transaction types', () => {
            expect(TRANSACTION_TYPES).toHaveLength(4);
        });

        it('should have labels and colors for all types', () => {
            TRANSACTION_TYPES.forEach(type => {
                expect(type.label).toBeDefined();
                expect(type.color).toBeDefined();
                expect(typeof type.label).toBe('string');
                expect(typeof type.color).toBe('string');
            });
        });

        it('should have correct colors for each type', () => {
            const receipt = TRANSACTION_TYPES.find(t => t.value === 'RECEIPT');
            expect(receipt?.color).toBe('green');

            const issue = TRANSACTION_TYPES.find(t => t.value === 'ISSUE');
            expect(issue?.color).toBe('red');

            const adjustment = TRANSACTION_TYPES.find(t => t.value === 'ADJUSTMENT');
            expect(adjustment?.color).toBe('yellow');

            const transfer = TRANSACTION_TYPES.find(t => t.value === 'TRANSFER');
            expect(transfer?.color).toBe('blue');
        });

        it('should have meaningful color associations', () => {
            // Green for receipt (adding stock)
            const receipt = TRANSACTION_TYPES.find(t => t.value === 'RECEIPT');
            expect(receipt?.color).toBe('green');

            // Red for issue (removing stock)
            const issue = TRANSACTION_TYPES.find(t => t.value === 'ISSUE');
            expect(issue?.color).toBe('red');
        });
    });

    describe('COMMON_UNITS', () => {
        it('should have common measurement units', () => {
            expect(COMMON_UNITS).toContain('KG');
            expect(COMMON_UNITS).toContain('TONS');
            expect(COMMON_UNITS).toContain('LITRE');
            expect(COMMON_UNITS).toContain('NOS');
        });

        it('should have exactly 8 common units', () => {
            expect(COMMON_UNITS).toHaveLength(8);
        });

        it('should include weight units', () => {
            expect(COMMON_UNITS).toContain('KG');
            expect(COMMON_UNITS).toContain('TONS');
        });

        it('should include volume units', () => {
            expect(COMMON_UNITS).toContain('LITRE');
            expect(COMMON_UNITS).toContain('KL');
        });

        it('should include count/quantity units', () => {
            expect(COMMON_UNITS).toContain('NOS');
            expect(COMMON_UNITS).toContain('SET');
            expect(COMMON_UNITS).toContain('BOX');
        });

        it('should include length units', () => {
            expect(COMMON_UNITS).toContain('MTR');
        });

        it('should have unique values', () => {
            const uniqueUnits = new Set(COMMON_UNITS);
            expect(uniqueUnits.size).toBe(COMMON_UNITS.length);
        });
    });
});
