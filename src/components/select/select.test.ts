import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';

import { click, keydown, keyEvent, mountDom } from '../../../tests/utils/vue';
import Select from './select.vue';
import { useSelect } from './useSelect';
import type { SelectProps } from './types';

describe('Select', () => {
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    it('keeps state handlers testable without rendering the full component', async () => {
        const props = reactive<SelectProps>({
            modelValue: null,
            options: [
                { label: 'Alpha', value: 'a' },
                { label: 'Beta', value: 'b', disabled: true },
                { label: 'Gamma', value: 'c' },
            ],
        });
        const updates: Array<string | number | null> = [];
        let select!: ReturnType<typeof useSelect>;

        mountDom(
            defineComponent({
                setup() {
                    select = useSelect(props, (value) => updates.push(value));
                    return () => h('div');
                },
            }),
        );

        select.onTriggerKeydown(keyEvent('ArrowDown'));
        await nextTick();
        expect(select.isOpen.value).toBe(true);
        expect(select.focusedIndex.value).toBe(0);

        select.onTriggerKeydown(keyEvent('ArrowDown'));
        select.onTriggerKeydown(keyEvent('Enter'));
        expect(updates).toContain('c');

        select.onTriggerKeydown(keyEvent('Escape'));
        expect(select.focusedIndex.value).toBe(-1);
    });

    it('navigates options with disabled items skipped', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        modelValue: null,
                        options: [
                            { label: 'Alpha', value: 'a' },
                            { label: 'Beta', value: 'b', disabled: true },
                            { label: 'Gamma', value: 'c' },
                        ],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const trigger = container.querySelector('[role="combobox"]')!;
        keydown(trigger, 'ArrowDown');
        await nextTick();
        keydown(trigger, 'ArrowDown');
        await nextTick();
        keydown(trigger, 'Enter');
        await nextTick();

        expect(onUpdate).toHaveBeenCalledWith('c');
    });

    it('keeps disabled select closed and non-interactive', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        disabled: true,
                        modelValue: null,
                        options: [
                            { label: 'Alpha', value: 'a' },
                            { label: 'Beta', value: 'b' },
                        ],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const trigger = container.querySelector('[role="combobox"]')!;
        click(trigger);
        await nextTick();
        keydown(trigger, 'ArrowDown');
        await nextTick();

        expect(trigger.getAttribute('aria-disabled')).toBe('true');
        expect(trigger.getAttribute('tabindex')).toBe('-1');
        expect(container.querySelector('[role="listbox"]')).toBeNull();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('clears the selected value without toggling the dropdown', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        clearable: true,
                        modelValue: 'a',
                        options: [
                            { label: 'Alpha', value: 'a' },
                            { label: 'Beta', value: 'b' },
                        ],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const clear = container.querySelector('.rp-select__clear')!;
        click(clear);
        await nextTick();

        expect(onUpdate).toHaveBeenCalledWith(null);
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('only renders the clear control when clearable has a value and is enabled', () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Select, {
                            clearable: true,
                            modelValue: null,
                            options: [{ label: 'Alpha', value: 'a' }],
                        }),
                        h(Select, {
                            clearable: true,
                            disabled: true,
                            modelValue: 'a',
                            options: [{ label: 'Alpha', value: 'a' }],
                        }),
                        h(Select, {
                            clearable: true,
                            modelValue: 'a',
                            options: [{ label: 'Alpha', value: 'a' }],
                        }),
                    ]);
                },
            }),
        );

        expect(container.querySelectorAll('.rp-select__clear')).toHaveLength(1);
    });

    it('adds a radius modifier for each supported radius', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        radii.map((radius) =>
                            h(Select, {
                                modelValue: radius,
                                options: [{ label: radius, value: radius }],
                                radius,
                            }),
                        ),
                    );
                },
            }),
        );

        const roots = [...container.querySelectorAll('.rp-select')];

        expect(roots).toHaveLength(radii.length);
        for (const [index, radius] of radii.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-select',
                `rp-select--radius-${radius}`,
            ]);
        }
    });
});
