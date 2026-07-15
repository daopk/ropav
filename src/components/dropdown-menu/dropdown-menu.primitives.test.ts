import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { click, keydown, mountDom } from '../../../tests/utils/vue';
import {
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuContextTrigger,
    DropdownMenuItem,
    DropdownMenuItemIndicator,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuRoot,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from './dropdown-menu-primitives';
import type { DropdownMenuSelectEvent } from './types';

function mountBasicMenu(onSelect?: (event: DropdownMenuSelectEvent) => void) {
    return mountDom(
        defineComponent({
            render() {
                return h(
                    DropdownMenuRoot,
                    { modal: false },
                    {
                        default: () => [
                            h(DropdownMenuTrigger, { class: 'trigger' }, () => 'Actions'),
                            h(DropdownMenuContent, { avoidCollisions: false }, () =>
                                h(DropdownMenuItem, { class: 'item', onSelect }, () => 'Rename'),
                            ),
                        ],
                    },
                );
            },
        }),
    );
}

describe('DropdownMenu compound primitives', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('wires trigger/content ARIA and closes after selecting an item', async () => {
        const onSelect = vi.fn();
        const container = mountBasicMenu(onSelect);
        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        click(trigger);
        await nextTick();
        await nextTick();

        const content = container.querySelector('[role="menu"]') as HTMLElement;
        const item = container.querySelector('[role="menuitem"]') as HTMLButtonElement;
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(trigger.getAttribute('aria-controls')).toBe(content.id);
        expect([
            content.getAttribute('aria-activedescendant'),
            item.getAttribute('data-focused'),
        ]).toEqual([item.id, 'true']);

        click(item);
        await nextTick();

        expect(onSelect).toHaveBeenCalledOnce();
        expect(onSelect.mock.calls[0]?.[0]).toBeInstanceOf(CustomEvent);
        expect(container.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });

    it('supports controlled open state and disabled roots', async () => {
        const updates = vi.fn();
        const container = mountDom(
            defineComponent({
                setup() {
                    const open = ref(false);
                    return () => [
                        h(
                            DropdownMenuRoot,
                            {
                                open: open.value,
                                modal: false,
                                'onUpdate:open': (value: boolean) => {
                                    updates(value);
                                    open.value = value;
                                },
                            },
                            {
                                default: () => [
                                    h(
                                        DropdownMenuTrigger,
                                        { class: 'controlled-trigger' },
                                        () => 'Controlled',
                                    ),
                                    h(DropdownMenuContent, { avoidCollisions: false }, () =>
                                        h(DropdownMenuItem, null, () => 'Action'),
                                    ),
                                ],
                            },
                        ),
                        h(
                            DropdownMenuRoot,
                            { disabled: true },
                            {
                                default: () => [
                                    h(
                                        DropdownMenuTrigger,
                                        { class: 'disabled-trigger' },
                                        () => 'Disabled',
                                    ),
                                    h(DropdownMenuContent, null, () =>
                                        h(DropdownMenuItem, null, () => 'Unavailable'),
                                    ),
                                ],
                            },
                        ),
                    ];
                },
            }),
        );

        click(container.querySelector('.controlled-trigger') as HTMLButtonElement);
        await nextTick();
        const content = container.querySelector('[role="menu"]') as HTMLElement;
        expect(updates).toHaveBeenNthCalledWith(1, true);
        keydown(content, 'Escape');
        await nextTick();
        expect(updates).toHaveBeenNthCalledWith(2, false);

        const disabled = container.querySelector('.disabled-trigger') as HTMLButtonElement;
        expect(disabled.disabled).toBe(true);
        click(disabled);
        await nextTick();
        expect(container.querySelector('[role="menu"]')).toBeNull();
    });

    it('keeps the menu open when select is canceled', async () => {
        const container = mountBasicMenu((event) => event.preventDefault());
        click(container.querySelector('.trigger') as HTMLButtonElement);
        await nextTick();

        click(container.querySelector('.item') as HTMLButtonElement);
        await nextTick();

        expect(container.querySelector('[role="menu"]')).not.toBeNull();
    });

    it('teleports content through Portal and preserves injected context', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DropdownMenuRoot, null, {
                        default: () => [
                            h(DropdownMenuTrigger, { class: 'portal-trigger' }, () => 'Open'),
                            h(DropdownMenuPortal, null, {
                                default: () =>
                                    h(DropdownMenuContent, null, {
                                        default: () => h(DropdownMenuItem, null, () => 'Portalled'),
                                    }),
                            }),
                        ],
                    });
                },
            }),
        );

        click(container.querySelector('.portal-trigger') as HTMLButtonElement);
        await nextTick();

        expect(container.querySelector('[role="menu"]')).toBeNull();
        expect(document.body.querySelector('[role="menu"]')?.textContent).toContain('Portalled');
    });

    it('updates checkbox and radio state while keeping the menu open', async () => {
        const container = mountDom(
            defineComponent({
                setup() {
                    const radio = ref<string | number | null>('one');
                    return () =>
                        h(
                            DropdownMenuRoot,
                            { defaultOpen: true, modal: false },
                            {
                                default: () =>
                                    h(
                                        DropdownMenuContent,
                                        { avoidCollisions: false },
                                        {
                                            default: () => [
                                                h(
                                                    DropdownMenuCheckboxItem,
                                                    { class: 'checkbox', defaultValue: false },
                                                    {
                                                        default: () => [
                                                            h(
                                                                DropdownMenuItemIndicator,
                                                                null,
                                                                () => '✓',
                                                            ),
                                                            'Notifications',
                                                        ],
                                                    },
                                                ),
                                                h(
                                                    DropdownMenuRadioGroup,
                                                    {
                                                        modelValue: radio.value,
                                                        'onUpdate:modelValue': (value) => {
                                                            radio.value = value;
                                                        },
                                                    },
                                                    {
                                                        default: () => [
                                                            h(
                                                                DropdownMenuRadioItem,
                                                                { value: 'one' },
                                                                () => 'One',
                                                            ),
                                                            h(
                                                                DropdownMenuRadioItem,
                                                                {
                                                                    class: 'radio-two',
                                                                    value: 'two',
                                                                },
                                                                () => 'Two',
                                                            ),
                                                        ],
                                                    },
                                                ),
                                            ],
                                        },
                                    ),
                            },
                        );
                },
            }),
        );
        await nextTick();

        const checkbox = container.querySelector('.checkbox') as HTMLButtonElement;
        click(checkbox);
        await nextTick();
        expect(checkbox.getAttribute('aria-checked')).toBe('true');
        expect(checkbox.textContent).toContain('✓');

        const radio = container.querySelector('.radio-two') as HTMLButtonElement;
        click(radio);
        await nextTick();
        expect(radio.getAttribute('aria-checked')).toBe('true');
        expect(container.querySelector('[role="menu"]')).not.toBeNull();
    });

    it('navigates a submenu with horizontal keys', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenuRoot,
                        { defaultOpen: true, modal: false },
                        {
                            default: () =>
                                h(
                                    DropdownMenuContent,
                                    { avoidCollisions: false },
                                    {
                                        default: () =>
                                            h(DropdownMenuSub, null, {
                                                default: () => [
                                                    h(
                                                        DropdownMenuSubTrigger,
                                                        null,
                                                        () => 'Move to',
                                                    ),
                                                    h(
                                                        DropdownMenuSubContent,
                                                        { avoidCollisions: false },
                                                        () =>
                                                            h(
                                                                DropdownMenuItem,
                                                                null,
                                                                () => 'Backlog',
                                                            ),
                                                    ),
                                                ],
                                            }),
                                    },
                                ),
                        },
                    );
                },
            }),
        );
        await nextTick();

        const content = container.querySelector('[role="menu"]') as HTMLElement;
        keydown(content, 'ArrowRight');
        await nextTick();
        expect(container.querySelectorAll('[role="menu"]')).toHaveLength(2);

        const submenu = container.querySelectorAll('[role="menu"]')[1] as HTMLElement;
        keydown(submenu, 'ArrowLeft');
        await nextTick();
        expect(container.querySelectorAll('[role="menu"]')).toHaveLength(1);
    });

    it('opens a context trigger at a virtual point with keyboard input', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenuRoot,
                        { modal: false },
                        {
                            default: () => [
                                h(
                                    DropdownMenuContextTrigger,
                                    { class: 'context-trigger', tabindex: 0 },
                                    () => 'Target',
                                ),
                                h(DropdownMenuContent, { avoidCollisions: false }, () =>
                                    h(DropdownMenuItem, null, () => 'Inspect'),
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        const trigger = container.querySelector('.context-trigger') as HTMLElement;
        keydown(trigger, 'ContextMenu');
        await nextTick();

        expect(container.querySelector('[role="menu"]')).not.toBeNull();
    });

    it('positions context content from the pointer virtual anchor', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenuRoot,
                        { modal: false },
                        {
                            default: () => [
                                h(
                                    DropdownMenuContextTrigger,
                                    { class: 'position-target' },
                                    () => 'Target',
                                ),
                                h(DropdownMenuContent, { avoidCollisions: false }, () =>
                                    h(DropdownMenuItem, null, () => 'Inspect'),
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        container.querySelector('.position-target')?.dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: 42,
                clientY: 33,
            }),
        );
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const content = container.querySelector('[role="menu"]') as HTMLElement;
        expect(content.style.left).toBe('42px');
        expect(content.style.top).toBe('41px');
    });

    it('supports cancelable outside interaction', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenuRoot,
                        { defaultOpen: true, modal: false },
                        {
                            default: () =>
                                h(
                                    DropdownMenuContent,
                                    {
                                        avoidCollisions: false,
                                        onInteractOutside: (event: CustomEvent) =>
                                            event.preventDefault(),
                                    },
                                    () => h(DropdownMenuItem, null, () => 'Stay open'),
                                ),
                        },
                    );
                },
            }),
        );
        await nextTick();

        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
        click(document.body);
        await nextTick();

        expect(container.querySelector('[role="menu"]')).not.toBeNull();
    });

    it('blocks modal outside clicks but lets non-modal clicks continue', async () => {
        const outsideClick = vi.fn();
        document.body.addEventListener('click', outsideClick);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenuRoot,
                        { defaultOpen: true, modal: true },
                        {
                            default: () =>
                                h(DropdownMenuContent, { avoidCollisions: false }, () =>
                                    h(DropdownMenuItem, null, () => 'Modal item'),
                                ),
                        },
                    );
                },
            }),
        );
        await nextTick();

        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
        click(document.body);
        await nextTick();

        expect(outsideClick).not.toHaveBeenCalled();
        expect(container.querySelector('[role="menu"]')).toBeNull();
        document.body.removeEventListener('click', outsideClick);
    });

    it('opens touch and pen context menus after long press and cancels on movement', async () => {
        vi.useFakeTimers();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenuRoot,
                        { modal: false },
                        {
                            default: () => [
                                h(
                                    DropdownMenuContextTrigger,
                                    { class: 'long-press', longPressDelay: 700 },
                                    () => 'Target',
                                ),
                                h(DropdownMenuContent, { avoidCollisions: false }, () =>
                                    h(DropdownMenuItem, null, () => 'Inspect'),
                                ),
                            ],
                        },
                    );
                },
            }),
        );
        const trigger = container.querySelector('.long-press') as HTMLElement;

        const canceledDown = new Event('pointerdown', { bubbles: true, cancelable: true });
        Object.defineProperties(canceledDown, {
            pointerId: { value: 1 },
            pointerType: { value: 'touch' },
            clientX: { value: 10 },
            clientY: { value: 10 },
        });
        trigger.dispatchEvent(canceledDown);
        const move = new Event('pointermove', { bubbles: true, cancelable: true });
        Object.defineProperties(move, {
            pointerId: { value: 1 },
            pointerType: { value: 'touch' },
            clientX: { value: 30 },
            clientY: { value: 10 },
        });
        trigger.dispatchEvent(move);
        await vi.advanceTimersByTimeAsync(700);
        expect(container.querySelector('[role="menu"]')).toBeNull();

        const penDown = new Event('pointerdown', { bubbles: true, cancelable: true });
        Object.defineProperties(penDown, {
            pointerId: { value: 2 },
            pointerType: { value: 'pen' },
            clientX: { value: 25 },
            clientY: { value: 40 },
        });
        trigger.dispatchEvent(penDown);
        await vi.advanceTimersByTimeAsync(700);
        await nextTick();

        expect(container.querySelector('[role="menu"]')).not.toBeNull();
    });
});
