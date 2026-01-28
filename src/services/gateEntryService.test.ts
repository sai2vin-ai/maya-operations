import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import constants directly - these don't need Firebase mocks
import { MATERIAL_CATEGORIES, ENTRY_STATUSES } from '../services/gateEntryService';

describe('gateEntryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('MATERIAL_CATEGORIES', () => {
        it('should have correct number of categories', () => {
            expect(MATERIAL_CATEGORIES).toHaveLength(6);
        });

        it('should have required fields for each category', () => {
            MATERIAL_CATEGORIES.forEach((category) => {
                expect(category).toHaveProperty('value');
                expect(category).toHaveProperty('label');
                expect(category).toHaveProperty('unit');
            });
        });

        it('should include tyre waste categories', () => {
            const tyreCategories = MATERIAL_CATEGORIES.filter(c => c.value.startsWith('TW-'));
            expect(tyreCategories).toHaveLength(2);
        });

        it('should include output product categories', () => {
            const outputCategories = MATERIAL_CATEGORIES.filter(c =>
                c.value.startsWith('CB-') || c.value.startsWith('PO-') || c.value.startsWith('SW-')
            );
            expect(outputCategories).toHaveLength(4);
        });
    });

    describe('ENTRY_STATUSES', () => {
        it('should have correct statuses', () => {
            const statusValues = ENTRY_STATUSES.map(s => s.value);
            expect(statusValues).toContain('PENDING');
            expect(statusValues).toContain('COMPLETED');
            expect(statusValues).toContain('CANCELLED');
        });

        it('should have color for each status', () => {
            ENTRY_STATUSES.forEach((status) => {
                expect(status.color).toBeDefined();
            });
        });
    });
});
