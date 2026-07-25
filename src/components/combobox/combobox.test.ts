import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';

import {
    click,
    flush,
    input as inputValue,
    keydown,
    mountDom,
    waitForAssertion,
} from '../../../tests/utils/vue';
import Combobox from './combobox.vue';
import type { ComboboxProps } from './types';

const fruitOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana', disabled: true },
    { label: 'Dragon Fruit', value: 3 },
];

function mountCombobox(
    props: ComboboxProps = {},
    listeners: Record<string, (...args: never[]) => void> = {},
) {
    return mountDom(
        defineComponent({
            render() {
                return h(Combobox, {
                    ariaLabel: 'Fruit',
                    options: fruitOptions,
                    ...props,
                    ...listeners,
                });
            },
        }),
    );
}

describe('Combobox', () => {
    it('renders an editable ARIA combobox backed by a native form control', async () => {
        const container = mountCombobox({
            id: 'fruit',
            name: 'fruit',
            modelValue: 3,
            required: true,
            inputAttrs: {
                name: 'search-query',
                form: 'other-form',
                required: true,
            },
        });
        await flush();

        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;
        const native = container.querySelector('select')!;

        expect(input.tagName).toBe('INPUT');
        expect(input.id).toBe('fruit');
        expect(input.value).toBe('Dragon Fruit');
        expect(input.getAttribute('aria-autocomplete')).toBe('list');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(input.getAttribute('aria-required')).toBe('true');
        expect(input.name).toBe('');
        expect(input.getAttribute('form')).toBe('');
        expect(input.form).toBeNull();
        expect(input.required).toBe(false);
        expect(native.name).toBe('fruit');
        expect(native.required).toBe(true);
        expect(native.selectedIndex).toBe(3);
    });

    it('opens with all options before filtering the editable value', async () => {
        const onUpdate = vi.fn();
        const onSearch = vi.fn();
        const container = mountCombobox(
            { modelValue: 'apple' },
            {
                'onUpdate:modelValue': onUpdate,
                onSearch,
            },
        );
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        input.focus();
        await nextTick();

        expect(container.querySelectorAll('[role="option"]')).toHaveLength(3);
        expect(input.getAttribute('aria-expanded')).toBe('true');

        inputValue(input, 'fruit');
        await nextTick();

        const visibleOptions = container.querySelectorAll('[role="option"]');
        expect(visibleOptions).toHaveLength(1);
        expect(visibleOptions[0]?.textContent).toContain('Dragon Fruit');
        expect(onSearch).toHaveBeenCalledWith('fruit');
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('positions the dropdown with collision-aware placement', async () => {
        const container = mountCombobox({ modelValue: null });
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        input.focus();
        await nextTick();

        const popup = container.querySelector('.rp-combobox__dropdown') as HTMLElement;
        await waitForAssertion(() => {
            expect(['bottom-start', 'top-start']).toContain(popup.dataset.placement);
            expect(popup.dataset.side).toBe(popup.dataset.placement?.split('-')[0]);
            expect(popup.style.position).toBe('absolute');
            expect(popup.style.visibility).not.toBe('hidden');
        });
    });

    it('uses Arrow keys and Enter while skipping disabled options', async () => {
        const onUpdate = vi.fn();
        const container = mountCombobox({ modelValue: null }, { 'onUpdate:modelValue': onUpdate });
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        input.focus();
        keydown(input, 'ArrowDown');
        await nextTick();

        const highlighted = container.querySelector('[role="option"][data-highlighted]');
        expect(highlighted?.textContent).toContain('Dragon Fruit');
        expect(input.getAttribute('aria-activedescendant')).toBe(highlighted?.id);

        keydown(input, 'Enter');
        await nextTick();

        expect(onUpdate).toHaveBeenCalledWith(3);
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('filters and highlights the first enabled match as the user types', async () => {
        const container = mountCombobox({ modelValue: null });
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        input.focus();
        inputValue(input, 'DRA');
        await nextTick();

        const option = container.querySelector('[role="option"]')!;
        expect(option.textContent).toContain('Dragon Fruit');
        expect(option.hasAttribute('data-highlighted')).toBe(true);
    });

    it('restores the selected value and label when Escape cancels a search', async () => {
        const value = ref<string | number | null>('apple');
        const onUpdate = vi.fn((nextValue: string | number | null) => {
            value.value = nextValue;
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Combobox, {
                        ariaLabel: 'Fruit',
                        modelValue: value.value,
                        options: fruitOptions,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        input.focus();
        inputValue(input, 'dra');
        await flush();

        expect(value.value).toBe('apple');

        keydown(input, 'Escape');
        await flush();

        expect(onUpdate).not.toHaveBeenCalled();
        expect(value.value).toBe('apple');
        expect(input.value).toBe('Apple');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('supports uncontrolled selection and clear behavior', async () => {
        const onUpdate = vi.fn();
        const onSearch = vi.fn();
        const container = mountCombobox(
            {
                defaultValue: 'apple',
                clearable: true,
            },
            {
                'onUpdate:modelValue': onUpdate,
                onSearch,
            },
        );
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;
        const clear = container.querySelector('.rp-combobox__clear')!;

        click(clear);
        await nextTick();

        expect(onUpdate).toHaveBeenCalledWith(null);
        expect(onSearch).toHaveBeenCalledWith('');
        expect(input.value).toBe('');
        expect((container.querySelector('select') as HTMLSelectElement).selectedIndex).toBe(0);
    });

    it('supports an empty string as a selected option value', async () => {
        const onUpdate = vi.fn();
        const container = mountCombobox(
            {
                defaultValue: '',
                options: [{ label: 'All fruit', value: '' }],
                clearable: true,
            },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;
        const native = container.querySelector('select') as HTMLSelectElement;
        const clear = container.querySelector('.rp-combobox__clear')!;

        expect(input.value).toBe('All fruit');
        expect(native.selectedIndex).toBe(1);

        click(clear);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(null);
        expect(input.value).toBe('');
        expect(native.selectedIndex).toBe(0);
    });

    it('does not select disabled options by pointer', async () => {
        const onUpdate = vi.fn();
        const container = mountCombobox({ modelValue: null }, { 'onUpdate:modelValue': onUpdate });
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        input.focus();
        await nextTick();
        click(container.querySelectorAll('[role="option"]')[1]!);

        expect(onUpdate).not.toHaveBeenCalled();
        expect(input.getAttribute('aria-expanded')).toBe('true');
    });

    it('renders an empty state and supports disabling built-in filtering', async () => {
        const filtered = mountCombobox({ modelValue: null });
        const filteredInput = filtered.querySelector('[role="combobox"]') as HTMLInputElement;
        filteredInput.focus();
        inputValue(filteredInput, 'missing');
        await nextTick();

        expect(filtered.querySelector('[role="option"]')).toBeNull();
        expect(filtered.querySelector('.rp-combobox__empty')?.textContent).toContain('No options');

        const unfiltered = mountCombobox({ modelValue: null, filter: false });
        const unfilteredInput = unfiltered.querySelector('[role="combobox"]') as HTMLInputElement;
        unfilteredInput.focus();
        inputValue(unfilteredInput, 'missing');
        await nextTick();

        expect(unfiltered.querySelectorAll('[role="option"]')).toHaveLength(3);
    });

    it('keeps options inactive when they arrive after opening without a search', async () => {
        const state = reactive<ComboboxProps>({
            modelValue: 'gamma',
            options: [],
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Combobox, {
                        ariaLabel: 'Fruit',
                        modelValue: state.modelValue,
                        options: state.options,
                    });
                },
            }),
        );
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        input.focus();
        await flush();
        state.options = [
            { label: 'Alpha', value: 'alpha' },
            { label: 'Gamma', value: 'gamma' },
        ];
        await flush();

        expect(container.querySelector('[role="option"][data-highlighted]')).toBeNull();
        expect(input.getAttribute('aria-activedescendant')).toBeNull();

        keydown(input, 'ArrowDown');
        await flush();

        const highlighted = container.querySelector(
            '[role="option"][data-highlighted]',
        ) as HTMLElement;
        expect(highlighted.textContent).toContain('Alpha');
        expect(input.getAttribute('aria-activedescendant')).toBe(highlighted.id);
    });

    it('highlights results that arrive after an asynchronous search', async () => {
        const state = reactive<ComboboxProps>({
            modelValue: null,
            options: [],
            filter: false,
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Combobox, {
                        ariaLabel: 'Fruit',
                        modelValue: state.modelValue,
                        options: state.options,
                        filter: state.filter,
                        'onUpdate:modelValue': (value) => {
                            state.modelValue = value;
                        },
                    });
                },
            }),
        );
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        input.focus();
        inputValue(input, 'dragon');
        await flush();

        state.options = [
            { label: 'Unavailable', value: 'unavailable', disabled: true },
            { label: 'Dragon Fruit', value: 3 },
        ];
        await flush();

        const option = container.querySelector('[role="option"][data-highlighted]')!;
        expect(option.textContent).toContain('Dragon Fruit');
        expect(option.hasAttribute('data-highlighted')).toBe(true);
        expect(input.getAttribute('aria-activedescendant')).toBe(option.id);

        keydown(input, 'Enter');
        await flush();

        expect(state.modelValue).toBe(3);
        expect(input.value).toBe('Dragon Fruit');
    });

    it('composes inputAttrs listeners and keeps component semantics authoritative', async () => {
        const onInput = vi.fn();
        const onKeydown = vi.fn();
        const container = mountCombobox({
            modelValue: null,
            inputAttrs: {
                class: 'consumer-input',
                autocomplete: 'organization',
                onInput,
                onKeydown,
                role: 'searchbox',
            },
        });
        const input = container.querySelector('input')!;

        inputValue(input, 'app');
        keydown(input, 'ArrowDown');
        await nextTick();

        expect(input.classList.contains('rp-combobox__input')).toBe(true);
        expect(input.classList.contains('consumer-input')).toBe(true);
        expect(input.autocomplete).toBe('organization');
        expect(input.getAttribute('role')).toBe('combobox');
        expect(onInput).toHaveBeenCalledOnce();
        expect(onKeydown).toHaveBeenCalledOnce();
    });

    it('keeps the visible search input out of ancestor form validation', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(Combobox, {
                            ariaLabel: 'Fruit',
                            name: 'fruit',
                            modelValue: 'apple',
                            options: fruitOptions,
                            inputAttrs: {
                                name: 'query',
                                form: 'other-form',
                                pattern: '[0-9]+',
                            },
                        }),
                    ]);
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;
        const native = container.querySelector('select')!;

        expect(input.value).toBe('Apple');
        expect(input.checkValidity()).toBe(false);
        expect(input.form).toBeNull();
        expect([...form.elements]).not.toContain(input);
        expect([...form.elements]).toContain(native);
        expect(form.checkValidity()).toBe(true);
        expect(new FormData(form).get('fruit')).toBe('apple');
    });

    it('syncs external values and keeps controlled native selection authoritative', async () => {
        const state = reactive<ComboboxProps>({
            modelValue: 'apple',
            options: fruitOptions,
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Combobox, {
                        ariaLabel: 'Fruit',
                        modelValue: state.modelValue,
                        options: state.options,
                    });
                },
            }),
        );
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;
        const native = container.querySelector('select')!;

        state.modelValue = 3;
        await flush();
        expect(input.value).toBe('Dragon Fruit');
        expect(native.selectedIndex).toBe(3);

        input.focus();
        await nextTick();
        click(container.querySelectorAll('[role="option"]')[0]!);
        await flush();

        expect(input.value).toBe('Dragon Fruit');
        expect(native.selectedIndex).toBe(3);
    });

    it('participates in FormData and restores its uncontrolled default on reset', async () => {
        const value = ref<string | number | null>(null);
        const container = mountDom(
            defineComponent({
                setup() {
                    return () =>
                        h('form', [
                            h(Combobox, {
                                ariaLabel: 'Fruit',
                                name: 'fruit',
                                defaultValue: 'apple',
                                options: fruitOptions,
                                'onUpdate:modelValue': (nextValue) => {
                                    value.value = nextValue;
                                },
                            }),
                        ]);
                },
            }),
        );
        const form = container.querySelector('form')!;
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        expect(new FormData(form).get('fruit')).toBe('apple');
        input.focus();
        inputValue(input, 'dragon');
        await nextTick();
        keydown(input, 'Enter');
        await flush();

        expect(value.value).toBe(3);
        expect(new FormData(form).get('fruit')).toBe('3');

        form.reset();
        await flush();

        expect(input.value).toBe('Apple');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(new FormData(form).get('fruit')).toBe('apple');

        inputValue(input, 'missing');
        await flush();
        expect(input.value).toBe('missing');
        expect(input.getAttribute('aria-expanded')).toBe('true');

        form.reset();
        await flush();

        expect(input.value).toBe('Apple');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(new FormData(form).get('fruit')).toBe('apple');
    });

    it('restores the controlled selection when a form resets an active search', async () => {
        const value = ref<string | number | null>(3);
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(Combobox, {
                            ariaLabel: 'Fruit',
                            name: 'fruit',
                            modelValue: value.value,
                            options: fruitOptions,
                            'onUpdate:modelValue': (nextValue) => {
                                value.value = nextValue;
                            },
                        }),
                    ]);
                },
            }),
        );
        const form = container.querySelector('form')!;
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;
        const native = container.querySelector('select') as HTMLSelectElement;

        input.focus();
        inputValue(input, 'missing');
        await flush();

        expect(input.value).toBe('missing');
        expect(input.getAttribute('aria-expanded')).toBe('true');

        form.reset();
        await flush();

        expect(value.value).toBe(3);
        expect(input.value).toBe('Dragon Fruit');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(native.selectedIndex).toBe(3);
        expect(new FormData(form).get('fruit')).toBe('3');
    });

    it('closes and restores the selection when focus leaves the composite control', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Combobox, {
                            ariaLabel: 'Fruit',
                            modelValue: 'apple',
                            options: fruitOptions,
                        }),
                        h('button', { class: 'outside' }, 'Outside'),
                    ]);
                },
            }),
        );
        const input = container.querySelector('[role="combobox"]') as HTMLInputElement;

        input.focus();
        inputValue(input, 'dragon');
        (container.querySelector('.outside') as HTMLButtonElement).focus();

        await waitForAssertion(() => {
            expect(input.getAttribute('aria-expanded')).toBe('false');
            expect(input.value).toBe('Apple');
        });
    });

    it('applies size, radius, invalid, and disabled states', () => {
        const container = mountCombobox({
            size: 'lg',
            radius: 'xl',
            invalid: true,
            disabled: true,
        });
        const root = container.querySelector('.rp-combobox')!;
        const input = container.querySelector('input')!;

        expect(root.classList.contains('rp-combobox--size-lg')).toBe(true);
        expect(root.classList.contains('rp-combobox--radius-xl')).toBe(true);
        expect(root.hasAttribute('data-invalid')).toBe(true);
        expect(root.hasAttribute('data-disabled')).toBe(true);
        expect(input.disabled).toBe(true);
    });
});
