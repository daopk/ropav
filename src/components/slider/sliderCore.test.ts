import { describe, expect, it } from 'vitest';
import type { CSSProperties } from 'vue';

import {
    applySliderThumbStyle,
    createSliderMarkItems,
    getSliderThumbMode,
    getSliderThumbOptions,
    getSliderValuePercent,
    getSliderTooltipMode,
} from './sliderCore';

describe('slider core', () => {
    it('maps arbitrary finite track values to a clamped percentage', () => {
        expect(getSliderValuePercent(44.4, 0, 200)).toBe(22.2);
        expect(getSliderValuePercent(-10, 0, 100)).toBe(0);
        expect(getSliderValuePercent(140, 0, 100)).toBe(100);
        expect(getSliderValuePercent(Number.NaN, 0, 100)).toBe(0);
    });

    it('normalizes pointer-anchored tooltips to hover mode at runtime', () => {
        expect(getSliderTooltipMode({ anchor: 'pointer' })).toBe('hover');
        expect(
            getSliderTooltipMode({ anchor: 'pointer', mode: 'always' } as {
                anchor: 'pointer';
                mode: 'always';
            }),
        ).toBe('hover');
    });

    it('normalizes shorthand and object thumb configuration', () => {
        expect(getSliderThumbMode('always')).toBe('always');
        expect(getSliderThumbMode('interaction')).toBe('interaction');
        expect(getSliderThumbMode(false)).toBe(false);
        expect(getSliderThumbMode({ size: 24 })).toBe('always');
        expect(getSliderThumbMode({ visibility: 'interaction' })).toBe('interaction');
        expect(getSliderThumbOptions('interaction')).toEqual({});
        expect(getSliderThumbOptions({ size: 24, visibility: 'interaction' })).toEqual({
            size: 24,
            visibility: 'interaction',
        });
    });

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
