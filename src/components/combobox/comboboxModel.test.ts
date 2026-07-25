import { describe, expect, it } from 'vitest';
import {
    getComboboxActiveDescendantId,
    getComboboxDisplayLabel,
    hasComboboxValue,
} from './comboboxModel';
import type { ComboboxOption } from './types';

const options: ComboboxOption[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Dragon Fruit', value: 2 },
    { label: 'All', value: '' },
];

describe('combobox model', () => {
    it('uses null as the sole empty value sentinel', () => {
        expect(hasComboboxValue(null)).toBe(false);
        expect(hasComboboxValue('')).toBe(true);
        expect(hasComboboxValue(0)).toBe(true);
        expect(getComboboxDisplayLabel(options, null)).toBe('');
        expect(getComboboxDisplayLabel(options, '')).toBe('All');
    });

    it('resolves typed display values and active descendant ids', () => {
        expect(getComboboxDisplayLabel(options, 2)).toBe('Dragon Fruit');
        expect(getComboboxDisplayLabel(options, '2')).toBe('');
        expect(getComboboxActiveDescendantId('fruit', 1, true)).toBe('fruit-option-1');
        expect(getComboboxActiveDescendantId('fruit', 1, false)).toBeUndefined();
    });
});
