import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';

import { click, flush, keydown, mountDom, waitTransition } from '../../../tests/utils/vue';
import Button from '../button/button.vue';
import Modal from './modal.vue';
import type { ModalSlotProps } from './types';

function tab(shiftKey = false) {
    document.dispatchEvent(
        new KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
            shiftKey,
        }),
    );
}

describe('Modal', () => {
    it('renders an accessible modal and closes in uncontrolled mode', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Modal,
                        {
                            id: 'invite-modal',
                            defaultOpen: true,
                            title: 'Invite teammate',
                            description: 'Send an invitation to collaborate.',
                        },
                        {
                            default: ({ close }: ModalSlotProps) =>
                                h('button', { class: 'done', onClick: close }, 'Done'),
                            footer: ({ close }: ModalSlotProps) =>
                                h(Button, { class: 'footer-close', onClick: close }, () => 'Close'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-modal') as HTMLElement;
        const overlay = container.querySelector('.rp-modal__overlay') as HTMLElement;
        const panel = container.querySelector('#invite-modal') as HTMLElement;
        const title = container.querySelector('#invite-modal-title') as HTMLElement;
        const description = container.querySelector('#invite-modal-description') as HTMLElement;

        expect([...root.classList]).toEqual([
            'rp-modal',
            'rp-modal--size-md',
            'rp-modal--open',
            'rp-modal--closable',
        ]);
        expect(overlay.classList.contains('rp-overlay')).toBe(true);
        expect(overlay.classList.contains('rp-overlay--interactive')).toBe(true);
        expect(panel.getAttribute('role')).toBe('dialog');
        expect(panel.getAttribute('aria-modal')).toBe('true');
        expect(panel.getAttribute('aria-labelledby')).toBe(title.id);
        expect(panel.getAttribute('aria-describedby')).toBe(description.id);
        expect(document.body.style.overflow).toBe('hidden');

        click(container.querySelector('.done') as HTMLButtonElement);
        await waitTransition();

        expect(container.querySelector('.rp-modal')).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('emits update:open from close button when controlled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Modal,
                        {
                            open: true,
                            title: 'Controlled modal',
                            'onUpdate:open': onUpdate,
                        },
                        {
                            default: () => h('p', 'Controlled content'),
                        },
                    );
                },
            }),
        );

        await flush();

        click(container.querySelector('.rp-modal__close') as HTMLButtonElement);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(false);
        expect(container.querySelector('.rp-modal')).toBeTruthy();
    });

    it('supports custom CSS size values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Modal,
                        {
                            defaultOpen: true,
                            ariaLabel: 'Custom width modal',
                            size: '55%',
                        },
                        {
                            default: () => h('p', 'Custom width content'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-modal') as HTMLElement;

        expect(root.classList.contains('rp-modal--size-custom')).toBe(true);
        expect(root.classList.contains('rp-modal--size-55%')).toBe(false);
        expect(root.style.getPropertyValue('--_rp-modal-width')).toBe('55%');
    });

    it('passes visual overlay props to the built-in overlay', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Modal,
                        {
                            defaultOpen: true,
                            ariaLabel: 'Custom overlay modal',
                            overlayProps: {
                                color: '#123456',
                                opacity: 0.64,
                                blur: 6,
                            },
                        },
                        {
                            default: () => h('p', 'Custom overlay content'),
                        },
                    );
                },
            }),
        );

        await flush();

        const overlay = container.querySelector('.rp-modal__overlay') as HTMLElement;

        expect(overlay.classList.contains('rp-overlay')).toBe(true);
        expect(overlay.classList.contains('rp-overlay--blurred')).toBe(true);
        expect(overlay.classList.contains('rp-overlay--interactive')).toBe(true);
        expect(overlay.style.getPropertyValue('--_rp-overlay-color')).toBe('#123456');
        expect(overlay.style.getPropertyValue('--_rp-overlay-opacity')).toBe('0.64');
        expect(overlay.style.getPropertyValue('--_rp-overlay-blur')).toBe('6px');
        expect(overlay.style.getPropertyValue('--_rp-overlay-z-index')).toBe('0');
    });

    it('closes on overlay click and Escape, then restores focus and scroll', async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open settings';
        document.body.append(trigger);
        trigger.focus();

        const props = reactive({
            open: true,
            title: 'Settings',
            initialFocus: '.primary-action',
        });

        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Modal,
                        {
                            ...props,
                            'onUpdate:open': (value: boolean) => {
                                props.open = value;
                            },
                        },
                        {
                            default: () =>
                                h('div', [
                                    h('button', { class: 'secondary-action' }, 'Cancel'),
                                    h('button', { class: 'primary-action' }, 'Save'),
                                ]),
                        },
                    );
                },
            }),
        );

        await flush();

        expect(document.activeElement).toBe(container.querySelector('.primary-action'));
        expect(document.body.style.overflow).toBe('hidden');

        click(container.querySelector('.rp-modal__overlay') as HTMLElement);
        await waitTransition();

        expect(props.open).toBe(false);
        expect(container.querySelector('.rp-modal')).toBeNull();
        expect(document.activeElement).toBe(trigger);
        expect(document.body.style.overflow).toBe('');

        props.open = true;
        await flush();

        keydown(document, 'Escape');
        await waitTransition();

        expect(props.open).toBe(false);
    });

    it('keeps focus inside the active modal', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Modal,
                        {
                            defaultOpen: true,
                            title: 'Focus trap',
                            showCloseButton: false,
                        },
                        {
                            default: () =>
                                h('div', [
                                    h('button', { class: 'first' }, 'First'),
                                    h('button', { class: 'last' }, 'Last'),
                                ]),
                        },
                    );
                },
            }),
        );

        await flush();

        const first = container.querySelector('.first') as HTMLButtonElement;
        const last = container.querySelector('.last') as HTMLButtonElement;

        last.focus();
        tab();
        expect(document.activeElement).toBe(first);

        first.focus();
        tab(true);
        expect(document.activeElement).toBe(last);
    });

    it('respects disabled dismissal props and keeps mounted content hidden', async () => {
        const props = reactive({
            open: true,
            ariaLabel: 'Persistent modal',
            closeOnOverlayClick: false,
            closeOnEscape: false,
            keepMounted: true,
        });

        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Modal,
                        {
                            ...props,
                            'onUpdate:open': (value: boolean) => {
                                props.open = value;
                            },
                        },
                        {
                            default: () => h('p', 'Persistent content'),
                        },
                    );
                },
            }),
        );

        await flush();

        click(container.querySelector('.rp-modal__overlay') as HTMLElement);
        keydown(document, 'Escape');
        await flush();

        expect(props.open).toBe(true);

        props.open = false;
        await waitTransition();

        const root = container.querySelector('.rp-modal') as HTMLElement;
        const panel = container.querySelector('.rp-modal__panel') as HTMLElement;

        expect(root).toBeTruthy();
        expect(root.style.display).toBe('none');
        expect(panel.getAttribute('aria-label')).toBe('Persistent modal');
        expect(panel.getAttribute('aria-labelledby')).toBeNull();
    });
});
