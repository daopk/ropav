import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Button from './button.vue';

describe('Button', () => {
    const colors = [
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
        'neutral',
    ] as const;
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const variants = ['solid', 'subtle', 'surface', 'outline', 'ghost', 'plain'] as const;

    it('uses button type by default and renders slots', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Button, null, {
                        default: () => 'Save',
                        left: () => h('span', { class: 'left-icon' }, 'L'),
                        right: () => h('span', { class: 'right-icon' }, 'R'),
                    });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.type).toBe('button');
        expect(button.disabled).toBe(false);
        expect([...button.classList]).toEqual(['rp-button']);
        expect(container.querySelector('.rp-button__left .left-icon')).toBeTruthy();
        expect(container.querySelector('.rp-button__right .right-icon')).toBeTruthy();
        expect(button.textContent).toContain('Save');
    });

    it('does not render legacy prefix and suffix slots', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Button, null, {
                        default: () => 'Save',
                        prefix: () => h('span', { class: 'prefix-icon' }, 'Prefix'),
                        suffix: () => h('span', { class: 'suffix-icon' }, 'Suffix'),
                    });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(container.querySelector('.rp-button__left')).toBeNull();
        expect(container.querySelector('.rp-button__right')).toBeNull();
        expect(button.textContent).not.toContain('Prefix');
        expect(button.textContent).not.toContain('Suffix');
    });

    it('disables while loading and hides the left slot', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Button,
                        {
                            loading: true,
                            type: 'submit',
                            variant: 'ghost',
                        },
                        {
                            default: () => 'Delete',
                            left: () => h('span', 'Left'),
                            right: () => h('span', 'Right'),
                        },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.type).toBe('submit');
        expect(button.disabled).toBe(true);
        expect([...button.classList]).toEqual(['rp-button', 'rp-button--ghost']);
        expect(container.querySelector('svg.rp-button__spinner')).toBeTruthy();
        expect(container.querySelector('.rp-button__left')).toBeNull();
        expect(container.querySelector('.rp-button__right')).toBeTruthy();
    });

    it('lets disabled override the loading state', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Button,
                        {
                            disabled: true,
                            loading: true,
                        },
                        {
                            default: () => 'Save',
                            left: () => h('span', { class: 'left-icon' }, 'Left'),
                        },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.disabled).toBe(true);
        expect(container.querySelector('svg.rp-button__spinner')).toBeNull();
        expect(container.querySelector('.rp-button__left .left-icon')).toBeTruthy();
        expect(button.textContent).toContain('Save');
    });

    it('adds the solid primary style only when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Button, { variant: 'solid' }, { default: () => 'Save' });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect([...button.classList]).toEqual(['rp-button', 'rp-button--solid']);
    });

    it('adds a variant modifier for each supported variant', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        variants.map((variant) =>
                            h(Button, { variant }, { default: () => variant }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const buttons = [...container.querySelectorAll('button')];

        expect(buttons).toHaveLength(variants.length);
        for (const [index, variant] of variants.entries()) {
            expect([...buttons[index].classList]).toEqual(['rp-button', `rp-button--${variant}`]);
        }
    });

    it('adds color modifiers with variants', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Button,
                        { color: 'danger', variant: 'solid' },
                        { default: () => 'Delete' },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect([...button.classList]).toEqual([
            'rp-button',
            'rp-button--solid',
            'rp-button--color-danger',
        ]);
    });

    it('adds a color modifier for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) => h(Button, { color }, { default: () => color })),
                    );
                },
            }),
        );

        await flush();

        const buttons = [...container.querySelectorAll('button')];

        expect(buttons).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            expect([...buttons[index].classList]).toEqual([
                'rp-button',
                `rp-button--color-${color}`,
            ]);
        }
    });

    it('adds size modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Button, { size: 'xl' }, { default: () => 'Save' });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect([...button.classList]).toEqual(['rp-button', 'rp-button--size-xl']);
    });

    it('adds a radius modifier for each supported radius', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        radii.map((radius) => h(Button, { radius }, { default: () => radius })),
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
            ]);
        }
    });
});
