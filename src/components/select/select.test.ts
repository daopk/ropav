import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';

import {
    click,
    flush,
    keydown,
    keyEvent,
    mountDom,
    waitTransition,
} from '../../../tests/utils/vue';
import Select from './select.vue';
import { useSelect } from './useSelect';
import type { SelectProps } from './types';

function setGeometry(
    element: HTMLElement,
    geometry: Partial<Record<'clientHeight' | 'scrollHeight', number>>,
) {
    for (const [name, value] of Object.entries(geometry)) {
        Object.defineProperty(element, name, { configurable: true, value });
    }
}

describe('Select', () => {
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    it('keeps state handlers testable without rendering the full component', async () => {
        const props = reactive<SelectProps>({
            ariaLabel: 'Test select',
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

    it('uses labelledby as its accessible naming source', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        labelledby: 'fruit-label',
                        modelValue: null,
                        options: [{ label: 'Apple', value: 'apple' }],
                    });
                },
            }),
        );

        await flush();

        const trigger = container.querySelector('[role="combobox"]')!;
        expect(trigger.getAttribute('aria-label')).toBeNull();
        expect(trigger.getAttribute('aria-labelledby')).toBe('fruit-label');
    });

    it('navigates options with disabled items skipped', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
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

    it('commits closed typeahead matches without opening and cycles in controlled mode', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
                        modelValue: null,
                        options: [
                            { label: 'Apple', value: 'apple' },
                            { label: 'Avocado', value: 'avocado', disabled: true },
                            { label: 'Apricot', value: 'apricot' },
                        ],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const trigger = container.querySelector('[role="combobox"]')!;
        keydown(trigger, 'a');
        keydown(trigger, 'a');
        keydown(trigger, 'a');
        await nextTick();

        expect(onUpdate.mock.calls.map(([value]) => value)).toEqual(['apple', 'apricot', 'apple']);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(trigger.getAttribute('aria-activedescendant')).toBeNull();
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('only highlights open typeahead matches until they are committed', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
                        modelValue: null,
                        options: [
                            { label: 'Alpha', value: 'alpha' },
                            { label: 'Beta', value: 'beta', disabled: true },
                            { label: 'Gamma', value: 'gamma' },
                        ],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const trigger = container.querySelector('[role="combobox"]')!;
        keydown(trigger, 'ArrowDown');
        await nextTick();
        keydown(trigger, 'g');
        await nextTick();

        expect(container.querySelector('[role="option"][data-highlighted]')?.textContent).toBe(
            'Gamma',
        );
        expect(onUpdate).not.toHaveBeenCalled();

        keydown(trigger, 'Enter');
        await waitTransition();
        expect(onUpdate).toHaveBeenCalledWith('gamma');
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('keeps the highlighted option stable when options are reordered', async () => {
        const state = reactive<SelectProps>({
            ariaLabel: 'Test select',
            modelValue: 'gamma',
            options: [
                { label: 'Alpha', value: 'alpha' },
                { label: 'Gamma', value: 'gamma' },
            ],
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
                        modelValue: state.modelValue,
                        options: state.options,
                    });
                },
            }),
        );

        const trigger = container.querySelector('[role="combobox"]')!;
        keydown(trigger, 'ArrowDown');
        await nextTick();
        state.options = [
            { label: 'Gamma', value: 'gamma' },
            { label: 'Alpha', value: 'alpha' },
        ];
        await nextTick();

        expect(container.querySelector('[role="option"][data-highlighted]')?.textContent).toBe(
            'Gamma',
        );
    });

    it('ignores unmatched and disabled closed typeahead options', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
                        modelValue: null,
                        options: [{ label: 'Beta', value: 'beta', disabled: true }],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const trigger = container.querySelector('[role="combobox"]')!;
        keydown(trigger, 'b');
        keydown(trigger, 'z');
        await nextTick();

        expect(onUpdate).not.toHaveBeenCalled();
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('resets closed typeahead after Escape and focus leaves the control', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Select, {
                            ariaLabel: 'Test select',
                            modelValue: null,
                            options: [
                                { label: 'Beta', value: 'beta' },
                                { label: 'Bravo', value: 'bravo' },
                            ],
                            'onUpdate:modelValue': onUpdate,
                        }),
                        h('button', { class: 'next-control' }, 'Next'),
                    ]);
                },
            }),
        );

        const trigger = container.querySelector('[role="combobox"]') as HTMLElement;
        trigger.focus();
        keydown(trigger, 'b');
        keydown(trigger, 'Escape');
        keydown(trigger, 'b');

        (container.querySelector('.next-control') as HTMLButtonElement).focus();
        trigger.focus();
        keydown(trigger, 'b');
        await nextTick();

        expect(onUpdate.mock.calls.map(([value]) => value)).toEqual(['beta', 'beta', 'beta']);
    });

    it('scrolls the selected option into view when opened', async () => {
        const scrollIntoView = vi.fn();
        const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
        HTMLElement.prototype.scrollIntoView = scrollIntoView;

        try {
            const options = Array.from({ length: 20 }, (_, index) => ({
                label: `Option ${index + 1}`,
                value: index + 1,
            }));
            const container = mountDom(
                defineComponent({
                    render() {
                        return h(Select, { ariaLabel: 'Test select', modelValue: 20, options });
                    },
                }),
            );

            click(container.querySelector('[role="combobox"]')!);
            await nextTick();
            await nextTick();

            expect(container.querySelector('[role="option"][data-highlighted]')?.textContent).toBe(
                'Option 20',
            );
            expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
        } finally {
            HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
        }
    });

    it('uses an embedded vertical ScrollArea for the dropdown', async () => {
        const options = Array.from({ length: 20 }, (_, index) => ({
            label: `Option ${index + 1}`,
            value: index + 1,
        }));
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
                        id: 'fruit-select',
                        modelValue: null,
                        options,
                        classNames: { content: 'custom-dropdown' },
                        styles: { content: { maxHeight: '120px' } },
                    });
                },
            }),
        );

        const trigger = container.querySelector('[role="combobox"]') as HTMLElement;
        trigger.focus();
        click(trigger);
        await flush();

        const popup = container.querySelector('.rp-scroll-area') as HTMLElement;
        const listbox = popup.querySelector('[role="listbox"]') as HTMLElement;
        const viewport = popup.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const content = listbox.querySelector('.rp-scroll-area__content') as HTMLElement;
        const scrollbar = popup.querySelector(
            '.rp-scroll-area__scrollbar--vertical',
        ) as HTMLElement;

        expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);
        expect(document.activeElement).toBe(trigger);
        expect(listbox).toBe(viewport);
        expect(popup.getAttribute('role')).toBeNull();
        expect(popup.classList.contains('custom-dropdown')).toBe(true);
        expect(popup.dataset.type).toBe('auto');
        expect(popup.dataset.scrollbars).toBe('y');
        expect(popup.style.maxHeight).toBe('120px');
        expect(listbox.tabIndex).toBe(-1);
        expect(content.querySelectorAll('[role="option"]')).toHaveLength(options.length);
        expect(scrollbar.tabIndex).toBe(-1);
        expect(scrollbar.getAttribute('aria-hidden')).toBe('true');
        expect(popup.querySelector('.rp-scroll-area__scrollbar--horizontal')).toBeNull();

        setGeometry(viewport, { clientHeight: 120, scrollHeight: 320 });
        viewport.scrollTop = 40;
        viewport.dispatchEvent(new Event('scroll'));
        await flush();

        expect(popup).toHaveProperty('dataset.overflowY', '');
        expect(viewport.scrollTop).toBe(40);
    });

    it('closes the dropdown when focus leaves the select', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Select, {
                            ariaLabel: 'Test select',
                            modelValue: 'a',
                            options: [
                                { label: 'Alpha', value: 'a' },
                                { label: 'Beta', value: 'b' },
                            ],
                        }),
                        h('button', { class: 'next-control' }, 'Next control'),
                    ]);
                },
            }),
        );

        const trigger = container.querySelector('[role="combobox"]') as HTMLElement;
        trigger.focus();
        keydown(trigger, 'ArrowDown');
        await nextTick();

        expect(trigger.getAttribute('aria-expanded')).toBe('true');

        (container.querySelector('.next-control') as HTMLButtonElement).focus();
        await waitTransition();

        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('keeps disabled select closed and non-interactive', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
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
                        ariaLabel: 'Test select',
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
        expect(clear.getAttribute('aria-label')).toBe('Clear selection');

        click(clear);
        await nextTick();

        expect(onUpdate).toHaveBeenCalledWith(null);
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('uses a custom clear label for the clear control', () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
                        clearable: true,
                        clearLabel: 'Remove fruit',
                        modelValue: 'a',
                        options: [
                            { label: 'Alpha', value: 'a' },
                            { label: 'Beta', value: 'b' },
                        ],
                    });
                },
            }),
        );

        const clear = container.querySelector('.rp-select__clear')!;
        expect(clear.getAttribute('aria-label')).toBe('Remove fruit');
    });

    it('clears the selected value from the trigger with Delete', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
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

        const trigger = container.querySelector('[role="combobox"]')!;
        keydown(trigger, 'Delete');
        await nextTick();

        expect(onUpdate).toHaveBeenCalledWith(null);
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('clears and closes the selected value from the trigger with Backspace', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Select, {
                        ariaLabel: 'Test select',
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

        const trigger = container.querySelector('[role="combobox"]')!;
        keydown(trigger, 'ArrowDown');
        await nextTick();
        expect(container.querySelector('[role="listbox"]')).not.toBeNull();

        keydown(trigger, 'Backspace');
        await waitTransition();

        expect(onUpdate).toHaveBeenCalledWith(null);
        expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('only renders the clear control when clearable has a value and is enabled', () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Select, {
                            ariaLabel: 'Test select',
                            clearable: true,
                            modelValue: null,
                            options: [{ label: 'Alpha', value: 'a' }],
                        }),
                        h(Select, {
                            ariaLabel: 'Test select',
                            clearable: true,
                            disabled: true,
                            modelValue: 'a',
                            options: [{ label: 'Alpha', value: 'a' }],
                        }),
                        h(Select, {
                            ariaLabel: 'Test select',
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
                                ariaLabel: 'Test select',
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

    it('adds a size modifier for each supported size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        sizes.map((size) =>
                            h(Select, {
                                ariaLabel: 'Test select',
                                modelValue: size,
                                options: [{ label: size, value: size }],
                                size,
                            }),
                        ),
                    );
                },
            }),
        );

        const roots = [...container.querySelectorAll('.rp-select')];

        expect(roots).toHaveLength(sizes.length);
        for (const [index, size] of sizes.entries()) {
            expect([...roots[index].classList]).toEqual(['rp-select', `rp-select--size-${size}`]);
        }
    });
});
