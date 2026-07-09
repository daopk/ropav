import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import IconCheck from '~icons/lucide/check';

import { flush, mountDom } from '../../../tests/utils/vue';
import ColorSwatch from './color-swatch.vue';

describe('ColorSwatch', () => {
    it('displays a color with a default accessible label', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorSwatch, {
                        color: '#4992d1',
                    });
                },
            }),
        );

        await flush();

        const swatch = container.querySelector('.rp-color-swatch') as HTMLElement;

        expect(swatch.getAttribute('role')).toBe('img');
        expect(swatch.getAttribute('aria-label')).toBe('Color swatch #4992d1');
        expect(swatch.style.getPropertyValue('--_rp-color-swatch-color')).toBe('#4992d1');
        expect(swatch.style.getPropertyValue('--_rp-color-swatch-fg')).toBe(
            'var(--rp-color-white)',
        );
        expect(swatch.style.getPropertyValue('--_rp-color-swatch-overlay-stroke')).toBe(
            'rgb(0 0 0 / 10%)',
        );
        expect(swatch.style.getPropertyValue('--_rp-color-swatch-size')).toBe('');
    });

    it('accepts a custom label and numeric size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorSwatch, {
                        ariaLabel: 'Brand blue',
                        color: '#228be6',
                        size: 32,
                    });
                },
            }),
        );

        await flush();

        const swatch = container.querySelector('.rp-color-swatch') as HTMLElement;

        expect(swatch.getAttribute('aria-label')).toBe('Brand blue');
        expect(swatch.style.getPropertyValue('--_rp-color-swatch-size')).toBe('32px');
    });

    it('can be hidden from assistive technologies when used decoratively', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorSwatch as any, {
                        'aria-hidden': 'true',
                        color: 'rgba(73, 146, 209, 0.5)',
                        size: '2rem',
                    });
                },
            }),
        );

        await flush();

        const swatch = container.querySelector('.rp-color-swatch') as HTMLElement;

        expect(swatch.getAttribute('aria-hidden')).toBe('true');
        expect(swatch.getAttribute('role')).toBeNull();
        expect(swatch.getAttribute('aria-label')).toBeNull();
        expect(swatch.style.getPropertyValue('--_rp-color-swatch-size')).toBe('2rem');
    });

    it('chooses black foreground for light colors', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorSwatch, {
                        color: '#ffffff',
                    });
                },
            }),
        );

        await flush();

        const swatch = container.querySelector('.rp-color-swatch') as HTMLElement;

        expect(swatch.style.getPropertyValue('--_rp-color-swatch-fg')).toBe(
            'var(--rp-color-black)',
        );
    });

    it('keeps white foreground for saturated palette colors', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorSwatch, {
                        color: '#fab005',
                    });
                },
            }),
        );

        await flush();

        const swatch = container.querySelector('.rp-color-swatch') as HTMLElement;

        expect(swatch.style.getPropertyValue('--_rp-color-swatch-fg')).toBe(
            'var(--rp-color-white)',
        );
    });

    it('chooses white foreground for dark colors', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorSwatch, {
                        color: '#000000',
                    });
                },
            }),
        );

        await flush();

        const swatch = container.querySelector('.rp-color-swatch') as HTMLElement;

        expect(swatch.style.getPropertyValue('--_rp-color-swatch-fg')).toBe(
            'var(--rp-color-white)',
        );
        expect(swatch.style.getPropertyValue('--_rp-color-swatch-overlay-stroke')).toBe(
            'rgb(255 255 255 / 18%)',
        );
        expect(swatch.style.getPropertyValue('--_rp-color-swatch-overlay-shadow')).toBe(
            'rgb(255 255 255 / 10%)',
        );
    });

    it('renders slot content inside the swatch', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ColorSwatch,
                        {
                            color: '#ffffff',
                        },
                        { default: () => h(IconCheck, { class: 'check-icon' }) },
                    );
                },
            }),
        );

        await flush();

        const icon = container.querySelector('.rp-color-swatch__icon .check-icon');

        expect(icon).toBeTruthy();
    });
});
