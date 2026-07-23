import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { click, keydown, mountDom, queryDom } from '../../../tests/utils/vue';
import {
    DropdownMenuContent,
    DropdownMenuItem as DropdownMenuItemPrimitive,
    DropdownMenuRoot,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from './dropdown-menu-primitives';
import DropdownMenu from './dropdown-menu.vue';
import type { DropdownMenuInteractOutsideEvent, DropdownMenuSlotProps } from './types';

async function flush() {
    await nextTick();
    await nextTick();
}

describe('DropdownMenu interaction runtime regressions', () => {
    it('opens a submenu whose content mounts only after its state opens', async () => {
        const container = mountDom(
            defineComponent({
                setup() {
                    return () =>
                        h(
                            DropdownMenuRoot,
                            { defaultOpen: true, modal: false },
                            {
                                default: () =>
                                    h(
                                        DropdownMenuContent,
                                        { id: 'lazy-root-menu', flip: false, shift: false },
                                        () =>
                                            h(
                                                DropdownMenuSub,
                                                {},
                                                {
                                                    default: ({ isOpen }: { isOpen: boolean }) => [
                                                        h(
                                                            DropdownMenuSubTrigger,
                                                            { id: 'lazy-submenu-trigger' },
                                                            () => 'Lazy submenu',
                                                        ),
                                                        isOpen
                                                            ? h(
                                                                  DropdownMenuSubContent,
                                                                  {
                                                                      id: 'lazy-submenu-content',
                                                                      flip: false,
                                                                      shift: false,
                                                                  },
                                                                  () =>
                                                                      h(
                                                                          DropdownMenuItemPrimitive,
                                                                          {},
                                                                          () => 'Child action',
                                                                      ),
                                                              )
                                                            : null,
                                                    ],
                                                },
                                            ),
                                    ),
                            },
                        );
                },
            }),
        );
        await flush();

        const trigger = container.querySelector('#lazy-submenu-trigger') as HTMLElement;
        expect(trigger.getAttribute('aria-expanded')).toBe('false');

        click(trigger);
        await flush();

        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(queryDom(container, '#lazy-submenu-content')).not.toBeNull();
    });

    it('restores canceled modal focus outside to the data menu focus owner', async () => {
        const onFocusOutside = vi.fn((event: DropdownMenuInteractOutsideEvent) => {
            event.preventDefault();
        });
        const container = mountDom(
            defineComponent({
                setup() {
                    return () =>
                        h('div', [
                            h(
                                DropdownMenu,
                                {
                                    id: 'focus-owner-menu',
                                    modal: true,
                                    teleport: false,
                                    items: [
                                        {
                                            label: 'Move to',
                                            value: 'move',
                                            children: [{ label: 'Backlog', value: 'backlog' }],
                                        },
                                    ],
                                    onFocusOutside,
                                },
                                {
                                    default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                        h(
                                            'button',
                                            { class: 'focus-owner-trigger', ...triggerProps },
                                            'Actions',
                                        ),
                                },
                            ),
                            h('button', { class: 'outside-focus-target' }, 'Outside'),
                        ]);
                },
            }),
        );

        click(container.querySelector('.focus-owner-trigger') as HTMLElement);
        await flush();
        const menu = container.querySelector('#focus-owner-menu') as HTMLElement;
        keydown(menu, 'ArrowRight');
        await flush();
        expect(container.querySelector('#focus-owner-menu-submenu-0')).not.toBeNull();
        expect(document.activeElement).toBe(menu);

        const outside = container.querySelector('.outside-focus-target') as HTMLElement;
        outside.focus();
        await flush();

        expect(onFocusOutside).toHaveBeenCalledOnce();
        expect(document.activeElement).toBe(menu);
    });
});
