import { describe, expect, it, vi } from 'vitest';
import { filterOptions } from './optionFilter';

const options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Dragon Fruit', value: 2 },
];

describe('filterOptions', () => {
    it('matches labels case-insensitively and ignores surrounding search whitespace', () => {
        expect(filterOptions(options, '  FRUIT ', undefined)).toEqual([options[1]]);
        expect(filterOptions(options, 'APP', undefined)).toEqual([options[0]]);
    });

    it('passes the raw search value to a custom filter', () => {
        const filter = vi.fn((option: (typeof options)[number], searchValue: string) =>
            String(option.value).includes(searchValue.trim()),
        );

        expect(filterOptions(options, ' 2 ', filter)).toEqual([options[1]]);
        expect(filter).toHaveBeenCalledWith(options[0], ' 2 ');
    });

    it('returns a shallow copy when filtering is disabled or the search is blank', () => {
        const filter = vi.fn(() => false);
        const disabledResult = filterOptions(options, 'missing', false);
        const blankResult = filterOptions(options, '   ', filter);

        expect(disabledResult).toEqual(options);
        expect(disabledResult).not.toBe(options);
        expect(blankResult).toEqual(options);
        expect(blankResult).not.toBe(options);
        expect(filter).not.toHaveBeenCalled();
        expect(filterOptions(undefined, 'apple', undefined)).toEqual([]);
    });
});
