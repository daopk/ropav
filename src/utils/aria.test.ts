import { describe, expect, it } from 'vitest';

import { hasAriaIdRef, mergeAriaIdRefs, parseAriaIdRefs } from './aria';

describe('ARIA ID references', () => {
    it('parses whitespace-separated references and matches complete IDs', () => {
        expect(parseAriaIdRefs(' label   help\tdescription ')).toEqual([
            'label',
            'help',
            'description',
        ]);
        expect(parseAriaIdRefs(undefined)).toEqual([]);
        expect(hasAriaIdRef('label help', 'help')).toBe(true);
        expect(hasAriaIdRef('label help', 'hel')).toBe(false);
    });
});

describe('mergeAriaIdRefs', () => {
    it('combines ID references in first-seen order and removes duplicates', () => {
        expect(mergeAriaIdRefs('label help label', 'description help')).toBe(
            'label help description',
        );
    });

    it('ignores empty and missing values', () => {
        expect(mergeAriaIdRefs(undefined, null, '', '   ')).toBeUndefined();
    });
});
