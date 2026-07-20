import { describe, expect, it, vi } from 'vitest';
import {
    getComponentContrastColor,
    getComponentColorRoles,
    getComponentColorValue,
    getComponentVariantColorRoles,
    isComponentPresetColor,
    parseComponentColor,
} from './componentColors';

describe('component color resolver', () => {
    it('resolves palette names as preset colors', () => {
        expect(isComponentPresetColor('blue')).toBe(true);
        expect(parseComponentColor('blue')).toEqual({ kind: 'preset', color: 'blue' });
        expect(getComponentColorValue('blue')).toBe('var(--rp-color-blue-filled)');
        expect(getComponentColorRoles('blue')).toMatchObject({
            filled: 'var(--rp-color-blue-filled)',
            hover: 'var(--rp-color-blue-filled-hover)',
            contrast: 'var(--rp-color-blue-contrast)',
            light: 'var(--rp-color-blue-light)',
            outline: 'var(--rp-color-blue-outline)',
            foreground: 'var(--rp-color-blue-light-color)',
        });
    });

    it('resolves palette shade syntax to token variables', () => {
        expect(isComponentPresetColor('blue.6')).toBe(false);
        expect(parseComponentColor('blue.6')).toEqual({
            kind: 'shade',
            color: 'blue',
            shade: '6',
        });
        expect(getComponentColorValue('blue.6')).toBe('var(--rp-color-blue-6)');
        expect(getComponentColorRoles('blue.6')).toMatchObject({
            filled: 'var(--rp-color-blue-6)',
            hover: 'var(--rp-color-blue-7)',
            contrast: 'var(--rp-color-blue-6-contrast)',
            foreground: 'var(--rp-color-blue-6)',
        });
    });

    it('resolves primary color tokens', () => {
        expect(parseComponentColor('primary')).toEqual({ kind: 'primary' });
        expect(getComponentColorValue('primary')).toBe('var(--rp-primary-color-filled)');
        expect(getComponentColorRoles('primary')).toMatchObject({
            filled: 'var(--rp-primary-color-filled)',
            hover: 'var(--rp-primary-color-filled-hover)',
            contrast: 'var(--rp-primary-color-contrast)',
            light: 'var(--rp-primary-color-light)',
            outline: 'var(--rp-primary-color-outline)',
            foreground: 'var(--rp-primary-color-light-color)',
        });
    });

    it('does not resolve invalid palette shade strings', () => {
        expect(isComponentPresetColor('blue.10')).toBe(false);
        expect(parseComponentColor('blue.10')).toEqual({ kind: 'invalid', value: 'blue.10' });
        expect(getComponentColorValue('blue.10')).toBeUndefined();
        expect(getComponentColorRoles('blue.10')).toBeUndefined();
        expect(
            getComponentVariantColorRoles({
                color: 'blue.10',
                variant: 'solid',
                defaultColor: undefined,
            }),
        ).toBeUndefined();
    });

    it('resolves arbitrary CSS colors as raw values and derived roles', () => {
        expect(isComponentPresetColor('#ff3366')).toBe(false);
        expect(parseComponentColor('#ff3366')).toEqual({ kind: 'custom', value: '#ff3366' });
        expect(getComponentColorValue('#ff3366')).toBe('#ff3366');
        expect(getComponentColorRoles('#ff3366')).toMatchObject({
            filled: '#ff3366',
            hover: 'color-mix(in srgb, #ff3366 90%, var(--rp-color-black))',
            active: 'color-mix(in srgb, #ff3366 80%, var(--rp-color-black))',
            light: 'color-mix(in srgb, #ff3366 12%, transparent)',
            outline: '#ff3366',
            contrast: 'var(--rp-color-black)',
            foreground: '#ff3366',
        });
    });

    it('resolves readable contrast by default and allows opting out', () => {
        expect(getComponentContrastColor('blue')).toBe('var(--rp-color-blue-contrast)');
        expect(getComponentContrastColor('yellow.6')).toBe('var(--rp-color-yellow-6-contrast)');
        expect(getComponentContrastColor('#fab005')).toBe('var(--rp-color-black)');
        expect(getComponentContrastColor('#82c91e', { autoContrast: true })).toBe(
            'var(--rp-color-black)',
        );
        expect(getComponentContrastColor('#141414', { autoContrast: true })).toBe(
            'var(--rp-color-white)',
        );
        expect(getComponentContrastColor('rgba(255, 255, 255, 1)')).toBe('var(--rp-color-black)');
        expect(getComponentContrastColor('#fab005', { autoContrast: false })).toBe(
            'var(--rp-color-white)',
        );
    });

    it('requires explicit contrast for translucent custom colors', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const translucentColors = [
            'rgba(255, 255, 255, .2)',
            'hsla(0, 0%, 100%, 20%)',
            '#fff3',
            '#ffffff33',
            'transparent',
        ];

        for (const color of translucentColors) {
            expect(getComponentContrastColor(color)).toBe('var(--rp-color-white)');
            expect(getComponentContrastColor(color)).toBe('var(--rp-color-white)');
            expect(getComponentColorRoles(color)).toMatchObject({
                contrast: 'var(--rp-color-white)',
            });
        }

        expect(warn).toHaveBeenCalledTimes(translucentColors.length);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Pass contrastColor explicitly'));
        warn.mockRestore();
    });

    it('does not warn when translucent custom contrast is explicit or disabled', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        expect(
            getComponentContrastColor('rgb(255 255 255 / 20%)', {
                contrastColor: 'var(--brand-on-color)',
            }),
        ).toBe('var(--brand-on-color)');
        expect(getComponentContrastColor('rgb(254 254 254 / 20%)', { autoContrast: false })).toBe(
            'var(--rp-color-white)',
        );
        expect(getComponentContrastColor('var(--brand-color)')).toBe('var(--rp-color-white)');

        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('does not resolve translucent contrast for non-solid variants', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        for (const variant of ['subtle', 'surface', 'outline', 'ghost', 'plain'] as const) {
            expect(
                getComponentVariantColorRoles({
                    color: 'rgba(255, 255, 255, 0.19)',
                    variant,
                }),
            ).toBeDefined();
        }

        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('accepts explicit contrast for custom CSS variables', () => {
        expect(getComponentColorValue('var(--brand-color)')).toBe('var(--brand-color)');
        expect(getComponentContrastColor('var(--brand-color)')).toBe('var(--rp-color-white)');
        expect(
            getComponentContrastColor('var(--brand-color)', {
                contrastColor: 'var(--brand-contrast)',
            }),
        ).toBe('var(--brand-contrast)');
        expect(
            getComponentContrastColor('var(--brand-color)', {
                autoContrast: false,
                contrastColor: '#141414',
            }),
        ).toBe('#141414');
        expect(getComponentContrastColor('var(--brand-color)', { autoContrast: false })).toBe(
            'var(--rp-color-white)',
        );
    });

    it('returns final solid variant roles with autoContrast semantics', () => {
        expect(
            getComponentVariantColorRoles({
                color: 'blue',
                variant: 'solid',
                autoContrast: false,
            }),
        ).toMatchObject({
            background: 'var(--rp-color-blue-filled)',
            hover: 'var(--rp-color-blue-filled-hover)',
            color: 'var(--rp-color-white)',
            border: 'var(--rp-color-blue-filled)',
        });
        expect(
            getComponentVariantColorRoles({
                color: '#fab005',
                variant: 'solid',
            }),
        ).toMatchObject({
            background: '#fab005',
            color: 'var(--rp-color-black)',
            border: '#fab005',
        });
        expect(
            getComponentVariantColorRoles({
                color: 'var(--brand-color)',
                variant: 'solid',
                contrastColor: 'var(--brand-contrast)',
            }),
        ).toMatchObject({
            background: 'var(--brand-color)',
            color: 'var(--brand-contrast)',
        });
    });

    it('returns final subtle, surface, outline, ghost, and plain roles', () => {
        expect(getComponentVariantColorRoles({ color: 'blue.6', variant: 'subtle' })).toMatchObject(
            {
                background: 'color-mix(in srgb, var(--rp-color-blue-6) 12%, transparent)',
                color: 'var(--rp-color-blue-6)',
                border: 'transparent',
            },
        );
        expect(
            getComponentVariantColorRoles({ color: 'blue.6', variant: 'surface' }),
        ).toMatchObject({
            background: 'color-mix(in srgb, var(--rp-color-blue-6) 12%, transparent)',
            border: 'var(--rp-color-blue-6)',
        });
        expect(
            getComponentVariantColorRoles({ color: 'blue.6', variant: 'outline' }),
        ).toMatchObject({
            background: 'transparent',
            border: 'var(--rp-color-blue-6)',
        });
        expect(getComponentVariantColorRoles({ color: 'blue.6', variant: 'ghost' })).toMatchObject({
            background: 'transparent',
            border: 'transparent',
        });
        expect(getComponentVariantColorRoles({ color: 'blue.6', variant: 'plain' })).toMatchObject({
            background: 'transparent',
            hover: 'transparent',
            color: 'var(--rp-color-blue-6)',
        });
    });
});
