import { describe, expect, it, vi } from 'vitest';
import {
    getComponentCheckedColorStyle,
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
            active: 'var(--rp-color-blue-8)',
            contrast: 'var(--rp-color-blue-12)',
            contrastHover: 'var(--rp-color-blue-12)',
            contrastActive: 'var(--rp-color-blue-12)',
            foreground: 'var(--rp-color-blue-6)',
        });
    });

    it('resolves primary color tokens', () => {
        expect(parseComponentColor('primary')).toEqual({ kind: 'preset', color: 'primary' });
        expect(getComponentColorValue('primary')).toBe('var(--rp-color-primary-filled)');
        expect(getComponentColorRoles('primary')).toMatchObject({
            filled: 'var(--rp-color-primary-filled)',
            hover: 'var(--rp-color-primary-filled-hover)',
            contrast: 'var(--rp-color-primary-contrast)',
            light: 'var(--rp-color-primary-light)',
            outline: 'var(--rp-color-primary-outline)',
            foreground: 'var(--rp-color-primary-light-color)',
        });
    });

    it('does not resolve invalid palette shade strings', () => {
        expect(isComponentPresetColor('blue.13')).toBe(false);
        expect(parseComponentColor('blue.13')).toEqual({ kind: 'invalid', value: 'blue.13' });
        expect(parseComponentColor('blue.0')).toEqual({ kind: 'invalid', value: 'blue.0' });
        expect(getComponentColorValue('blue.13')).toBeUndefined();
        expect(getComponentColorRoles('blue.13')).toBeUndefined();
        expect(
            getComponentVariantColorRoles({
                color: 'blue.13',
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
            contrastHover: 'var(--rp-color-black)',
            contrastActive: 'var(--rp-color-white)',
            foreground: 'color-mix(in srgb, #ff3366 68%, var(--rp-color-bright))',
        });
    });

    it('resolves readable contrast by default and allows opting out', () => {
        expect(getComponentContrastColor('blue')).toBe('var(--rp-color-blue-contrast)');
        expect(getComponentContrastColor('yellow.6')).toBe('var(--rp-color-yellow-12)');
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
            colorHover: 'var(--rp-color-white)',
            colorActive: 'var(--rp-color-white)',
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
            colorHover: 'var(--brand-contrast)',
            colorActive: 'var(--brand-contrast)',
        });
    });

    it('resolves solid foregrounds against each interactive background state', () => {
        expect(
            getComponentVariantColorRoles({
                color: 'red.8',
                variant: 'solid',
            }),
        ).toMatchObject({
            background: 'var(--rp-color-red-8)',
            hover: 'var(--rp-color-red-9)',
            active: 'var(--rp-color-red-10)',
            color: 'var(--rp-color-red-12)',
            colorHover: 'var(--rp-color-red-contrast)',
            colorActive: 'var(--rp-color-red-contrast)',
        });

        expect(
            getComponentVariantColorRoles({
                color: '#ff3366',
                variant: 'solid',
            }),
        ).toMatchObject({
            color: 'var(--rp-color-black)',
            colorHover: 'var(--rp-color-black)',
            colorActive: 'var(--rp-color-white)',
        });
    });

    it('builds checked-control variables with shared contrast semantics', () => {
        expect(
            getComponentCheckedColorStyle({
                color: 'blue',
                colorProperty: '--control-color',
                checkedColorProperty: '--control-checked-color',
            }),
        ).toEqual({
            '--control-color': 'var(--rp-color-blue-filled)',
            '--control-checked-color': 'var(--rp-color-blue-contrast)',
        });
        expect(
            getComponentCheckedColorStyle({
                color: undefined,
                colorProperty: '--control-color',
                checkedColorProperty: '--control-checked-color',
                autoContrast: false,
            }),
        ).toBeUndefined();
        expect(
            getComponentCheckedColorStyle({
                color: 'blue.13',
                colorProperty: '--control-color',
                checkedColorProperty: '--control-checked-color',
            }),
        ).toBeUndefined();
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
