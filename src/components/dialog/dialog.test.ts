import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { click, flush, keydown, mountDom } from '../../../tests/utils/vue';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuTrigger,
} from '../dropdown-menu/dropdown-menu-primitives';
import Popover from '../popover/popover.vue';
import type { PopoverSlotProps } from '../popover/types';
import DialogClose from './dialog-close.vue';
import DialogContent from './dialog-content.vue';
import DialogDescription from './dialog-description.vue';
import DialogOverlay from './dialog-overlay.vue';
import DialogPortal from './dialog-portal.vue';
import DialogRoot from './dialog-root.vue';
import DialogTitle from './dialog-title.vue';
import DialogTrigger from './dialog-trigger.vue';
import type { DialogCloseReason } from './types';

function pointerdown(element: Element) {
    element.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
}

describe('Dialog primitives', () => {
    it('rebinds nested floating content when its portal is toggled', async () => {
        const teleport = ref(true);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        { class: 'dialog-scroll-host', style: { overflow: 'auto' } },
                        h(
                            DialogRoot,
                            { defaultOpen: true, modal: false },
                            {
                                default: () =>
                                    h(
                                        DialogPortal,
                                        { teleport: teleport.value },
                                        {
                                            default: () =>
                                                h(
                                                    DialogContent,
                                                    { ariaLabel: 'Actions' },
                                                    {
                                                        default: () =>
                                                            h(
                                                                DropdownMenuRoot,
                                                                {
                                                                    defaultOpen: true,
                                                                    modal: false,
                                                                },
                                                                {
                                                                    default: () => [
                                                                        h(
                                                                            DropdownMenuTrigger,
                                                                            {
                                                                                class: 'dialog-menu-trigger',
                                                                            },
                                                                            () => 'Actions',
                                                                        ),
                                                                        h(
                                                                            DropdownMenuContent,
                                                                            {
                                                                                flip: false,
                                                                                shift: false,
                                                                            },
                                                                            () =>
                                                                                h(
                                                                                    DropdownMenuItem,
                                                                                    null,
                                                                                    () => 'Rename',
                                                                                ),
                                                                        ),
                                                                    ],
                                                                },
                                                            ),
                                                    },
                                                ),
                                        },
                                    ),
                            },
                        ),
                    );
                },
            }),
        );

        await flush();
        const host = container.querySelector('.dialog-scroll-host') as HTMLElement;
        const trigger = document.body.querySelector('.dialog-menu-trigger') as HTMLElement;
        const getReferenceRect = vi.spyOn(trigger, 'getBoundingClientRect');

        teleport.value = false;
        await flush();
        await vi.waitFor(() => expect(getReferenceRect).toHaveBeenCalled());

        getReferenceRect.mockClear();
        host.dispatchEvent(new Event('scroll'));
        await flush();

        expect(getReferenceRect).toHaveBeenCalled();
    });

    it('composes accessible portalled content and reports every close reason', async () => {
        const portal = document.createElement('div');
        document.body.append(portal);
        const closeReasons: DialogCloseReason[] = [];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DialogRoot,
                        {
                            onClose: (reason: DialogCloseReason) => closeReasons.push(reason),
                        },
                        {
                            default: () => [
                                h(DialogTrigger, { class: 'dialog-trigger' }, () => 'Open dialog'),
                                h(
                                    DialogPortal,
                                    { teleportTo: portal },
                                    {
                                        default: () => [
                                            h(DialogOverlay, { class: 'dialog-overlay' }),
                                            h(
                                                DialogContent,
                                                {
                                                    class: 'dialog-content',
                                                    focusTrapOptions: {
                                                        tabbableOptions: { displayCheck: 'none' },
                                                    },
                                                },
                                                {
                                                    default: () => [
                                                        h(
                                                            DialogTitle,
                                                            null,
                                                            () => 'Delete project',
                                                        ),
                                                        h(
                                                            DialogDescription,
                                                            null,
                                                            () => 'This cannot be undone.',
                                                        ),
                                                        h(
                                                            DialogClose,
                                                            { class: 'dialog-close' },
                                                            () => 'Cancel',
                                                        ),
                                                    ],
                                                },
                                            ),
                                        ],
                                    },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        const trigger = container.querySelector('.dialog-trigger') as HTMLButtonElement;
        const contentId = trigger.getAttribute('aria-controls');
        expect(contentId).toBeTruthy();
        expect(portal.querySelector('[role="dialog"]')).toBeNull();

        trigger.focus();
        click(trigger);
        await flush();

        let content = portal.querySelector('.dialog-content') as HTMLElement;
        const overlay = portal.querySelector('.dialog-overlay') as HTMLElement;
        const title = portal.querySelector('h2') as HTMLElement;
        const description = portal.querySelector('p') as HTMLElement;
        expect(content.id).toBe(contentId);
        expect(content.getAttribute('aria-modal')).toBe('true');
        expect(content.getAttribute('aria-labelledby')).toBe(title.id);
        expect(content.getAttribute('aria-describedby')).toBe(description.id);
        expect(content.style.zIndex).toBe('1000');
        expect(overlay.style.zIndex).toBe('999');
        expect(document.body.style.overflow).toBe('hidden');
        expect(container.inert).toBe(true);

        click(portal.querySelector('.dialog-close') as HTMLButtonElement);
        await flush();
        expect(closeReasons).toEqual(['programmatic']);
        expect(portal.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
        expect(container.inert).toBe(false);
        expect(document.body.style.overflow).toBe('');

        click(trigger);
        await flush();
        content = portal.querySelector('.dialog-content') as HTMLElement;
        keydown(content, 'Escape');
        await flush();
        expect(closeReasons).toEqual(['programmatic', 'escape']);

        click(trigger);
        await flush();
        pointerdown(portal.querySelector('.dialog-overlay') as HTMLElement);
        await flush();
        expect(closeReasons).toEqual(['programmatic', 'escape', 'outside']);
    });

    it('supports non-modal content without inerting, scroll lock, or focus trapping', async () => {
        const background = document.createElement('button');
        background.textContent = 'Background action';
        document.body.append(background);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DialogRoot,
                        {
                            defaultOpen: true,
                            modal: false,
                            closeOnEscape: false,
                            closeOnOutsideClick: false,
                        },
                        {
                            default: () =>
                                h(DialogContent, { ariaLabel: 'Non-modal settings' }, () =>
                                    h('button', { class: 'inside-action' }, 'Save'),
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const content = container.querySelector('[role="dialog"]') as HTMLElement;
        expect(content.getAttribute('aria-modal')).toBeNull();
        expect(content.getAttribute('data-modal')).toBeNull();
        expect(content.getAttribute('tabindex')).toBeNull();
        expect(background.inert).not.toBe(true);
        expect(background.getAttribute('aria-hidden')).toBeNull();
        expect(document.body.style.overflow).toBe('');

        background.focus();
        expect(document.activeElement).toBe(background);
        pointerdown(background);
        keydown(background, 'Escape');
        await flush();
        expect(container.querySelector('[role="dialog"]')).toBe(content);
    });

    it('keeps an explicit content id wired to the trigger while closed', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DialogRoot,
                        { modal: false },
                        {
                            default: () => [
                                h(
                                    DialogTrigger,
                                    { class: 'custom-id-trigger' },
                                    () => 'Open settings',
                                ),
                                h(
                                    DialogContent,
                                    { id: 'settings-dialog', ariaLabel: 'Settings' },
                                    () =>
                                        h(
                                            DialogClose,
                                            { class: 'custom-id-close' },
                                            () => 'Close settings',
                                        ),
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const trigger = container.querySelector('.custom-id-trigger') as HTMLButtonElement;
        expect(trigger.getAttribute('aria-controls')).toBe('settings-dialog');

        click(trigger);
        await flush();
        expect(container.querySelector('[role="dialog"]')?.id).toBe('settings-dialog');

        click(container.querySelector('.custom-id-close') as HTMLButtonElement);
        await flush();
        expect(container.querySelector('[role="dialog"]')).toBeNull();
        expect(trigger.getAttribute('aria-controls')).toBe('settings-dialog');
    });

    it('stacks each dialog overlay above the preceding dialog content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(
                            DialogRoot,
                            { defaultOpen: true, modal: false },
                            {
                                default: () => [
                                    h(DialogOverlay, { class: 'first-overlay' }),
                                    h(DialogContent, {
                                        ariaLabel: 'First dialog',
                                        class: 'first-content',
                                    }),
                                ],
                            },
                        ),
                        h(
                            DialogRoot,
                            { defaultOpen: true, modal: false },
                            {
                                default: () => [
                                    h(DialogOverlay, { class: 'second-overlay' }),
                                    h(DialogContent, {
                                        ariaLabel: 'Second dialog',
                                        class: 'second-content',
                                    }),
                                ],
                            },
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const firstContent = container.querySelector('.first-content') as HTMLElement;
        const secondOverlay = container.querySelector('.second-overlay') as HTMLElement;
        const secondContent = container.querySelector('.second-content') as HTMLElement;
        expect(Number(secondOverlay.style.zIndex)).toBeGreaterThan(
            Number(firstContent.style.zIndex),
        );
        expect(Number(secondContent.style.zIndex)).toBeGreaterThan(
            Number(secondOverlay.style.zIndex),
        );
    });

    it('treats a portalled dropdown as part of the dialog focus scope and top layer', async () => {
        const closeReasons: DialogCloseReason[] = [];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DialogRoot,
                        {
                            defaultOpen: true,
                            onClose: (reason: DialogCloseReason) => closeReasons.push(reason),
                        },
                        {
                            default: () =>
                                h(
                                    DialogContent,
                                    {
                                        ariaLabel: 'Project dialog',
                                        focusTrapOptions: {
                                            tabbableOptions: { displayCheck: 'none' },
                                        },
                                    },
                                    () =>
                                        h(
                                            DropdownMenuRoot,
                                            { modal: false },
                                            {
                                                default: () => [
                                                    h(
                                                        DropdownMenuTrigger,
                                                        { class: 'menu-trigger' },
                                                        () => 'Actions',
                                                    ),
                                                    h(DropdownMenuPortal, null, {
                                                        default: () =>
                                                            h(
                                                                DropdownMenuContent,
                                                                { flip: false, shift: false },
                                                                () =>
                                                                    h(
                                                                        DropdownMenuItem,
                                                                        {
                                                                            class: 'menu-item',
                                                                        },
                                                                        () => 'Rename',
                                                                    ),
                                                            ),
                                                    }),
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
        const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
        click(container.querySelector('.menu-trigger') as HTMLButtonElement);
        await flush();
        await nextTick();

        const menu = document.body.querySelector('[role="menu"]') as HTMLElement;
        const item = document.body.querySelector('.menu-item') as HTMLElement;
        expect(document.activeElement).toBe(menu);
        expect(item.getAttribute('data-focused')).toBe('true');
        expect(menu.inert).not.toBe(true);
        expect(Number(menu.style.zIndex)).toBeGreaterThan(Number(dialog.style.zIndex));

        keydown(item, 'Escape');
        await flush();
        expect(document.body.querySelector('[role="menu"]')).toBeNull();
        expect(container.querySelector('[role="dialog"]')).not.toBeNull();
        expect(closeReasons).toEqual([]);

        keydown(container.querySelector('.menu-trigger') as HTMLButtonElement, 'Escape');
        await flush();
        expect(container.querySelector('[role="dialog"]')).toBeNull();
        expect(closeReasons).toEqual(['escape']);
    });

    it('orders an initially open portalled popover above its parent dialog', async () => {
        const popoverOpen = ref(true);
        const closeReasons: DialogCloseReason[] = [];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DialogRoot,
                        {
                            defaultOpen: true,
                            onClose: (reason: DialogCloseReason) => closeReasons.push(reason),
                        },
                        {
                            default: () =>
                                h(
                                    DialogContent,
                                    {
                                        ariaLabel: 'Parent dialog',
                                        focusTrapOptions: {
                                            tabbableOptions: { displayCheck: 'none' },
                                        },
                                    },
                                    () =>
                                        h(
                                            Popover,
                                            {
                                                open: popoverOpen.value,
                                                ariaLabel: 'Quick actions',
                                                'onUpdate:open': (value: boolean) => {
                                                    popoverOpen.value = value;
                                                },
                                            },
                                            {
                                                default: ({ triggerProps }: PopoverSlotProps) =>
                                                    h(
                                                        'button',
                                                        {
                                                            ...triggerProps,
                                                            class: 'popover-trigger',
                                                        },
                                                        'Quick actions',
                                                    ),
                                                content: () =>
                                                    h(
                                                        'button',
                                                        { class: 'popover-action' },
                                                        'Archive',
                                                    ),
                                            },
                                        ),
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
        const popover = document.body.querySelector('.rp-popover__content') as HTMLElement;
        const action = popover.querySelector('.popover-action') as HTMLButtonElement;
        expect(Number(popover.style.zIndex)).toBeGreaterThan(Number(dialog.style.zIndex));
        expect(popover.inert).not.toBe(true);

        action.focus();
        expect(document.activeElement).toBe(action);
        keydown(action, 'Escape');
        await flush();
        expect(popoverOpen.value).toBe(false);
        expect(container.querySelector('[role="dialog"]')).not.toBeNull();
        expect(closeReasons).toEqual([]);

        keydown(container.querySelector('.popover-trigger') as HTMLButtonElement, 'Escape');
        await flush();
        expect(container.querySelector('[role="dialog"]')).toBeNull();
        expect(closeReasons).toEqual(['escape']);
    });

    it('allows consumers to cancel Escape and outside dismissal', async () => {
        const onClose = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DialogRoot,
                        { defaultOpen: true, onClose },
                        {
                            default: () => [
                                h(DialogOverlay, { class: 'cancel-overlay' }),
                                h(
                                    DialogContent,
                                    {
                                        ariaLabel: 'Confirm changes',
                                        onEscapeKeyDown: (event: Event) => event.preventDefault(),
                                        onPointerDownOutside: (event: Event) =>
                                            event.preventDefault(),
                                    },
                                    () => 'Unsaved changes',
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();
        keydown(document, 'Escape');
        pointerdown(container.querySelector('.cancel-overlay') as HTMLElement);
        await flush();

        expect(container.querySelector('[role="dialog"]')).not.toBeNull();
        expect(onClose).not.toHaveBeenCalled();
    });
});
