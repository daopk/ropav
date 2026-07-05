import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Radio from './radio.vue';
import RadioGroup from './radio-group.vue';

describe('Radio', () => {
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

    it('adds color and size modifiers from the group with per-option overrides', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        RadioGroup,
                        {
                            color: 'success',
                            modelValue: 'apple',
                            size: 'lg',
                        },
                        {
                            default: () => [
                                h(Radio, { value: 'apple' }, { default: () => 'Apple' }),
                                h(
                                    Radio,
                                    { color: 'danger', size: 'sm', value: 'banana' },
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
            'rp-radio--color-success',
            'rp-radio--size-lg',
        ]);
        expect([...bananaRoot.classList]).toEqual([
            'rp-radio',
            'rp-radio--color-danger',
            'rp-radio--size-sm',
        ]);
    });
});
