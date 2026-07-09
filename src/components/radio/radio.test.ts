import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Radio from './radio.vue';
import RadioGroup from './radio-group.vue';

describe('Radio', () => {
    const colors = ['blue', 'violet', 'green', 'orange', 'red', 'cyan', 'gray'] as const;

    it('requires a RadioGroup provider', () => {
        expect(() => {
            mountDom(
                defineComponent({
                    render() {
                        return h(Radio, { value: 'standalone' }, { default: () => 'Standalone' });
                    },
                }),
            );
        }).toThrow('[Ropav] <RpRadio> must be used inside its parent provider component.');
    });

    it('renders inside RadioGroup', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        RadioGroup,
                        { modelValue: 'apple' },
                        {
                            default: () => [
                                h(Radio, { value: 'apple' }, { default: () => 'Apple' }),
                                h(Radio, { value: 'banana' }, { default: () => 'Banana' }),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        expect(container.querySelector('input[value="apple"]')).toHaveProperty('checked', true);
        expect(container.querySelector('input[value="banana"]')).toHaveProperty('checked', false);
    });

    it('emits selected values and shares the configured group name', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        RadioGroup,
                        {
                            modelValue: 'apple',
                            name: 'fruit',
                            'onUpdate:modelValue': onUpdate,
                        },
                        {
                            default: () => [
                                h(Radio, { value: 'apple' }, { default: () => 'Apple' }),
                                h(Radio, { value: 'banana' }, { default: () => 'Banana' }),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const radios = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
        expect(radios.map((radio) => radio.name)).toEqual(['fruit', 'fruit']);

        radios[1].click();
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith('banana');
    });

    it('does not emit from disabled groups or disabled options', async () => {
        const disabledGroupUpdate = vi.fn();
        const disabledOptionUpdate = vi.fn();

        const disabledGroup = mountDom(
            defineComponent({
                render() {
                    return h(
                        RadioGroup,
                        {
                            disabled: true,
                            modelValue: 'apple',
                            'onUpdate:modelValue': disabledGroupUpdate,
                        },
                        {
                            default: () => [
                                h(Radio, { value: 'apple' }, { default: () => 'Apple' }),
                                h(Radio, { value: 'banana' }, { default: () => 'Banana' }),
                            ],
                        },
                    );
                },
            }),
        );

        const disabledOption = mountDom(
            defineComponent({
                render() {
                    return h(
                        RadioGroup,
                        {
                            modelValue: 'apple',
                            'onUpdate:modelValue': disabledOptionUpdate,
                        },
                        {
                            default: () => [
                                h(Radio, { value: 'apple' }, { default: () => 'Apple' }),
                                h(
                                    Radio,
                                    { value: 'banana', disabled: true },
                                    { default: () => 'Banana' },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const disabledGroupBanana = disabledGroup.querySelector(
            'input[value="banana"]',
        ) as HTMLInputElement;
        const disabledOptionBanana = disabledOption.querySelector(
            'input[value="banana"]',
        ) as HTMLInputElement;

        disabledGroupBanana.click();
        disabledOptionBanana.click();
        await flush();

        expect(disabledGroupBanana.disabled).toBe(true);
        expect(disabledOptionBanana.disabled).toBe(true);
        expect(disabledGroupUpdate).not.toHaveBeenCalled();
        expect(disabledOptionUpdate).not.toHaveBeenCalled();
    });

    it('applies direct state and ARIA props on the group', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        RadioGroup,
                        {
                            id: 'fruit-control',
                            describedby: 'fruit-description fruit-message',
                            invalid: true,
                            labelledby: 'fruit-label',
                            modelValue: 'apple',
                            required: true,
                        },
                        {
                            default: () => [
                                h(Radio, { value: 'apple' }, { default: () => 'Apple' }),
                                h(Radio, { value: 'banana' }, { default: () => 'Banana' }),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const group = container.querySelector('[role="radiogroup"]')!;
        const groupRoot = container.querySelector('.rp-radio-group')!;
        const checkedRadio = container.querySelector('input[value="apple"]') as HTMLInputElement;
        const uncheckedRadio = container.querySelector('input[value="banana"]') as HTMLInputElement;
        const radioRoot = checkedRadio.closest('.rp-radio')!;

        expect(group.id).toBe('fruit-control');
        expect(group.getAttribute('aria-required')).toBe('true');
        expect(group.getAttribute('aria-invalid')).toBe('true');
        expect(group.getAttribute('aria-labelledby')).toBe('fruit-label');
        expect(group.getAttribute('aria-describedby')).toBe('fruit-description fruit-message');
        expect(groupRoot.classList.contains('rp-radio-group--invalid')).toBe(true);
        expect(checkedRadio.required).toBe(true);
        expect(uncheckedRadio.required).toBe(true);
        expect(radioRoot.classList.contains('rp-radio--checked')).toBe(true);
    });

    it('adds variant, color, and size modifiers from the group with per-option overrides', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        RadioGroup,
                        {
                            color: 'green',
                            modelValue: 'apple',
                            size: 'lg',
                            variant: 'outline',
                        },
                        {
                            default: () => [
                                h(Radio, { value: 'apple' }, { default: () => 'Apple' }),
                                h(
                                    Radio,
                                    {
                                        color: 'red',
                                        size: 'sm',
                                        value: 'banana',
                                        variant: 'solid',
                                    },
                                    { default: () => 'Banana' },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const appleRoot = container.querySelector('input[value="apple"]')!.closest('.rp-radio')!;
        const bananaRoot = container.querySelector('input[value="banana"]')!.closest('.rp-radio')!;

        expect([...appleRoot.classList]).toEqual([
            'rp-radio',
            'rp-radio--checked',
            'rp-radio--outline',
            'rp-radio--size-lg',
        ]);
        expect([...bananaRoot.classList]).toEqual([
            'rp-radio',
            'rp-radio--solid',
            'rp-radio--size-sm',
        ]);
        expect((appleRoot as HTMLElement).style.getPropertyValue('--_rp-radio-color')).toBe(
            'var(--rp-color-green-filled)',
        );
        expect((bananaRoot as HTMLElement).style.getPropertyValue('--_rp-radio-color')).toBe(
            'var(--rp-color-red-filled)',
        );
    });

    it('resolves selected color variables for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) =>
                            h(
                                RadioGroup,
                                {
                                    color,
                                    modelValue: color,
                                },
                                {
                                    default: () =>
                                        h(Radio, { value: color }, { default: () => color }),
                                },
                            ),
                        ),
                    );
                },
            }),
        );

        await flush();

        const radios = [...container.querySelectorAll('.rp-radio')];

        expect(radios).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            const radio = radios[index] as HTMLElement;

            expect([...radio.classList]).toEqual(['rp-radio', 'rp-radio--checked']);
            expect(radio.style.getPropertyValue('--_rp-radio-color')).toBe(
                `var(--rp-color-${color}-filled)`,
            );
        }
    });

    it('sets selected color variables from group color values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        RadioGroup,
                        {
                            color: '#ff3366',
                            modelValue: 'apple',
                        },
                        {
                            default: () => h(Radio, { value: 'apple' }, { default: () => 'Apple' }),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-radio') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-radio', 'rp-radio--checked']);
        expect(root.style.getPropertyValue('--_rp-radio-color')).toBe('#ff3366');
        expect(root.style.getPropertyValue('--_rp-radio-on-color')).toBe('');
    });

    it('sets readable selected foreground when group autoContrast is enabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(
                            RadioGroup,
                            {
                                autoContrast: true,
                                color: '#fab005',
                                modelValue: 'apple',
                            },
                            {
                                default: () =>
                                    h(Radio, { value: 'apple' }, { default: () => 'Apple' }),
                            },
                        ),
                        h(
                            RadioGroup,
                            {
                                autoContrast: true,
                                color: '#141414',
                                modelValue: 'banana',
                            },
                            {
                                default: () =>
                                    h(Radio, { value: 'banana' }, { default: () => 'Banana' }),
                            },
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const [lightRoot, darkRoot] = [...container.querySelectorAll('.rp-radio')] as HTMLElement[];

        expect(lightRoot.style.getPropertyValue('--_rp-radio-on-color')).toBe(
            'var(--rp-color-black)',
        );
        expect(darkRoot.style.getPropertyValue('--_rp-radio-on-color')).toBe(
            'var(--rp-color-white)',
        );
    });
});
