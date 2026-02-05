import { describe, it, expect } from 'vitest';
import { SPARE_PART_CATEGORIES, SPARE_PART_UNITS } from './sparePartsService';

describe('sparePartsService', () => {
    describe('SPARE_PART_CATEGORIES', () => {
        it('should have all required categories', () => {
            const categoryValues = SPARE_PART_CATEGORIES.map(c => c.value);
            expect(categoryValues).toContain('MOTOR');
            expect(categoryValues).toContain('PUMP');
            expect(categoryValues).toContain('VALVE');
            expect(categoryValues).toContain('BEARING');
            expect(categoryValues).toContain('BELT');
            expect(categoryValues).toContain('SEAL');
            expect(categoryValues).toContain('ELECTRICAL');
            expect(categoryValues).toContain('HYDRAULIC');
            expect(categoryValues).toContain('PNEUMATIC');
            expect(categoryValues).toContain('GENERAL');
        });

        it('should have exactly 10 categories', () => {
            expect(SPARE_PART_CATEGORIES).toHaveLength(10);
        });

        it('should have labels for all categories', () => {
            SPARE_PART_CATEGORIES.forEach(category => {
                expect(category.label).toBeDefined();
                expect(typeof category.label).toBe('string');
                expect(category.label.length).toBeGreaterThan(0);
            });
        });

        it('should have unique values', () => {
            const values = SPARE_PART_CATEGORIES.map(c => c.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });

        it('should have mechanical part categories', () => {
            const categoryValues = SPARE_PART_CATEGORIES.map(c => c.value);
            expect(categoryValues).toContain('BEARING');
            expect(categoryValues).toContain('BELT');
            expect(categoryValues).toContain('SEAL');
        });

        it('should have system categories', () => {
            const categoryValues = SPARE_PART_CATEGORIES.map(c => c.value);
            expect(categoryValues).toContain('ELECTRICAL');
            expect(categoryValues).toContain('HYDRAULIC');
            expect(categoryValues).toContain('PNEUMATIC');
        });

        it('should have a general/catch-all category', () => {
            const general = SPARE_PART_CATEGORIES.find(c => c.value === 'GENERAL');
            expect(general).toBeDefined();
            expect(general?.label).toBe('General');
        });
    });

    describe('SPARE_PART_UNITS', () => {
        it('should have all required units', () => {
            expect(SPARE_PART_UNITS).toContain('PCS');
            expect(SPARE_PART_UNITS).toContain('SET');
            expect(SPARE_PART_UNITS).toContain('MTR');
            expect(SPARE_PART_UNITS).toContain('KG');
            expect(SPARE_PART_UNITS).toContain('LTR');
            expect(SPARE_PART_UNITS).toContain('PAIR');
            expect(SPARE_PART_UNITS).toContain('BOX');
        });

        it('should have exactly 7 units', () => {
            expect(SPARE_PART_UNITS).toHaveLength(7);
        });

        it('should have unique values', () => {
            const uniqueUnits = new Set(SPARE_PART_UNITS);
            expect(uniqueUnits.size).toBe(SPARE_PART_UNITS.length);
        });

        it('should have count units', () => {
            expect(SPARE_PART_UNITS).toContain('PCS');
            expect(SPARE_PART_UNITS).toContain('SET');
            expect(SPARE_PART_UNITS).toContain('PAIR');
            expect(SPARE_PART_UNITS).toContain('BOX');
        });

        it('should have measurement units', () => {
            expect(SPARE_PART_UNITS).toContain('MTR');
            expect(SPARE_PART_UNITS).toContain('KG');
            expect(SPARE_PART_UNITS).toContain('LTR');
        });
    });
});
