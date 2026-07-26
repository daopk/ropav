import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import IconSearch from '~icons/lucide/search';

import { flush, mountDom } from '../../../tests/utils/vue';
import IconButton from './icon-button.vue';

describe('IconButton', () => {
    const colors = ['blue', 'violet', 'green', 'orange', 'red', 'cyan', 'gray'] as const;
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const variants = ['solid', 'subtle', 'surface', 'outline', 'ghost', 'plain'] as const;

    it('uses button type by default and renders an accessible icon-only control', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        IconButton,
                        {
                            ariaLabel: 'Search',
                        },
                        {
                            default: () => h(IconSearch, { class: 'search-icon' }),
                        },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.type).toBe('button');
        expect(button.disabled).toBe(false);
        expect(button.getAttribute('aria-label')).toBe('Search');
        expect(button.getAttribute('aria-busy')).toBeNull();
        expect([...button.classList]).toEqual(['rp-button', 'rp-icon-button']);
        expect(container.querySelector('.rp-icon-button__icon .search-icon')).toBeTruthy();
        expect(container.querySelector('.rp-icon-button__icon')?.getAttribute('aria-hidden')).toBe(
            'true',
        );
    });

    it('disables while loading and hides the icon slot', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        IconButton,
                        {
                            ariaLabel: 'Refresh',
                            loading: true,
                            type: 'submit',
                            variant: 'ghost',
                        },
                        {
                            default: () => h(IconSearch, { class: 'search-icon' }),
                        },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.type).toBe('submit');
        expect(button.disabled).toBe(true);
        expect(button.getAttribute('aria-busy')).toBe('true');
        expect([...button.classList]).toEqual(['rp-button', 'rp-button--ghost', 'rp-icon-button']);
        expect(container.querySelector('svg.rp-icon-button__spinner')).toBeTruthy();
        expect(container.querySelector('.rp-icon-button__icon')).toBeNull();
    });

    it('keeps the loading state visible when disabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        IconButton,
                        {
                            ariaLabel: 'Search',
                            disabled: true,
                            loading: true,
                        },
                        {
                            default: () => h(IconSearch, { class: 'search-icon' }),
                        },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.disabled).toBe(true);
        expect(button.getAttribute('aria-busy')).toBe('true');
        expect(container.querySelector('svg.rp-icon-button__spinner')).toBeTruthy();
        expect(container.querySelector('.rp-icon-button__icon')).toBeNull();
    });

    it('adds color, size, radius, and variant modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(IconButton, {
                        ariaLabel: 'Delete',
                        color: 'red',
                        radius: 'lg',
                        size: 'sm',
                        variant: 'solid',
                    });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect([...button.classList]).toEqual([
            'rp-button',
            'rp-button--solid',
            'rp-button--size-sm',
            'rp-button--radius-lg',
            'rp-icon-button',
        ]);
        expect(button.style.getPropertyValue('--_rp-button-bg')).toBe('var(--rp-color-red-filled)');
        expect(button.style.getPropertyValue('--_rp-button-fg')).toBe(
            'var(--rp-color-red-contrast)',
        );
    });

    it('adds a variant modifier for each supported variant', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        variants.map((variant) =>
                            h(IconButton, { ariaLabel: variant, variant }, () => h(IconSearch)),
                        ),
                    );
                },
            }),
        );

        await flush();

        const buttons = [...container.querySelectorAll('button')];

        expect(buttons).toHaveLength(variants.length);
        for (const [index, variant] of variants.entries()) {
            expect([...buttons[index].classList]).toEqual([
                'rp-button',
                `rp-button--${variant}`,
                'rp-icon-button',
            ]);
        }
    });

    it('resolves final color variables for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) =>
                            h(IconButton, { ariaLabel: color, color }, () => h(IconSearch)),
                        ),
                    );
                },
            }),
        );

        await flush();

        const buttons = [...container.querySelectorAll('button')];

        expect(buttons).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            const button = buttons[index] as HTMLElement;

            expect([...button.classList]).toEqual(['rp-button', 'rp-icon-button']);
            expect(button.style.getPropertyValue('--_rp-button-bg')).toBe(
                'var(--rp-color-default)',
            );
            expect(button.style.getPropertyValue('--_rp-button-bg-hover')).toBe(
                `var(--rp-color-${color}-light-hover)`,
            );
            expect(button.style.getPropertyValue('--_rp-button-fg')).toBe(
                `var(--rp-color-${color}-light-color)`,
            );
            expect(button.style.getPropertyValue('--_rp-button-border')).toBe(
                `var(--rp-color-${color}-outline)`,
            );
        }
    });

    it('sets final color variables for arbitrary color values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(IconButton, {
                        ariaLabel: 'Custom',
                        color: '#ff3366',
                        variant: 'ghost',
                    });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect([...button.classList]).toEqual(['rp-button', 'rp-button--ghost', 'rp-icon-button']);
        expect(button.style.getPropertyValue('--_rp-button-bg')).toBe('transparent');
        expect(button.style.getPropertyValue('--_rp-button-bg-hover')).toBe(
            'color-mix(in srgb, #ff3366 18%, transparent)',
        );
        expect(button.style.getPropertyValue('--_rp-button-border')).toBe('transparent');
        expect(button.style.getPropertyValue('--_rp-button-fg')).toBe(
            'color-mix(in srgb, #ff3366 70%, var(--rp-color-bright))',
        );
    });

    it('uses readable arbitrary color contrast when autoContrast is enabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(IconButton, {
                        ariaLabel: 'Contrast',
                        autoContrast: true,
                        color: '#fab005',
                        variant: 'solid',
                    });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.style.getPropertyValue('--_rp-button-fg')).toBe('var(--rp-color-black)');
    });

    it('uses readable foregrounds for every solid interaction state', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(IconButton, {
                        ariaLabel: 'State contrast',
                        color: '#ff3366',
                        variant: 'solid',
                    });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.style.getPropertyValue('--_rp-button-bg')).toBe('#ff3366');
        expect(button.style.getPropertyValue('--_rp-button-bg-hover')).toBe(
            'color-mix(in srgb, #ff3366 90%, var(--rp-color-black))',
        );
        expect(button.style.getPropertyValue('--_rp-button-bg-active')).toBe(
            'color-mix(in srgb, #ff3366 80%, var(--rp-color-black))',
        );
        expect(button.style.getPropertyValue('--_rp-button-fg')).toBe('var(--rp-color-black)');
        expect(button.style.getPropertyValue('--_rp-button-fg-hover')).toBe(
            'var(--rp-color-black)',
        );
        expect(button.style.getPropertyValue('--_rp-button-fg-active')).toBe(
            'var(--rp-color-white)',
        );
    });

    it('adds a radius modifier for each supported radius', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        radii.map((radius) =>
                            h(IconButton, { ariaLabel: radius, radius }, () => h(IconSearch)),
                        ),
                    );
                },
            }),
        );

        await flush();

        const buttons = [...container.querySelectorAll('button')];

        expect(buttons).toHaveLength(radii.length);
        for (const [index, radius] of radii.entries()) {
            expect([...buttons[index].classList]).toEqual([
                'rp-button',
                `rp-button--radius-${radius}`,
                'rp-icon-button',
            ]);
        }
    });
});
