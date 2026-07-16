import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';

import { click, flush, input, mountDom } from '../../tests/utils/vue';
import Checkbox from './checkbox/checkbox.vue';
import ColorInput from './color-input/color-input.vue';
import Input from './input/input.vue';
import NumberInput from './number-input/number-input.vue';
import Radio from './radio/radio.vue';
import RadioGroup from './radio/radio-group.vue';
import RangeSlider from './slider/range-slider.vue';
import Slider from './slider/slider.vue';
import Select from './select/select.vue';
import Switch from './switch/switch.vue';
import Textarea from './textarea/textarea.vue';

function changeChecked(element: HTMLInputElement, checked: boolean) {
    element.checked = checked;
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
}

async function reset(form: HTMLFormElement) {
    form.reset();
    await Promise.resolve();
    await flush();
}

describe('native form value controls', () => {
    it('resets uncontrolled text, textarea, number, and color values without emitting', async () => {
        const updates = {
            input: vi.fn(),
            textarea: vi.fn(),
            number: vi.fn(),
            color: vi.fn(),
        };
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', { id: 'text-form' }, [
                        h(Input, {
                            id: 'text-control',
                            defaultValue: 'initial',
                            'onUpdate:modelValue': updates.input,
                        }),
                        h(Textarea, {
                            id: 'textarea-control',
                            defaultValue: 'notes',
                            'onUpdate:modelValue': updates.textarea,
                        }),
                        h(NumberInput, {
                            id: 'number-control',
                            defaultValue: 2,
                            'onUpdate:modelValue': updates.number,
                        }),
                        h(ColorInput, {
                            id: 'color-control',
                            defaultValue: '#112233',
                            withEyeDropper: false,
                            'onUpdate:modelValue': updates.color,
                        }),
                    ]);
                },
            }),
        );
        await flush();

        const text = container.querySelector('#text-control') as HTMLInputElement;
        const textarea = container.querySelector('#textarea-control') as HTMLTextAreaElement;
        const number = container.querySelector('#number-control') as HTMLInputElement;
        const color = container.querySelector('#color-control') as HTMLInputElement;

        input(text, 'changed');
        textarea.value = 'changed notes';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        input(number, '7');
        input(color, '#abcdef');
        await flush();

        expect([text.value, textarea.value, number.value, color.value]).toEqual([
            'changed',
            'changed notes',
            '7',
            '#abcdef',
        ]);

        await reset(container.querySelector('form')!);

        expect([text.value, textarea.value, number.value, color.value]).toEqual([
            'initial',
            'notes',
            '2',
            '#112233',
        ]);
        expect(Object.values(updates).map((update) => update.mock.calls.length)).toEqual([
            1, 1, 1, 1,
        ]);
    });

    it('submits and resets uncontrolled checkbox and switch values', async () => {
        const checkboxUpdate = vi.fn();
        const switchUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', { id: 'checks-form' }, [
                        h(Checkbox, {
                            id: 'checkbox-control',
                            name: 'terms',
                            value: 'accepted',
                            defaultValue: true,
                            'onUpdate:modelValue': checkboxUpdate,
                        }),
                        h(Switch, {
                            id: 'switch-control',
                            name: 'alerts',
                            value: 'enabled',
                            defaultValue: false,
                            'onUpdate:modelValue': switchUpdate,
                        }),
                    ]);
                },
            }),
        );
        await flush();

        const checkbox = container.querySelector('#checkbox-control') as HTMLInputElement;
        const switchControl = container.querySelector('#switch-control') as HTMLInputElement;
        const form = container.querySelector('form')!;

        changeChecked(checkbox, false);
        changeChecked(switchControl, true);
        await flush();

        expect(Object.fromEntries(new FormData(form))).toEqual({ alerts: 'enabled' });

        await reset(form);

        expect(checkbox.checked).toBe(true);
        expect(switchControl.checked).toBe(false);
        expect(Object.fromEntries(new FormData(form))).toEqual({ terms: 'accepted' });
        expect(checkboxUpdate).toHaveBeenCalledOnce();
        expect(switchUpdate).toHaveBeenCalledOnce();
    });

    it('submits and resets an uncontrolled radio group', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        { id: 'radio-form' },
                        h(
                            RadioGroup,
                            {
                                defaultValue: 'banana',
                                name: 'fruit',
                                'onUpdate:modelValue': onUpdate,
                            },
                            {
                                default: () => [
                                    h(Radio, { id: 'apple', value: 'apple' }),
                                    h(Radio, { id: 'banana', value: 'banana' }),
                                ],
                            },
                        ),
                    );
                },
            }),
        );
        await flush();

        const apple = container.querySelector('#apple') as HTMLInputElement;
        const banana = container.querySelector('#banana') as HTMLInputElement;
        const form = container.querySelector('form')!;

        changeChecked(apple, true);
        await flush();

        expect(apple.checked).toBe(true);
        expect(banana.checked).toBe(false);
        expect(Object.fromEntries(new FormData(form))).toEqual({ fruit: 'apple' });

        await reset(form);

        expect(apple.checked).toBe(false);
        expect(banana.checked).toBe(true);
        expect(Object.fromEntries(new FormData(form))).toEqual({ fruit: 'banana' });
        expect(onUpdate).toHaveBeenCalledOnce();
    });

    it('submits and resets uncontrolled slider values', async () => {
        const sliderUpdate = vi.fn();
        const rangeUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', { id: 'slider-form' }, [
                        h(Slider, {
                            id: 'slider-control',
                            name: 'volume',
                            defaultValue: 20,
                            'onUpdate:modelValue': sliderUpdate,
                        }),
                        h(RangeSlider, {
                            id: 'range-control',
                            name: ['from', 'to'],
                            defaultValue: [25, 75],
                            'onUpdate:modelValue': rangeUpdate,
                        }),
                    ]);
                },
            }),
        );
        await flush();

        const slider = container.querySelector('#slider-control') as HTMLInputElement;
        const range = [...container.querySelectorAll<HTMLInputElement>('.rp-range-slider__native')];
        const form = container.querySelector('form')!;

        input(slider, '40');
        input(range[0]!, '30');
        await flush();

        expect(Object.fromEntries(new FormData(form))).toEqual({
            volume: '40',
            from: '30',
            to: '75',
        });

        await reset(form);

        expect(slider.value).toBe('20');
        expect(range.map((element) => element.value)).toEqual(['25', '75']);
        expect(sliderUpdate).toHaveBeenCalledOnce();
        expect(rangeUpdate).toHaveBeenCalledOnce();
    });

    it('resets an uncontrolled range slider independently of its current min-range bounds', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        h(RangeSlider, {
                            defaultValue: [70, 90],
                            minRange: 20,
                            'onUpdate:modelValue': onUpdate,
                        }),
                    );
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const [lower, upper] = [
            ...container.querySelectorAll<HTMLInputElement>('.rp-range-slider__native'),
        ];

        input(lower!, '10');
        await flush();
        input(upper!, '30');
        await flush();
        expect([lower!.value, upper!.value]).toEqual(['10', '30']);

        await reset(form);

        expect([lower!.value, upper!.value]).toEqual(['70', '90']);
        expect(onUpdate).toHaveBeenCalledTimes(2);
    });

    it('uses a validated native select proxy with typed updates and reset', async () => {
        const onUpdate = vi.fn();
        const onInput = vi.fn();
        const onChange = vi.fn();
        const options = [
            { label: 'Apple', value: 'apple' },
            { label: 'Two as text', value: '2' },
            { label: 'Two as number', value: 2 },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        { id: 'select-form' },
                        h(Select, {
                            defaultValue: 'apple',
                            inputAttrs: { onInput, onChange },
                            name: 'choice',
                            options,
                            required: true,
                            'onUpdate:modelValue': onUpdate,
                        }),
                    );
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const proxy = container.querySelector('.rp-select__native') as HTMLSelectElement;
        click(container.querySelector('.rp-select__trigger')!);
        await flush();
        const option = [...container.querySelectorAll<HTMLElement>('[role="option"]')].find(
            (element) => element.textContent?.trim() === 'Two as number',
        )!;
        click(option);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(2);
        expect(onInput).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledOnce();
        expect(proxy.selectedIndex).toBe(3);
        expect(Object.fromEntries(new FormData(form))).toEqual({ choice: '2' });

        await reset(form);

        expect(proxy.value).toBe('apple');
        expect(container.querySelector('.rp-select__value')?.textContent?.trim()).toBe('Apple');
        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onInput).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledOnce();
    });

    it('preserves an uncontrolled select default when options load asynchronously', async () => {
        const state = reactive({
            options: [] as Array<{ label: string; value: string }>,
        });
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        h(Select, {
                            defaultValue: 'banana',
                            options: state.options,
                            'onUpdate:modelValue': onUpdate,
                        }),
                    );
                },
            }),
        );
        await flush();

        state.options = [
            { label: 'Apple', value: 'apple' },
            { label: 'Banana', value: 'banana' },
        ];
        await flush();

        const form = container.querySelector('form')!;
        const proxy = container.querySelector('.rp-select__native') as HTMLSelectElement;
        expect(proxy.value).toBe('banana');

        click(container.querySelector('.rp-select__trigger')!);
        await flush();
        click([...container.querySelectorAll<HTMLElement>('[role="option"]')][0]!);
        await flush();
        expect(proxy.value).toBe('apple');

        await reset(form);

        expect(proxy.value).toBe('banana');
        expect(container.querySelector('.rp-select__value')?.textContent?.trim()).toBe('Banana');
        expect(onUpdate).toHaveBeenCalledOnce();
    });

    it('keeps controlled values authoritative on reset and across mode changes', async () => {
        const props = reactive<{ modelValue: string | undefined; defaultValue: string }>({
            modelValue: 'controlled',
            defaultValue: 'initial',
        });
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        h(Input, {
                            ...props,
                            'onUpdate:modelValue': onUpdate,
                        }),
                    );
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const native = container.querySelector('input')!;
        native.value = 'browser-reset-target';

        await reset(form);
        expect(native.value).toBe('controlled');

        props.modelValue = undefined;
        await flush();
        expect(native.value).toBe('controlled');

        input(native, 'uncontrolled');
        await flush();
        expect(native.value).toBe('uncontrolled');
        expect(onUpdate).toHaveBeenLastCalledWith('uncontrolled');
    });

    it('associates direct form props with an external form', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h('form', { id: 'external-form' }),
                        h(Input, {
                            defaultValue: 'initial',
                            form: 'external-form',
                            inputAttrs: { form: 'legacy-form' },
                            name: 'externalValue',
                            'onUpdate:modelValue': onUpdate,
                        }),
                    ]);
                },
            }),
        );
        await flush();

        const form = container.querySelector('#external-form') as HTMLFormElement;
        const native = container.querySelector('input')!;
        expect(native.form).toBe(form);
        expect(Object.fromEntries(new FormData(form))).toEqual({ externalValue: 'initial' });

        input(native, 'changed');
        await flush();
        await reset(form);

        expect(native.value).toBe('initial');
        expect(onUpdate).toHaveBeenCalledOnce();
    });

    it('applies direct validity to radio, slider, range slider, and select', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', { id: 'validation-form' }, [
                        h(
                            RadioGroup,
                            {
                                name: 'radio',
                                required: true,
                                validationMessage: 'Choose one.',
                            },
                            {
                                default: () => [
                                    h(Radio, { value: 'one' }),
                                    h(Radio, { value: 'two' }),
                                ],
                            },
                        ),
                        h(Slider, {
                            invalid: true,
                            required: true,
                            validationMessage: 'Invalid slider.',
                        }),
                        h(RangeSlider, {
                            validationMessage: ['Invalid lower.', undefined],
                        }),
                        h(ColorInput, {
                            id: 'color-validation',
                            defaultValue: 'not-a-color',
                            validationMessage: '',
                            withEyeDropper: false,
                        }),
                        h(Select, {
                            name: 'select',
                            options: [{ label: 'One', value: 'one' }],
                            required: true,
                        }),
                    ]);
                },
            }),
        );
        await flush();

        const radios = [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
        const slider = container.querySelector('.rp-slider__native') as HTMLInputElement;
        const range = [...container.querySelectorAll<HTMLInputElement>('.rp-range-slider__native')];
        const color = container.querySelector('#color-validation') as HTMLInputElement;
        const select = container.querySelector('.rp-select__native') as HTMLSelectElement;

        expect(radios[0]?.validationMessage).toBe('Choose one.');
        expect(radios[0]?.validity.customError).toBe(true);
        expect(radios[1]?.validity.customError).toBe(false);
        expect(slider.required).toBe(true);
        expect(slider.validationMessage).toBe('Invalid slider.');
        expect(slider.getAttribute('aria-invalid')).toBe('true');
        expect(range.map((element) => element.validationMessage)).toEqual(['Invalid lower.', '']);
        expect(color.validity.customError).toBe(false);
        expect(select.checkValidity()).toBe(false);

        select.dispatchEvent(new Event('invalid', { cancelable: true }));
        expect(document.activeElement).toBe(container.querySelector('.rp-select__trigger'));
    });
});
