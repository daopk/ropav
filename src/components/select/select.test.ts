import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';

import { click, keydown, keyEvent, mountDom } from '../../../tests/utils/vue';
import Select from './select.vue';
import { useSelect } from './useSelect';
import type { SelectProps } from './types';

describe('Select', () => {
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
});
