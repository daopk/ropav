import { describe, expect, it } from 'vitest';
import { getNameInitials, normalizeTypeaheadText } from './text';

describe('text utilities', () => {
    it.each([
        [undefined, ''],
        ['', ''],
        ['   ', ''],
        ['Ada', 'AD'],
        ['Ada Lovelace', 'AL'],
        ['  Grace   Brewster   Hopper  ', 'GH'],
        ['Zoë', 'ZO'],
        ['😀 rocket', '😀R'],
    ])('derives stable initials from %j', (name, expected) => {
        expect(getNameInitials(name)).toBe(expected);
    });

    it('normalizes text for locale-insensitive matching', () => {
        expect(normalizeTypeaheadText('  Crème   BRÛLÉE ')).toBe('creme brulee');
    });
});
