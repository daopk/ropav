import { describe, expect, it } from 'vitest';
import type { CSSProperties } from 'vue';

import { applySliderThumbStyle, createSliderMarkItems } from './sliderCore';

describe('slider core', () => {
    it('builds shared mark items with component-specific fill and style properties', () => {
        const items = createSliderMarkItems(
            [0, { value: 40, label: 'Middle' }, { value: 60, hidden: true }, Number.NaN],
            0,
            100,
            (value) => value >= 20 && value <= 50,
            {
                position: '--_rp-test-mark-position',
                colors: ['--_rp-test-mark-color'],
            },
        );

        expect(items).toHaveLength(2);
        expect(items.map(({ value, filled, hasLabel }) => ({ value, filled, hasLabel }))).toEqual([
            { value: 0, filled: false, hasLabel: false },
            { value: 40, filled: true, hasLabel: true },
        ]);
        expect(items[1].style['--_rp-test-mark-position']).toBe('40%');
    });

    it('serializes shared thumb styles against the caller CSS variable namespace', () => {
        const style: CSSProperties = {};

        applySliderThumbStyle(
            style,
            { size: 24, border: 2, padding: '0.25rem' },
            {
                size: '--_rp-test-thumb-size',
                border: '--_rp-test-thumb-border-style',
                padding: '--_rp-test-thumb-padding',
                borderColor: '--_rp-test-thumb-border',
            },
        );

        expect(style).toEqual({
            '--_rp-test-thumb-size': '24px',
            '--_rp-test-thumb-border-style': '2px solid var(--_rp-test-thumb-border)',
            '--_rp-test-thumb-padding': '0.25rem',
        });
    });

    it('preserves a thumb border shorthand as the complete border style', () => {
        const style: CSSProperties = {};

        applySliderThumbStyle(
            style,
            { border: '2px dashed red' },
            {
                size: '--_rp-test-thumb-size',
                border: '--_rp-test-thumb-border-style',
                padding: '--_rp-test-thumb-padding',
                borderColor: '--_rp-test-thumb-border',
            },
        );

        expect(style['--_rp-test-thumb-border-style']).toBe('2px dashed red');
    });
});
