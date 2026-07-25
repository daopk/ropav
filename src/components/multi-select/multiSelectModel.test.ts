import { describe, expect, it } from 'vitest';
import {
    getMultiSelectActiveDescendantId,
    getMultiSelectSelectedOptions,
    toggleMultiSelectValue,
} from './multiSelectModel';
import type { MultiSelectOption } from './types';

const options: MultiSelectOption[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Dragon Fruit', value: 2 },
    { label: 'Pear', value: 'pear', disabled: true },
];

describe('multiSelectModel', () => {
    it('resolves selected options in value order and ignores missing values', () => {
        expect(getMultiSelectSelectedOptions(options, [2, 'missing', 'apple'])).toEqual([
            options[1],
            options[0],
        ]);
    });

    it('toggles values without mutating the source and respects maxValues', () => {
        const values = ['apple'];

        expect(toggleMultiSelectValue(values, 2, 2)).toEqual(['apple', 2]);
        expect(toggleMultiSelectValue(values, 2, 1)).toEqual(['apple']);
        expect(toggleMultiSelectValue(values, 'apple', 1)).toEqual([]);
        expect(values).toEqual(['apple']);
    });

    it('only exposes an active descendant while the popup is open', () => {
        expect(getMultiSelectActiveDescendantId('fruit', 1, true)).toBe('fruit-option-1');
        expect(getMultiSelectActiveDescendantId('fruit', -1, true)).toBeUndefined();
        expect(getMultiSelectActiveDescendantId('fruit', 1, false)).toBeUndefined();
    });
});
