import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { click, keydown, mountDom, queryDom } from '../../../tests/utils/vue';
import { items, waitForDropdownClose } from '../../../tests/fixtures/dropdown-menu';
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

        const root = queryDom(container, '.rp-dropdown-menu') as HTMLElement;
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        click(trigger);
        keydown(trigger, 'ArrowDown');
        await nextTick();

        expect(root.classList.contains('rp-dropdown-menu--disabled')).toBe(true);
        expect(trigger.disabled).toBe(true);
        expect(trigger.getAttribute('aria-controls')).toBeNull();
        expect(queryDom(container, '[role="menu"]')).toBeNull();
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('closes on outside pointerdown and Escape', async () => {
        const outsideClick = vi.fn();
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

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        click(trigger);
        await nextTick();
        expect(queryDom(container, '[role="menu"]')).not.toBeNull();

        document.body.addEventListener('click', outsideClick);
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
        click(document.body);
        await waitForDropdownClose();
        expect(outsideClick).toHaveBeenCalledOnce();
        expect(queryDom(container, '[role="menu"]')).toBeNull();
        document.body.removeEventListener('click', outsideClick);

        click(trigger);
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        keydown(menu, 'Escape');
        await waitForDropdownClose();

        expect(queryDom(container, '[role="menu"]')).toBeNull();
    });

    it('supports cancelable outside interaction without a duplicate click event', async () => {
        const onInteractOutside = vi.fn((event: CustomEvent) => event.preventDefault());
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { items, onInteractOutside },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
        click(document.body);
        await nextTick();

        expect(onInteractOutside).toHaveBeenCalledOnce();
        expect(queryDom(container, '[role="menu"]')).not.toBeNull();
    });

    it('ignores configured outside targets', async () => {
        const ignored = ref<HTMLElement | null>(null);
        const onInteractOutside = vi.fn();
        const container = mountDom(
            defineComponent({
                setup() {
                    return () => [
                        h('button', { ref: ignored, class: 'ignored-outside' }, 'Ignored'),
                        h(
                            DropdownMenu,
                            { items, ignore: [ignored], onInteractOutside },
                            {
                                default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                    h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                            },
                        ),
                    ];
                },
            }),
        );

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();
        ignored.value?.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
        await nextTick();

        expect(onInteractOutside).not.toHaveBeenCalled();
        expect(queryDom(container, '[role="menu"]')).not.toBeNull();

        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
        await waitForDropdownClose();

        expect(onInteractOutside).toHaveBeenCalledOnce();
        expect(queryDom(container, '[role="menu"]')).toBeNull();
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

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        click(trigger);
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        expect(menu).not.toBeNull();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');

        keydown(menu, 'Escape');
        await waitForDropdownClose();

        expect(onOpen).toHaveBeenNthCalledWith(1, true);
        expect(onOpen).toHaveBeenNthCalledWith(2, false);
        expect(queryDom(container, '[role="menu"]')).toBeNull();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('does not emit duplicate open updates for idempotent controls or disabling a closed menu', async () => {
        const open = ref(false);
        const disabled = ref(false);
        const onOpen = vi.fn((value: boolean) => {
            open.value = value;
        });
        let controls: DropdownMenuSlotProps | undefined;

        mountDom(
            defineComponent({
                setup() {
                    return () =>
                        h(
                            DropdownMenu,
                            {
                                items,
                                open: open.value,
                                disabled: disabled.value,
                                'onUpdate:open': onOpen,
                            },
                            {
                                default: (slotProps: DropdownMenuSlotProps) => {
                                    controls = slotProps;
                                    return h('button', slotProps.triggerProps, 'Actions');
                                },
                            },
                        );
                },
            }),
        );

        controls?.close();
        disabled.value = true;
        await nextTick();
        expect(onOpen).not.toHaveBeenCalled();

        disabled.value = false;
        await nextTick();
        controls?.open();
        await nextTick();
        controls?.open();
        await nextTick();
        expect(onOpen.mock.calls).toEqual([[true]]);

        controls?.close();
        await waitForDropdownClose();
        controls?.close();
        await nextTick();
        expect(onOpen.mock.calls).toEqual([[true], [false]]);
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();
        document.body.addEventListener('click', outsideClick);
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
        click(document.body);
        await waitForDropdownClose();

        expect(outsideClick).not.toHaveBeenCalled();
        expect(queryDom(container, '[role="menu"]')).toBeNull();
        document.body.removeEventListener('click', outsideClick);
    });
});
