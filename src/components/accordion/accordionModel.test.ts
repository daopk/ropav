import { describe, expect, it } from 'vitest';
import { readAccordionOpenValues, transitionAccordionValue } from './accordionModel';

describe('accordion model', () => {
    it('normalizes model values for single and multiple modes', () => {
        expect(readAccordionOpenValues(undefined, false)).toEqual([]);
        expect(readAccordionOpenValues(null, true)).toEqual([]);
        expect(readAccordionOpenValues('profile', true)).toEqual(['profile']);
        expect(readAccordionOpenValues(['profile', 'billing'], false)).toEqual(['profile']);
        expect(readAccordionOpenValues(['profile', 'billing'], true)).toEqual([
            'profile',
            'billing',
        ]);
    });

    it('transitions single item values to a scalar or null', () => {
        expect(
            transitionAccordionValue(null, 'profile', true, {
                multiple: false,
                collapsible: true,
            }),
        ).toEqual({ changed: true, modelValue: 'profile' });
        expect(
            transitionAccordionValue('profile', 'profile', false, {
                multiple: false,
                collapsible: true,
            }),
        ).toEqual({ changed: true, modelValue: null });
        expect(
            transitionAccordionValue(['profile', 'billing'], 'billing', true, {
                multiple: false,
                collapsible: true,
            }),
        ).toEqual({ changed: true, modelValue: 'billing' });
    });

    it('adds and removes values in multiple mode without mutating the input', () => {
        const currentValue = ['profile'];
        const opened = transitionAccordionValue(currentValue, 'billing', true, {
            multiple: true,
            collapsible: true,
        });
        const closed = transitionAccordionValue(['profile', 'billing'], 'profile', false, {
            multiple: true,
            collapsible: true,
        });

        expect(opened).toEqual({
            changed: true,
            modelValue: ['profile', 'billing'],
        });
        expect(closed).toEqual({ changed: true, modelValue: ['billing'] });
        expect(currentValue).toEqual(['profile']);
        expect(opened.changed && opened.modelValue).not.toBe(currentValue);
    });

    it('rejects no-op and non-collapsible transitions', () => {
        expect(
            transitionAccordionValue('profile', 'profile', true, {
                multiple: false,
                collapsible: true,
            }),
        ).toEqual({ changed: false });
        expect(
            transitionAccordionValue(null, 'profile', false, {
                multiple: false,
                collapsible: true,
            }),
        ).toEqual({ changed: false });
        expect(
            transitionAccordionValue(['profile'], 'profile', false, {
                multiple: true,
                collapsible: false,
            }),
        ).toEqual({ changed: false });
    });

    it('preserves strict item identity and numeric zero values', () => {
        expect(
            transitionAccordionValue(null, 0, true, {
                multiple: false,
                collapsible: true,
            }),
        ).toEqual({ changed: true, modelValue: 0 });
        expect(
            transitionAccordionValue([1], '1', true, {
                multiple: true,
                collapsible: true,
            }),
        ).toEqual({ changed: true, modelValue: [1, '1'] });
    });
});
