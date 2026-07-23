import { describe, expect, it } from 'vitest';

import { mergeAriaIdRefs } from './aria';

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
