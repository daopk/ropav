import { describe, expect, it } from 'vitest';
import {
    hasAttributeToken,
    parseAttributeTokens,
    restoreAttributes,
    snapshotAttributes,
} from './attributes';

describe('DOM attribute utilities', () => {
    it('parses whitespace-separated tokens and matches complete tokens', () => {
        expect(parseAttributeTokens(' dialog   menu\tlistbox ')).toEqual([
            'dialog',
            'menu',
            'listbox',
        ]);
        expect(parseAttributeTokens(null)).toEqual([]);
        expect(hasAttributeToken('dialog menu', 'menu')).toBe(true);
        expect(hasAttributeToken('dialog menu', 'men')).toBe(false);
    });

    it('restores present and absent attributes from a snapshot', () => {
        const element = document.createElement('button');
        element.setAttribute('aria-controls', 'original');
        const snapshot = snapshotAttributes(element, ['aria-controls', 'aria-expanded']);

        element.setAttribute('aria-controls', 'temporary');
        element.setAttribute('aria-expanded', 'true');
        restoreAttributes(element, snapshot);

        expect(element.getAttribute('aria-controls')).toBe('original');
        expect(element.hasAttribute('aria-expanded')).toBe(false);
    });
});
