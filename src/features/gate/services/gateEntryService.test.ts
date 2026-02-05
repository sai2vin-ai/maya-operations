import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MATERIAL_CATEGORIES, ENTRY_STATUSES } from './gateEntryService';

describe('gateEntryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('MATERIAL_CATEGORIES', () => {
        it('should have correct number of categories', () => {
            expect(MATERIAL_CATEGORIES).toHaveLength(6);
        });

        it('should have required fields for each category', () => {
            MATERIAL_CATEGORIES.forEach(category => {
                expect(category).toHaveProperty('value');
                expect(category).toHaveProperty('label');
                expect(category).toHaveProperty('unit');
            });
        });

        it('should include tyre waste categories', () => {
            const tyreCategories = MATERIAL_CATEGORIES.filter(c => c.value.startsWith('TW-'));
            expect(tyreCategories).toHaveLength(2);

            const whole = tyreCategories.find(c => c.value === 'TW-WHOLE');
            expect(whole?.label).toBe('Whole Waste Tyres');
            expect(whole?.unit).toBe('TONS');

            const shred = tyreCategories.find(c => c.value === 'TW-SHRED');
            expect(shred?.label).toBe('Pre-shredded Tyre Chips');
            expect(shred?.unit).toBe('TONS');
        });

        it('should include carbon black categories', () => {
            const carbonCategories = MATERIAL_CATEGORIES.filter(c => c.value.startsWith('CB-'));
            expect(carbonCategories).toHaveLength(2);

            const standard = carbonCategories.find(c => c.value === 'CB-STD');
            expect(standard?.label).toBe('Carbon Black (Standard)');
            expect(standard?.unit).toBe('KG');

            const highGrade = carbonCategories.find(c => c.value === 'CB-HG');
            expect(highGrade?.label).toBe('Carbon Black (High Grade)');
            expect(highGrade?.unit).toBe('KG');
        });

        it('should include pyrolysis oil category', () => {
            const oilCategories = MATERIAL_CATEGORIES.filter(c => c.value.startsWith('PO-'));
            expect(oilCategories).toHaveLength(1);

            const crude = oilCategories.find(c => c.value === 'PO-CRD');
            expect(crude?.label).toBe('Pyrolysis Oil (Crude)');
            expect(crude?.unit).toBe('KG');
        });

        it('should include steel wire category', () => {
            const wireCategories = MATERIAL_CATEGORIES.filter(c => c.value.startsWith('SW-'));
            expect(wireCategories).toHaveLength(1);

            const mixed = wireCategories.find(c => c.value === 'SW-MIX');
            expect(mixed?.label).toBe('Steel Wire (Mixed)');
            expect(mixed?.unit).toBe('KG');
        });

        it('should have unique category values', () => {
            const values = MATERIAL_CATEGORIES.map(c => c.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });
    });

    describe('ENTRY_STATUSES', () => {
        it('should have correct statuses', () => {
            const statusValues = ENTRY_STATUSES.map(s => s.value);
            expect(statusValues).toContain('PENDING');
            expect(statusValues).toContain('COMPLETED');
            expect(statusValues).toContain('CANCELLED');
        });

        it('should have exactly 3 statuses', () => {
            expect(ENTRY_STATUSES).toHaveLength(3);
        });

        it('should have label and color for each status', () => {
            ENTRY_STATUSES.forEach(status => {
                expect(status.label).toBeDefined();
                expect(status.color).toBeDefined();
                expect(typeof status.label).toBe('string');
                expect(typeof status.color).toBe('string');
            });
        });

        it('should have correct colors', () => {
            const pending = ENTRY_STATUSES.find(s => s.value === 'PENDING');
            expect(pending?.color).toBe('yellow');

            const completed = ENTRY_STATUSES.find(s => s.value === 'COMPLETED');
            expect(completed?.color).toBe('green');

            const cancelled = ENTRY_STATUSES.find(s => s.value === 'CANCELLED');
            expect(cancelled?.color).toBe('red');
        });

        it('should have unique values', () => {
            const values = ENTRY_STATUSES.map(s => s.value);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });
    });

    describe('Net Weight Calculation Logic', () => {
        // Test the net weight calculation logic used in createGateEntry
        const calculateNetWeight = (weighbridgeReading: number | null, tareWeight: number | null): number | null => {
            if (weighbridgeReading != null && tareWeight != null) {
                return weighbridgeReading - tareWeight;
            }
            return null;
        };

        it('should calculate net weight when both values provided', () => {
            expect(calculateNetWeight(5000, 2000)).toBe(3000);
            expect(calculateNetWeight(10000, 3500)).toBe(6500);
        });

        it('should return null when weighbridge reading is missing', () => {
            expect(calculateNetWeight(null, 2000)).toBeNull();
        });

        it('should return null when tare weight is missing', () => {
            expect(calculateNetWeight(5000, null)).toBeNull();
        });

        it('should return null when both values are missing', () => {
            expect(calculateNetWeight(null, null)).toBeNull();
        });

        it('should handle zero values', () => {
            expect(calculateNetWeight(5000, 0)).toBe(5000);
            expect(calculateNetWeight(0, 0)).toBe(0);
        });
    });

    describe('Vehicle Number Normalization', () => {
        const normalizeVehicleNumber = (vehicleNumber: string) => vehicleNumber.toUpperCase();

        it('should convert vehicle number to uppercase', () => {
            expect(normalizeVehicleNumber('ka01ab1234')).toBe('KA01AB1234');
        });

        it('should handle already uppercase', () => {
            expect(normalizeVehicleNumber('MH12CD5678')).toBe('MH12CD5678');
        });

        it('should handle mixed case', () => {
            expect(normalizeVehicleNumber('Tn09Xy1234')).toBe('TN09XY1234');
        });
    });
});
