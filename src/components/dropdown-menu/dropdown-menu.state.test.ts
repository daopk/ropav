import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { click, keydown, mountDom } from '../../../tests/utils/vue';
import { items, waitDropdownTransition } from '../../../tests/fixtures/dropdown-menu';
import DropdownMenu from './dropdown-menu.vue';
import type { DropdownMenuSlotProps } from './types';

describe('DropdownMenu state', () => {
    it('keeps disabled menu closed and trigger non-interactive', async () => {
        const onSelect = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            disabled: true,
                            items,
                            onSelect,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        const root = container.querySelector('.rp-dropdown-menu') as HTMLElement;
        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        click(trigger);
        keydown(trigger, 'ArrowDown');
        await nextTick();

        expect(root.classList.contains('rp-dropdown-menu--disabled')).toBe(true);
        expect(trigger.disabled).toBe(true);
        expect(trigger.getAttribute('aria-controls')).toBeNull();
        expect(container.querySelector('[role="menu"]')).toBeNull();
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('closes on outside click and Escape', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { items },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        click(trigger);
        await nextTick();
        expect(container.querySelector('[role="menu"]')).not.toBeNull();

        click(document.body);
        await waitDropdownTransition();
        expect(container.querySelector('[role="menu"]')).toBeNull();

        click(trigger);
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        keydown(menu, 'Escape');
        await waitDropdownTransition();

        expect(container.querySelector('[role="menu"]')).toBeNull();
    });

    it('supports controlled open state through the update event', async () => {
        const onOpen = vi.fn();
        const container = mountDom(
            defineComponent({
                setup() {
                    const open = ref(false);

                    return () =>
                        h(
                            DropdownMenu,
                            {
                                items,
                                open: open.value,
                                'onUpdate:open': (value: boolean) => {
                                    onOpen(value);
                                    open.value = value;
                                },
                            },
                            {
                                default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                    h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                            },
                        );
                },
            }),
        );

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        click(trigger);
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        expect(menu).not.toBeNull();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');

        keydown(menu, 'Escape');
        await waitDropdownTransition();

        expect(onOpen).toHaveBeenNthCalledWith(1, true);
        expect(onOpen).toHaveBeenNthCalledWith(2, false);
        expect(container.querySelector('[role="menu"]')).toBeNull();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('blocks the outside click target in modal mode', async () => {
        const outsideClick = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { items, modal: true },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        click(container.querySelector('.trigger') as HTMLButtonElement);
        await nextTick();
        document.body.addEventListener('click', outsideClick);
        click(document.body);
        await waitDropdownTransition();

        expect(outsideClick).not.toHaveBeenCalled();
        expect(container.querySelector('[role="menu"]')).toBeNull();
        document.body.removeEventListener('click', outsideClick);
    });
});
