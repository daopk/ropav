import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { click, mountDom } from '../../../tests/utils/vue';
import VaporForwardingButton from './dropdown-menu-forwarding-button.test.vue';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuTrigger,
} from './dropdown-menu-primitives';
import VaporSlotWrapper from './dropdown-menu-slot-wrapper.test.vue';

const VdomSlotWrapper = defineComponent({
    name: 'DropdownMenuVdomSlotWrapper',
    setup(_props, { slots }) {
        return () => slots.default?.();
    },
});

function throughSlotWrappers(defaultSlot: () => unknown) {
    return h(VdomSlotWrapper, null, {
        default: () => h(VaporSlotWrapper, null, { default: defaultSlot }),
    });
}

describe('DropdownMenu composition contracts', () => {
    it('preserves injected contexts through nested VDOM and Vapor slots into a custom portal target', async () => {
        const portalTarget = document.createElement('div');
        portalTarget.className = 'menu-portal-target';
        document.body.append(portalTarget);

        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenuRoot,
                        { modal: false },
                        {
                            default: () =>
                                throughSlotWrappers(() => [
                                    h(
                                        DropdownMenuTrigger,
                                        { class: 'nested-trigger' },
                                        () => 'Actions',
                                    ),
                                    h(
                                        DropdownMenuPortal,
                                        { to: portalTarget },
                                        {
                                            default: () =>
                                                throughSlotWrappers(() =>
                                                    h(
                                                        DropdownMenuContent,
                                                        { flip: false, shift: false },
                                                        {
                                                            default: () =>
                                                                throughSlotWrappers(() =>
                                                                    h(
                                                                        DropdownMenuItem,
                                                                        { class: 'nested-item' },
                                                                        () => 'Rename',
                                                                    ),
                                                                ),
                                                        },
                                                    ),
                                                ),
                                        },
                                    ),
                                ]),
                        },
                    );
                },
            }),
        );

        const trigger = container.querySelector('.nested-trigger') as HTMLButtonElement;
        click(trigger);
        await nextTick();
        await nextTick();

        const menu = portalTarget.querySelector('[role="menu"]') as HTMLElement;
        const item = portalTarget.querySelector('.nested-item') as HTMLButtonElement;
        expect(container.querySelector('[role="menu"]')).toBeNull();
        expect(menu).not.toBeNull();
        expect(item.getAttribute('role')).toBe('menuitem');
        expect(trigger.getAttribute('aria-controls')).toBe(menu.id);
        expect(menu.getAttribute('aria-activedescendant')).toBe(item.id);

        click(item);
        await nextTick();

        expect(portalTarget.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });

    it('uses a Vapor custom component as the trigger and item host without extra DOM wrappers', async () => {
        const onSelect = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenuRoot,
                        { modal: false },
                        {
                            default: () => [
                                h(
                                    DropdownMenuTrigger,
                                    {
                                        as: VaporForwardingButton,
                                        class: 'custom-trigger',
                                        'data-consumer': 'trigger',
                                    },
                                    () => 'Open',
                                ),
                                h(
                                    DropdownMenuContent,
                                    { flip: false, shift: false },
                                    {
                                        default: () =>
                                            h(
                                                DropdownMenuItem,
                                                {
                                                    as: VaporForwardingButton,
                                                    class: 'custom-item',
                                                    'data-consumer': 'item',
                                                    onSelect,
                                                },
                                                () => 'Archive',
                                            ),
                                    },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        const trigger = container.querySelector('.custom-trigger') as HTMLButtonElement;
        expect(trigger.tagName).toBe('BUTTON');
        expect(trigger.dataset.consumer).toBe('trigger');

        await nextTick();
        click(trigger);
        await nextTick();
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        const item = container.querySelector('.custom-item') as HTMLButtonElement;
        expect(item.tagName).toBe('BUTTON');
        expect(item.dataset.consumer).toBe('item');
        expect(item.getAttribute('role')).toBe('menuitem');
        expect(menu.getAttribute('aria-activedescendant')).toBe(item.id);

        click(item);
        await nextTick();

        expect(onSelect).toHaveBeenCalledOnce();
        expect(container.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });
});
