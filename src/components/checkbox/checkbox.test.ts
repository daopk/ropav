import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Checkbox from './checkbox.vue';

describe('Checkbox', () => {
    const colors = ['blue', 'violet', 'green', 'orange', 'red', 'cyan', 'gray'] as const;
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const variants = ['solid', 'outline'] as const;

    it('emits model updates from native checkbox changes', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Checkbox,
                        {
                            modelValue: false,
                            'onUpdate:modelValue': onUpdate,
                        },
                        { default: () => 'Accept terms' },
                    );
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        native.click();
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(true);
    });

    it('does not emit updates when disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Checkbox,
                        {
                            disabled: true,
                            modelValue: false,
                            'onUpdate:modelValue': onUpdate,
                        },
                        { default: () => 'Disabled' },
                    );
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        native.click();
        await flush();

        expect(native.disabled).toBe(true);
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('renders indeterminate state with mixed aria state', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Checkbox,
                        {
                            indeterminate: true,
                            modelValue: false,
                        },
                        { default: () => 'Select all' },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-checkbox')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(root.classList.contains('rp-checkbox--indeterminate')).toBe(true);
        expect(root.getAttribute('data-state')).toBe('indeterminate');
        expect(native.indeterminate).toBe(true);
        expect(native.getAttribute('aria-checked')).toBe('mixed');
    });

    it('applies direct state and ARIA props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Checkbox,
                        {
                            id: 'terms-control',
                            invalid: true,
                            labelledby: 'terms-label',
                            describedby: 'terms-description terms-message',
                            modelValue: false,
                            required: true,
                        },
                        { default: () => 'I agree' },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-checkbox')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.id).toBe('terms-control');
        expect(native.required).toBe(true);
        expect(native.getAttribute('aria-required')).toBe('true');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.getAttribute('aria-labelledby')).toBe('terms-label');
        expect(native.getAttribute('aria-describedby')).toBe('terms-description terms-message');
        expect(root.classList.contains('rp-checkbox--invalid')).toBe(true);
    });

    it('adds variant, color, size, and radius modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Checkbox,
                        {
                            color: 'green',
                            size: 'lg',
                            radius: 'xl',
                            variant: 'outline',
                            modelValue: true,
                        },
                        { default: () => 'Styled' },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-checkbox')!;

        expect([...root.classList]).toEqual([
            'rp-checkbox',
            'rp-checkbox--checked',
            'rp-checkbox--outline',
            'rp-checkbox--size-lg',
            'rp-checkbox--radius-xl',
        ]);
        expect((root as HTMLElement).style.getPropertyValue('--_rp-checkbox-color')).toBe(
            'var(--rp-color-green-filled)',
        );
    });

    it('resolves selected color variables for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) =>
                            h(Checkbox, { color, modelValue: false }, { default: () => color }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const checkboxes = [...container.querySelectorAll('.rp-checkbox')];

        expect(checkboxes).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            const checkbox = checkboxes[index] as HTMLElement;

            expect([...checkbox.classList]).toEqual(['rp-checkbox']);
            expect(checkbox.style.getPropertyValue('--_rp-checkbox-color')).toBe(
                `var(--rp-color-${color}-filled)`,
            );
        }
    });

    it('sets selected color variables for arbitrary color values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Checkbox,
                        {
                            color: '#ff3366',
                            modelValue: true,
                        },
                        { default: () => 'Custom' },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-checkbox') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-checkbox', 'rp-checkbox--checked']);
        expect(root.style.getPropertyValue('--_rp-checkbox-color')).toBe('#ff3366');
        expect(root.style.getPropertyValue('--_rp-checkbox-on-color')).toBe('');
    });

    it('sets readable selected foreground when autoContrast is enabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(
                            Checkbox,
                            {
                                autoContrast: true,
                                color: '#fab005',
                                modelValue: true,
                            },
                            { default: () => 'Light' },
                        ),
                        h(
                            Checkbox,
                            {
                                autoContrast: true,
                                color: '#141414',
                                modelValue: true,
                            },
                            { default: () => 'Dark' },
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const [lightRoot, darkRoot] = [
            ...container.querySelectorAll('.rp-checkbox'),
        ] as HTMLElement[];

        expect(lightRoot.style.getPropertyValue('--_rp-checkbox-on-color')).toBe(
            'var(--rp-color-black)',
        );
        expect(darkRoot.style.getPropertyValue('--_rp-checkbox-on-color')).toBe(
            'var(--rp-color-white)',
        );
    });

    it('adds a modifier for each supported variant', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        variants.map((variant) =>
                            h(Checkbox, { modelValue: false, variant }, { default: () => variant }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const checkboxes = [...container.querySelectorAll('.rp-checkbox')];

        expect(checkboxes).toHaveLength(variants.length);
        for (const [index, variant] of variants.entries()) {
            expect([...checkboxes[index].classList]).toEqual([
                'rp-checkbox',
                `rp-checkbox--${variant}`,
            ]);
        }
    });

    it('adds a radius modifier for each supported radius', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        radii.map((radius) =>
                            h(Checkbox, { radius, modelValue: false }, { default: () => radius }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const checkboxes = [...container.querySelectorAll('.rp-checkbox')];

        expect(checkboxes).toHaveLength(radii.length);
        for (const [index, radius] of radii.entries()) {
            expect([...checkboxes[index].classList]).toEqual([
                'rp-checkbox',
                `rp-checkbox--radius-${radius}`,
            ]);
        }
    });
});
