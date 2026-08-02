import { describe, expect, it } from 'vitest';
import { arePathsEqual, getParentPath, getPathKey, isPathPrefix, normalizePath } from './indexPath';

describe('index path utilities', () => {
    it('normalizes and serializes index paths', () => {
        expect(normalizePath(2)).toEqual([2]);
        expect(normalizePath([1, 3])).toEqual([1, 3]);
        expect(getPathKey([])).toBe('root');
        expect(getPathKey([1, 3])).toBe('1-3');
    });

    it('compares paths and resolves parents', () => {
        expect(getParentPath([1, 3, 5])).toEqual([1, 3]);
        expect(arePathsEqual([1, 3], [1, 3])).toBe(true);
        expect(arePathsEqual([1, 3], [1, 4])).toBe(false);
        expect(isPathPrefix([1, 3], [1, 3, 5])).toBe(true);
        expect(isPathPrefix([1, 4], [1, 3, 5])).toBe(false);
    });
});
