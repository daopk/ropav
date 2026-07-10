import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';

import { click, flush, input, keydown, mountDom } from '../../../tests/utils/vue';
import NumberInput from './number-input.vue';

describe('NumberInput', () => {
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    it('renders number and null values with labelled controls by default', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(NumberInput, { modelValue: 12.5 }),
                        h(NumberInput, { modelValue: null }),
                    ]);
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-number-input')];
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        const controls = roots[0].querySelector('.rp-number-input__controls')!;
        const increment = controls.querySelector(
            '.rp-number-input__control--increment',
        ) as HTMLButtonElement;
        const decrement = controls.querySelector(
            '.rp-number-input__control--decrement',
        ) as HTMLButtonElement;

        expect(roots).toHaveLength(2);
        expect(roots[0].classList.contains('rp-input')).toBe(true);
        expect(inputs[0].type).toBe('number');
        expect(inputs[0].value).toBe('12.5');
        expect(inputs[1].value).toBe('');
        expect(increment.type).toBe('button');
        expect(increment.getAttribute('aria-label')).toBe('Increment value');
        expect(decrement.type).toBe('button');
        expect(decrement.getAttribute('aria-label')).toBe('Decrement value');
    });

    it('can hide controls and customize their accessible labels', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(NumberInput, {
                            decrementLabel: 'Remove one item',
                            incrementLabel: 'Add one item',
                            modelValue: 2,
                        }),
                        h(NumberInput, {
                            controls: false,
                            modelValue: 3,
                        }),
                    ]);
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-number-input')];
        const increment = roots[0].querySelector('.rp-number-input__control--increment')!;
        const decrement = roots[0].querySelector('.rp-number-input__control--decrement')!;

        expect(increment.getAttribute('aria-label')).toBe('Add one item');
        expect(decrement.getAttribute('aria-label')).toBe('Remove one item');
        expect(roots[1].querySelector('.rp-number-input__controls')).toBeNull();
    });

    it('emits numbers and null from native input events', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(NumberInput, {
                        modelValue: null,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        input(native, '12.5');
        await flush();
        input(native, '');
        await flush();

        expect(onUpdate).toHaveBeenNthCalledWith(1, 12.5);
        expect(onUpdate).toHaveBeenNthCalledWith(2, null);
    });

    it('applies range, state, and ARIA props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(NumberInput, {
                        id: 'quantity-control',
                        name: 'quantity',
                        ariaLabel: 'Quantity',
                        describedby: 'quantity-help quantity-error',
                        disabled: true,
                        invalid: true,
                        labelledby: 'quantity-label',
                        max: 20,
                        min: 2,
                        modelValue: 8,
                        placeholder: 'Enter quantity',
                        readonly: true,
                        required: true,
                        step: 2,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-number-input')!;
        const native = container.querySelector('input') as HTMLInputElement;
        const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];

        expect(native.id).toBe('quantity-control');
        expect(native.name).toBe('quantity');
        expect(native.value).toBe('8');
        expect(native.min).toBe('2');
        expect(native.max).toBe('20');
        expect(native.step).toBe('2');
        expect(native.placeholder).toBe('Enter quantity');
        expect(native.disabled).toBe(true);
        expect(native.readOnly).toBe(true);
        expect(native.required).toBe(true);
        expect(native.getAttribute('aria-label')).toBe('Quantity');
        expect(native.getAttribute('aria-required')).toBe('true');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.getAttribute('aria-labelledby')).toBe('quantity-label');
        expect(native.getAttribute('aria-describedby')).toBe('quantity-help quantity-error');
        expect(root.classList.contains('rp-input--disabled')).toBe(true);
        expect(root.classList.contains('rp-input--invalid')).toBe(true);
        expect(root.classList.contains('rp-input--readonly')).toBe(true);
        expect(buttons).toHaveLength(2);
        expect(buttons.every((button) => button.disabled)).toBe(true);
    });

    it('lets invalid state take priority over valid state', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(NumberInput, { modelValue: 1, valid: true }),
                        h(NumberInput, { invalid: true, modelValue: 2, valid: true }),
                    ]);
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-number-input')];
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];

        expect(roots[0].classList.contains('rp-input--valid')).toBe(true);
        expect(roots[0].classList.contains('rp-input--invalid')).toBe(false);
        expect(inputs[0].hasAttribute('aria-invalid')).toBe(false);
        expect(roots[1].classList.contains('rp-input--valid')).toBe(false);
        expect(roots[1].classList.contains('rp-input--invalid')).toBe(true);
        expect(inputs[1].getAttribute('aria-invalid')).toBe('true');
    });

    it('forwards native attributes and events without overriding owned props', async () => {
        const onBlur = vi.fn();
        const onChange = vi.fn();
        const onInput = vi.fn();
        const onKeydown = vi.fn();
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(NumberInput, {
                        id: 'owned-id',
                        max: 10,
                        min: 0,
                        modelValue: 3,
                        step: 0.5,
                        inputAttrs: {
                            id: 'ignored-id',
                            value: 99,
                            max: 100,
                            min: -100,
                            step: 10,
                            autocomplete: 'off',
                            class: 'native-class',
                            form: 'quantity-form',
                            inputmode: 'decimal',
                            onBlur,
                            onChange,
                            onInput,
                            onKeydown,
                        },
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.id).toBe('owned-id');
        expect(native.value).toBe('3');
        expect(native.min).toBe('0');
        expect(native.max).toBe('10');
        expect(native.step).toBe('0.5');
        expect(native.getAttribute('autocomplete')).toBe('off');
        expect(native.getAttribute('inputmode')).toBe('decimal');
        expect(native.getAttribute('form')).toBe('quantity-form');
        expect(native.classList.contains('native-class')).toBe(true);

        input(native, '4.5');
        keydown(native, 'A');
        native.dispatchEvent(new Event('change'));
        native.dispatchEvent(new FocusEvent('blur'));
        await flush();

        expect(onInput).toHaveBeenCalledOnce();
        expect(onKeydown).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledOnce();
        expect(onBlur).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(4.5);
    });

    it('applies and clears a custom validation message', async () => {
        const props = reactive({
            modelValue: 1 as number | null,
            validationMessage: 'Enter a valid quantity.',
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(NumberInput, props);
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        expect(native.validationMessage).toBe('Enter a valid quantity.');
        expect(native.checkValidity()).toBe(false);

        props.validationMessage = '';
        await flush();

        expect(native.validationMessage).toBe('');
        expect(native.checkValidity()).toBe(true);
    });

    it('steps with ArrowUp and ArrowDown without floating point drift', async () => {
        const state = reactive<{ value: number | null }>({ value: 0.2 });
        const updates: Array<number | null> = [];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(NumberInput, {
                        max: 0.3,
                        min: 0.1,
                        modelValue: state.value,
                        step: 0.1,
                        'onUpdate:modelValue': (value) => {
                            updates.push(value);
                            state.value = value;
                        },
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;

        keydown(native, 'ArrowUp');
        await flush();
        expect(state.value).toBe(0.3);
        expect(updates).toEqual([0.3]);

        keydown(native, 'ArrowUp');
        await flush();
        expect(updates).toEqual([0.3]);

        keydown(native, 'ArrowDown');
        await flush();
        expect(state.value).toBe(0.2);
        expect(updates).toEqual([0.3, 0.2]);
    });

    it('steps an empty value from zero and clamps the result to bounds', async () => {
        const increment = vi.fn();
        const decrement = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(NumberInput, {
                            modelValue: null,
                            step: 0.25,
                            'onUpdate:modelValue': increment,
                        }),
                        h(NumberInput, {
                            max: -1,
                            modelValue: null,
                            step: 0.25,
                            'onUpdate:modelValue': decrement,
                        }),
                    ]);
                },
            }),
        );

        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        keydown(inputs[0], 'ArrowUp');
        keydown(inputs[1], 'ArrowDown');
        await flush();

        expect(increment).toHaveBeenCalledWith(0.25);
        expect(decrement).toHaveBeenCalledWith(-1);
    });

    it('steps with controls and makes bound controls no-ops', async () => {
        const state = reactive<{ value: number | null }>({ value: 0.2 });
        const updates: Array<number | null> = [];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(NumberInput, {
                        max: 0.3,
                        min: 0.1,
                        modelValue: state.value,
                        step: 0.1,
                        'onUpdate:modelValue': (value) => {
                            updates.push(value);
                            state.value = value;
                        },
                    });
                },
            }),
        );

        const getIncrement = () =>
            container.querySelector('.rp-number-input__control--increment') as HTMLButtonElement;
        const getDecrement = () =>
            container.querySelector('.rp-number-input__control--decrement') as HTMLButtonElement;

        click(getIncrement());
        await flush();
        expect(state.value).toBe(0.3);
        expect(getIncrement().disabled).toBe(true);
        expect(updates).toEqual([0.3]);

        click(getIncrement());
        await flush();
        expect(updates).toEqual([0.3]);

        click(getDecrement());
        await flush();
        expect(state.value).toBe(0.2);
        expect(updates).toEqual([0.3, 0.2]);
    });

    it('normalizes inverted bounds and non-positive steps', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(NumberInput, {
                        max: 0,
                        min: 10,
                        modelValue: 5,
                        step: 0,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        expect(native.min).toBe('0');
        expect(native.max).toBe('10');
        expect(native.step).toBe('1');

        keydown(native, 'ArrowUp');
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(6);
    });

    it('does not emit non-finite values when stepping over the numeric range', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(NumberInput, {
                        modelValue: Number.MAX_VALUE,
                        step: Number.MAX_VALUE,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        keydown(container.querySelector('input')!, 'ArrowUp');
        await flush();

        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('clamps typed values on blur without snapping them to the step', async () => {
        const state = reactive<{ value: number | null }>({ value: 5 });
        const updates: Array<number | null> = [];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(NumberInput, {
                        max: 10,
                        min: 0,
                        modelValue: state.value,
                        step: 3,
                        'onUpdate:modelValue': (value) => {
                            updates.push(value);
                            state.value = value;
                        },
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        input(native, '12');
        await flush();
        expect(updates).toEqual([12]);

        native.dispatchEvent(new FocusEvent('blur'));
        await flush();
        expect(state.value).toBe(10);
        expect(updates).toEqual([12, 10]);

        input(native, '5');
        await flush();
        native.dispatchEvent(new FocusEvent('blur'));
        await flush();
        expect(state.value).toBe(5);
        expect(updates).toEqual([12, 10, 5]);
    });

    it('does not clamp on blur when clampOnBlur is false or the value is empty', async () => {
        const unclamped = vi.fn();
        const empty = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(NumberInput, {
                            clampOnBlur: false,
                            max: 10,
                            modelValue: 12,
                            'onUpdate:modelValue': unclamped,
                        }),
                        h(NumberInput, {
                            max: 10,
                            modelValue: null,
                            'onUpdate:modelValue': empty,
                        }),
                    ]);
                },
            }),
        );

        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        inputs[0].dispatchEvent(new FocusEvent('blur'));
        inputs[1].dispatchEvent(new FocusEvent('blur'));
        await flush();

        expect(unclamped).not.toHaveBeenCalled();
        expect(empty).not.toHaveBeenCalled();
    });

    it.each(['disabled', 'readonly'] as const)(
        'does not emit input, keyboard, control, or blur updates when %s',
        async (state) => {
            const onUpdate = vi.fn();
            const container = mountDom(
                defineComponent({
                    render() {
                        return h(NumberInput, {
                            max: 2,
                            min: 0,
                            modelValue: 1,
                            [state]: true,
                            'onUpdate:modelValue': onUpdate,
                        });
                    },
                }),
            );

            const root = container.querySelector('.rp-number-input')!;
            const native = container.querySelector('input') as HTMLInputElement;
            const increment = container.querySelector(
                '.rp-number-input__control--increment',
            ) as HTMLButtonElement;

            input(native, '3');
            keydown(native, 'ArrowUp');
            click(increment);
            native.dispatchEvent(new FocusEvent('blur'));
            await flush();

            expect(root.classList.contains(`rp-input--${state}`)).toBe(true);
            expect(increment.disabled).toBe(true);
            expect(onUpdate).not.toHaveBeenCalled();
        },
    );

    it('disables only the controls that have reached a bound', async () => {
        const atMinUpdate = vi.fn();
        const atMaxUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(NumberInput, {
                            max: 10,
                            min: 0,
                            modelValue: 0,
                            'onUpdate:modelValue': atMinUpdate,
                        }),
                        h(NumberInput, {
                            max: 10,
                            min: 0,
                            modelValue: 10,
                            'onUpdate:modelValue': atMaxUpdate,
                        }),
                    ]);
                },
            }),
        );

        const roots = [...container.querySelectorAll('.rp-number-input')];
        const minDecrement = roots[0].querySelector(
            '.rp-number-input__control--decrement',
        ) as HTMLButtonElement;
        const minIncrement = roots[0].querySelector(
            '.rp-number-input__control--increment',
        ) as HTMLButtonElement;
        const maxDecrement = roots[1].querySelector(
            '.rp-number-input__control--decrement',
        ) as HTMLButtonElement;
        const maxIncrement = roots[1].querySelector(
            '.rp-number-input__control--increment',
        ) as HTMLButtonElement;

        expect(minDecrement.disabled).toBe(true);
        expect(minIncrement.disabled).toBe(false);
        expect(maxDecrement.disabled).toBe(false);
        expect(maxIncrement.disabled).toBe(true);

        click(minDecrement);
        click(maxIncrement);
        keydown(roots[0].querySelector('input')!, 'ArrowDown');
        keydown(roots[1].querySelector('input')!, 'ArrowUp');
        await flush();

        expect(atMinUpdate).not.toHaveBeenCalled();
        expect(atMaxUpdate).not.toHaveBeenCalled();
    });

    it('adds a radius modifier for each supported radius', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        radii.map((radius) => h(NumberInput, { modelValue: 1, radius })),
                    );
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-number-input')];

        expect(roots).toHaveLength(radii.length);
        for (const [index, radius] of radii.entries()) {
            expect(roots[index].classList.contains(`rp-input--radius-${radius}`)).toBe(true);
        }
    });

    it('adds a size modifier for each supported size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        sizes.map((size) => h(NumberInput, { modelValue: 1, size })),
                    );
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-number-input')];

        expect(roots).toHaveLength(sizes.length);
        for (const [index, size] of sizes.entries()) {
            expect(roots[index].classList.contains(`rp-input--size-${size}`)).toBe(true);
        }
    });
});
