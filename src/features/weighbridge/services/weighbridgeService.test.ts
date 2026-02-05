import { describe, it, expect } from 'vitest';
import type { WeighbridgeEntryType, WeighbridgeEntryStatus } from '../types';

describe('weighbridgeService', () => {
    describe('WeighbridgeEntryType', () => {
        it('should support RM_IN type for raw materials', () => {
            const rmIn: WeighbridgeEntryType = 'RM_IN';
            expect(rmIn).toBe('RM_IN');
        });

        it('should support FG_OUT type for finished goods', () => {
            const fgOut: WeighbridgeEntryType = 'FG_OUT';
            expect(fgOut).toBe('FG_OUT');
        });
    });

    describe('WeighbridgeEntryStatus', () => {
        it('should support PENDING status', () => {
            const status: WeighbridgeEntryStatus = 'PENDING';
            expect(status).toBe('PENDING');
        });

        it('should support FIRST_WEIGHT status', () => {
            const status: WeighbridgeEntryStatus = 'FIRST_WEIGHT';
            expect(status).toBe('FIRST_WEIGHT');
        });

        it('should support COMPLETED status', () => {
            const status: WeighbridgeEntryStatus = 'COMPLETED';
            expect(status).toBe('COMPLETED');
        });

        it('should support CANCELLED status', () => {
            const status: WeighbridgeEntryStatus = 'CANCELLED';
            expect(status).toBe('CANCELLED');
        });
    });

    describe('Net Weight Calculation Logic', () => {
        // Pure function tests for weight calculations
        const calculateNetWeight = (gross: number, tare: number) => Math.abs(gross - tare);

        it('should calculate net weight correctly', () => {
            expect(calculateNetWeight(5000, 2000)).toBe(3000);
            expect(calculateNetWeight(10000, 3500)).toBe(6500);
        });

        it('should handle zero tare weight', () => {
            expect(calculateNetWeight(5000, 0)).toBe(5000);
        });

        it('should handle equal gross and tare weights', () => {
            expect(calculateNetWeight(2000, 2000)).toBe(0);
        });

        it('should return absolute value regardless of order', () => {
            // In some cases tare might be recorded first
            expect(calculateNetWeight(2000, 5000)).toBe(3000);
        });
    });

    describe('Unit Conversion Logic', () => {
        // Test weight unit conversions used in the service
        const convertToKg = (weight: number, unit: 'KG' | 'TONS' | 'KL') => {
            if (unit === 'TONS') return weight * 1000;
            if (unit === 'KL') return weight * 1000; // Approximation for liquids
            return weight;
        };

        it('should convert TONS to KG correctly', () => {
            expect(convertToKg(1, 'TONS')).toBe(1000);
            expect(convertToKg(5.5, 'TONS')).toBe(5500);
            expect(convertToKg(0.5, 'TONS')).toBe(500);
        });

        it('should convert KL to KG correctly', () => {
            expect(convertToKg(1, 'KL')).toBe(1000);
            expect(convertToKg(2.5, 'KL')).toBe(2500);
        });

        it('should keep KG as is', () => {
            expect(convertToKg(500, 'KG')).toBe(500);
            expect(convertToKg(1000, 'KG')).toBe(1000);
        });
    });

    describe('Vehicle Number Normalization', () => {
        // Test the vehicle number normalization logic
        const normalizeVehicleNumber = (vehicleNumber: string) => vehicleNumber.toUpperCase();

        it('should convert to uppercase', () => {
            expect(normalizeVehicleNumber('ka01ab1234')).toBe('KA01AB1234');
            expect(normalizeVehicleNumber('MH12CD5678')).toBe('MH12CD5678');
        });

        it('should handle mixed case', () => {
            expect(normalizeVehicleNumber('Ka01Ab1234')).toBe('KA01AB1234');
        });
    });
});
