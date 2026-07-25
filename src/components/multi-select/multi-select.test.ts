import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';

import { click, flush, input, keydown, keyEvent, mountDom } from '../../../tests/utils/vue';
import MultiSelect from './multi-select.vue';
import type { MultiSelectProps, MultiSelectValue } from './types';

const options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Dragon Fruit', value: 2 },
    { label: 'Pear', value: 'pear', disabled: true },
];

function mountMultiSelect(props: MultiSelectProps = {}, listeners: Record<string, unknown> = {}) {
    return mountDom(
        defineComponent({
            render() {
                return h(MultiSelect, {
                    ariaLabel: 'Fruit',
                    options,
                    ...props,
                    ...listeners,
                });
            },
        }),
    );
}

describe('MultiSelect', () => {
    it('selects multiple values, renders pills, and keeps the listbox open', async () => {
        const onUpdate = vi.fn();
        const container = mountMultiSelect(
            { defaultValue: [] },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        const inputElement = container.querySelector('[role="combobox"]') as HTMLInputElement;
        click(inputElement);
        await flush();

        const listbox = container.querySelector('[role="listbox"]')!;
        expect(listbox.getAttribute('aria-multiselectable')).toBe('true');

        click([...container.querySelectorAll('[role="option"]')][2]!);
        await flush();
        click(container.querySelector('[role="option"]')!);
        await flush();

        expect(onUpdate.mock.calls.map(([value]) => value)).toEqual([[2], [2, 'apple']]);
        expect(
            [...container.querySelectorAll('.rp-multi-select__pill-label')].map((pill) =>
                pill.textContent?.trim(),
            ),
        ).toEqual(['Dragon Fruit', 'Apple']);
        expect(container.querySelector('[role="listbox"]')).not.toBeNull();
    });

    it('preserves selected values that are absent from the current options', async () => {
        const onUpdate = vi.fn();
        const container = mountMultiSelect(
            { defaultValue: ['remote'] },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        click(container.querySelector('[role="combobox"]')!);
        await flush();
        click([...container.querySelectorAll('[role="option"]')][2]!);
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith(['remote', 2]);
        expect(container.querySelector('.rp-multi-select__pill-label')?.textContent?.trim()).toBe(
            'Dragon Fruit',
        );
    });

    it('filters options and emits the current search value', async () => {
        const onSearch = vi.fn();
        const container = mountMultiSelect({}, { onSearch });
        await flush();

        const inputElement = container.querySelector('[role="combobox"]') as HTMLInputElement;
        input(inputElement, 'dragon');
        await flush();

        expect(onSearch).toHaveBeenCalledWith('dragon');
        expect(
            [...container.querySelectorAll('[role="option"]')].map((option) =>
                option.textContent?.trim(),
            ),
        ).toEqual(['Dragon Fruit']);
    });

    it('supports keyboard selection and Backspace removal', async () => {
        const onUpdate = vi.fn();
        const container = mountMultiSelect(
            { defaultValue: ['apple'] },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        const inputElement = container.querySelector('[role="combobox"]') as HTMLInputElement;
        keydown(inputElement, 'ArrowDown');
        await flush();
        keydown(inputElement, 'ArrowDown');
        keydown(inputElement, 'Enter');
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith(['apple', 'banana']);
        const highlightedOption = container.querySelector(
            '[role="option"][data-highlighted]',
        ) as HTMLElement;
        expect(highlightedOption.textContent?.trim()).toBe('Banana');
        expect(inputElement.getAttribute('aria-activedescendant')).toBe(highlightedOption.id);

        keydown(inputElement, 'Backspace');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith(['apple']);
    });

    it('highlights enabled options that arrive after a remote search', async () => {
        const state = reactive<{
            modelValue: MultiSelectValue[];
            options: MultiSelectProps['options'];
        }>({
            modelValue: [],
            options: [],
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(MultiSelect, {
                        ariaLabel: 'Fruit',
                        filter: false,
                        modelValue: state.modelValue,
                        options: state.options,
                        'onUpdate:modelValue': (value) => {
                            state.modelValue = value;
                        },
                    });
                },
            }),
        );
        await flush();

        const inputElement = container.querySelector('[role="combobox"]') as HTMLInputElement;
        input(inputElement, 'dragon');
        await flush();

        state.options = [
            { label: 'Unavailable', value: 1, disabled: true },
            { label: 'Dragon Fruit', value: 3 },
        ];
        await flush();

        const highlightedOption = container.querySelector(
            '[role="option"][data-highlighted]',
        ) as HTMLElement;
        expect(highlightedOption.textContent?.trim()).toBe('Dragon Fruit');
        expect(inputElement.getAttribute('aria-activedescendant')).toBe(highlightedOption.id);

        keydown(inputElement, 'Enter');
        await flush();
        expect(state.modelValue).toEqual([3]);
    });

    it('leaves Home and End available for text editing', async () => {
        const container = mountMultiSelect();
        await flush();

        const inputElement = container.querySelector('[role="combobox"]') as HTMLInputElement;
        input(inputElement, 'a');
        await flush();
        keydown(inputElement, 'ArrowDown');
        await flush();

        const highlightedOption = () =>
            container.querySelector('[role="option"][data-highlighted]') as HTMLElement;
        expect(highlightedOption().textContent?.trim()).toBe('Banana');

        const homeEvent = keyEvent('Home');
        inputElement.dispatchEvent(homeEvent);
        expect(homeEvent.defaultPrevented).toBe(false);
        expect(highlightedOption().textContent?.trim()).toBe('Banana');

        const endEvent = keyEvent('End');
        inputElement.dispatchEvent(endEvent);
        expect(endEvent.defaultPrevented).toBe(false);
        expect(highlightedOption().textContent?.trim()).toBe('Banana');
    });

    it('reopens from the control body after Escape leaves the input focused', async () => {
        const container = mountMultiSelect({ defaultValue: ['apple'] });
        await flush();

        const inputElement = container.querySelector('[role="combobox"]') as HTMLInputElement;
        inputElement.focus();
        await flush();
        keydown(inputElement, 'Escape');
        await flush();

        expect(inputElement.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(inputElement);

        container
            .querySelector('.rp-multi-select__pills')!
            .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await flush();

        expect(inputElement.getAttribute('aria-expanded')).toBe('true');
        expect(container.querySelector('[role="listbox"]')).not.toBeNull();
    });

    it('disables unselected options at maxValues and skips disabled options', async () => {
        const container = mountMultiSelect({
            defaultValue: ['apple'],
            maxValues: 1,
        });
        await flush();

        click(container.querySelector('[role="combobox"]')!);
        await flush();

        const optionElements = [...container.querySelectorAll('[role="option"]')];
        expect(optionElements[0]!.getAttribute('aria-disabled')).toBeNull();
        expect(optionElements[1]!.getAttribute('aria-disabled')).toBe('true');
        expect(optionElements[3]!.getAttribute('aria-disabled')).toBe('true');
    });

    it('submits typed values and resets an uncontrolled selection', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        h(MultiSelect, {
                            ariaLabel: 'Fruit',
                            name: 'fruit',
                            options,
                            defaultValue: ['apple'],
                        }),
                    );
                },
            }),
        );
        await flush();

        click(container.querySelector('[role="combobox"]')!);
        await flush();
        click([...container.querySelectorAll('[role="option"]')][2]!);
        await flush();

        const form = container.querySelector('form')!;
        expect(new FormData(form).getAll('fruit')).toEqual(['apple', '2']);

        const inputElement = container.querySelector('[role="combobox"]') as HTMLInputElement;
        input(inputElement, 'dragon');
        await flush();
        expect(inputElement.value).toBe('dragon');
        expect(inputElement.getAttribute('aria-expanded')).toBe('true');

        form.reset();
        await Promise.resolve();
        await flush();

        expect(new FormData(form).getAll('fruit')).toEqual(['apple']);
        expect(container.querySelectorAll('.rp-multi-select__pill')).toHaveLength(1);
        expect(inputElement.value).toBe('');
        expect(inputElement.getAttribute('aria-expanded')).toBe('false');
    });

    it('forwards accessible naming and validation to the visible and native controls', async () => {
        const container = mountMultiSelect({
            labelledby: 'fruit-label',
            required: true,
        });
        await flush();

        const inputElement = container.querySelector('[role="combobox"]') as HTMLInputElement;
        const nativeSelect = container.querySelector(
            '.rp-multi-select__native',
        ) as HTMLSelectElement;

        expect(inputElement.getAttribute('aria-label')).toBeNull();
        expect(inputElement.getAttribute('aria-labelledby')).toBe('fruit-label');
        expect(inputElement.getAttribute('aria-required')).toBe('true');
        expect(nativeSelect.validity.valueMissing).toBe(true);
    });
});
