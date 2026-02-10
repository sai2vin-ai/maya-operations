import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { parseDoc, parseDocs } from '../schemas';

// Simple test schema that doesn't depend on Firestore Timestamp
const testSchema = z.object({
    id: z.string(),
    name: z.string(),
    count: z.number(),
});
type TestDoc = z.infer<typeof testSchema>;

describe('parseDoc', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns parsed data when input is valid', () => {
        const valid: TestDoc = { id: '1', name: 'Alpha', count: 10 };
        const result = parseDoc(testSchema, valid, 'Test');

        expect(result).toEqual({ id: '1', name: 'Alpha', count: 10 });
    });

    it('returns raw data as fallback when input is invalid', () => {
        const invalid = { id: 123, name: 'Beta' }; // id should be string, count is missing
        const result = parseDoc(testSchema, invalid, 'Test');

        // Should return the raw data unchanged as a fallback
        expect(result).toBe(invalid);
    });

    it('logs console.warn in dev mode when validation fails', () => {
        const invalid = { id: 'x', name: 'Y' }; // missing count
        parseDoc(testSchema, invalid, 'Test');

        expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('includes context string in warning message', () => {
        const invalid = { id: 'x' }; // missing name and count
        parseDoc(testSchema, invalid, 'UserService');

        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('UserService'), expect.anything());
    });

    it('includes issue count in warning message', () => {
        // Missing both name (1 issue) and count (1 issue) => 2 issues
        const invalid = { id: 'x' };
        parseDoc(testSchema, invalid, 'Test');

        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('2 issue(s)'), expect.anything());
    });

    it('uses "Unknown" as default context when none is provided', () => {
        const invalid = { id: 'x' };
        parseDoc(testSchema, invalid);

        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('[Schema Validation] Unknown:'),
            expect.anything(),
        );
    });

    it('does not log console.warn when input is valid', () => {
        const valid: TestDoc = { id: '1', name: 'Alpha', count: 5 };
        parseDoc(testSchema, valid, 'Test');

        expect(console.warn).not.toHaveBeenCalled();
    });

    it('passes through extra fields on valid data (Zod default strip behavior)', () => {
        const withExtra = { id: '1', name: 'Alpha', count: 5, extra: 'bonus' };
        const result = parseDoc(testSchema, withExtra, 'Test');

        // Zod strips unknown keys by default, so extra should be removed
        expect(result).toEqual({ id: '1', name: 'Alpha', count: 5 });
        expect(result).not.toHaveProperty('extra');
    });
});

describe('parseDocs', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('validates each item in the array and returns parsed data', () => {
        const docs = [
            { id: '1', name: 'A', count: 1 },
            { id: '2', name: 'B', count: 2 },
        ];
        const result = parseDocs(testSchema, docs, 'Test');

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: '1', name: 'A', count: 1 });
        expect(result[1]).toEqual({ id: '2', name: 'B', count: 2 });
    });

    it('returns all items even if some are invalid', () => {
        const docs = [
            { id: '1', name: 'Valid', count: 1 },
            { id: 999, name: 'Invalid' }, // invalid: id wrong type, missing count
            { id: '3', name: 'AlsoValid', count: 3 },
        ];
        const result = parseDocs(testSchema, docs, 'Test');

        expect(result).toHaveLength(3);
        // First item is parsed (valid)
        expect(result[0]).toEqual({ id: '1', name: 'Valid', count: 1 });
        // Second item is returned raw as fallback (invalid)
        expect(result[1]).toBe(docs[1]);
        // Third item is parsed (valid)
        expect(result[2]).toEqual({ id: '3', name: 'AlsoValid', count: 3 });
    });

    it('returns empty array when given empty array', () => {
        const result = parseDocs(testSchema, [], 'Test');

        expect(result).toEqual([]);
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('appends array index to context for each item', () => {
        const docs = [{ bad: true }, { alsobad: true }];
        parseDocs(testSchema, docs, 'BatchList');

        expect(console.warn).toHaveBeenCalledTimes(2);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('BatchList[0]'), expect.anything());
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('BatchList[1]'), expect.anything());
    });

    it('uses "Unknown" with index when no context is provided', () => {
        const docs = [{ bad: true }];
        parseDocs(testSchema, docs);

        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown[0]'), expect.anything());
    });
});
