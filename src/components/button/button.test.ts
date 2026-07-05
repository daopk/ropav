import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Button from './button.vue';

describe('Button', () => {
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const variants = ['solid', 'subtle', 'surface', 'outline', 'ghost', 'plain'] as const;

    it('uses button type by default and renders slots', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Button, null, {
                        default: () => 'Save',
                        prefix: () => h('span', { class: 'prefix-icon' }, 'P'),
                        suffix: () => h('span', { class: 'suffix-icon' }, 'S'),
                    });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.type).toBe('button');
        expect(button.disabled).toBe(false);
        expect([...button.classList]).toEqual(['rp-button']);
        expect(container.querySelector('.rp-button__prefix')).toBeTruthy();
        expect(container.querySelector('.rp-button__suffix')).toBeTruthy();
        expect(button.textContent).toContain('Save');
    });

    it('renders left and right slots before legacy prefix and suffix slots', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Button, null, {
                        default: () => 'Save',
                        left: () => h('span', { class: 'left-icon' }, 'Left'),
                        right: () => h('span', { class: 'right-icon' }, 'Right'),
                        prefix: () => h('span', { class: 'prefix-icon' }, 'Prefix'),
                        suffix: () => h('span', { class: 'suffix-icon' }, 'Suffix'),
                    });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(container.querySelector('.rp-button__prefix .left-icon')).toBeTruthy();
        expect(container.querySelector('.rp-button__suffix .right-icon')).toBeTruthy();
        expect(button.textContent).toContain('Left');
        expect(button.textContent).toContain('Right');
        expect(button.textContent).not.toContain('Prefix');
        expect(button.textContent).not.toContain('Suffix');
    });

    it('disables while loading and hides the prefix slot', async () => {
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
                            prefix: () => h('span', 'Prefix'),
                            suffix: () => h('span', 'Suffix'),
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
        expect(container.querySelector('.rp-button__prefix')).toBeNull();
        expect(container.querySelector('.rp-button__suffix')).toBeTruthy();
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
                            prefix: () => h('span', { class: 'prefix-icon' }, 'Prefix'),
                        },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.disabled).toBe(true);
        expect(container.querySelector('svg.rp-button__spinner')).toBeNull();
        expect(container.querySelector('.rp-button__prefix .prefix-icon')).toBeTruthy();
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
