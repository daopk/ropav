import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import IconSparkles from '~icons/lucide/sparkles';

import { click, flush, mountDom, waitForAssertion } from '../../../tests/utils/vue';
import Toast from './toast.vue';
import { toastColors, toastRadiuses, toastVariants } from './types';

afterEach(() => {
    vi.useRealTimers();
});

describe('Toast', () => {
    it('renders content, slots, and polite live-region semantics', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toast,
                        {
                            duration: 0,
                            title: 'Changes saved',
                            description: 'Your preferences are up to date.',
                        },
                        {
                            icon: () => h(IconSparkles, { class: 'custom-icon' }),
                            title: () => h('span', { class: 'custom-title' }, 'Custom title'),
                            default: () => h('span', { class: 'body-content' }, 'View changes'),
                            action: () => h('button', { class: 'custom-action' }, 'Undo'),
                        },
                    );
                },
            }),
        );

        await flush();

        const toast = container.querySelector('.rp-toast') as HTMLElement;

        expect([...toast.classList]).toEqual(['rp-toast']);
        expect(toast.getAttribute('role')).toBe('status');
        expect(container.querySelector('.rp-toast__icon .custom-icon')).toBeTruthy();
        expect(container.querySelector('.rp-toast__title .custom-title')?.textContent).toBe(
            'Custom title',
        );
        expect(container.querySelector('.rp-toast__description')?.textContent).toBe(
            'Your preferences are up to date.',
        );
        expect(container.querySelector('.rp-toast__body .body-content')?.textContent).toBe(
            'View changes',
        );
        expect(container.querySelector('.rp-toast__action .custom-action')?.textContent).toBe(
            'Undo',
        );
    });

    it('adds modifiers for every variant and radius', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        ...toastVariants.map((variant) =>
                            h(Toast, { duration: 0, variant }, { default: () => variant }),
                        ),
                        ...toastRadiuses.map((radius) =>
                            h(Toast, { duration: 0, radius }, { default: () => radius }),
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const toasts = [...container.querySelectorAll('.rp-toast')];

        expect(toasts).toHaveLength(toastVariants.length + toastRadiuses.length);
        for (const [index, variant] of toastVariants.entries()) {
            expect([...toasts[index].classList]).toEqual(['rp-toast', `rp-toast--${variant}`]);
        }
        for (const [index, radius] of toastRadiuses.entries()) {
            expect([...toasts[index + toastVariants.length].classList]).toEqual([
                'rp-toast',
                `rp-toast--radius-${radius}`,
            ]);
        }
    });

    it('resolves surface color variables for preset colors', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        toastColors.map((color) =>
                            h(Toast, { color, duration: 0 }, { default: () => color }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const toasts = [...container.querySelectorAll('.rp-toast')];

        expect(toasts).toHaveLength(toastColors.length);
        for (const [index, color] of toastColors.entries()) {
            const toast = toasts[index] as HTMLElement;

            expect(toast.style.getPropertyValue('--_rp-toast-bg')).toBe(
                `var(--rp-color-${color}-light)`,
            );
            expect(toast.style.getPropertyValue('--_rp-toast-fg')).toBe('var(--rp-color-text)');
            expect(toast.style.getPropertyValue('--_rp-toast-title-fg')).toBe(
                'var(--rp-color-text)',
            );
            expect(toast.style.getPropertyValue('--_rp-toast-icon-fg')).toBe(
                `var(--rp-color-${color}-light-color)`,
            );
            expect(toast.style.getPropertyValue('--_rp-toast-border')).toBe(
                `var(--rp-color-${color}-outline)`,
            );
        }
    });

    it('dismisses from the close button and reports the reason', async () => {
        let emittedOpen: boolean | undefined;
        let closeReason: string | undefined;
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toast,
                        {
                            closeLabel: 'Dismiss notification',
                            duration: 0,
                            'onUpdate:open': (open: boolean) => {
                                emittedOpen = open;
                            },
                            onClose: (reason: string) => {
                                closeReason = reason;
                            },
                        },
                        { default: () => 'Dismiss me' },
                    );
                },
            }),
        );

        await flush();

        const closeButton = container.querySelector('.rp-toast__close') as HTMLButtonElement;
        expect(closeButton.getAttribute('aria-label')).toBe('Dismiss notification');

        click(closeButton);
        await waitForAssertion(() => {
            expect(container.querySelector('.rp-toast')).toBeNull();
        });

        expect(container.querySelector('.rp-toast')).toBeNull();
        expect(emittedOpen).toBe(false);
        expect(closeReason).toBe('dismiss');
    });

    it('emits only the first close when multiple close triggers race before rendering', async () => {
        vi.useFakeTimers();

        const updateOpen = vi.fn();
        const close = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toast,
                        {
                            duration: 3000,
                            'onUpdate:open': updateOpen,
                            onClose: close,
                        },
                        { default: () => 'Close once' },
                    );
                },
            }),
        );

        await flush();

        const closeButton = container.querySelector('.rp-toast__close') as HTMLButtonElement;
        vi.advanceTimersByTime(3000);
        click(closeButton);

        expect(updateOpen).toHaveBeenCalledTimes(1);
        expect(updateOpen).toHaveBeenCalledWith(false);
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith('timeout');
    });

    it('auto-dismisses after the configured duration', async () => {
        vi.useFakeTimers();

        let closeReason: string | undefined;
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toast,
                        {
                            duration: 3000,
                            onClose: (reason: string) => {
                                closeReason = reason;
                            },
                        },
                        { default: () => 'Timed toast' },
                    );
                },
            }),
        );

        await flush();
        vi.advanceTimersByTime(2999);
        await flush();
        expect(container.querySelector('.rp-toast')).toBeTruthy();

        vi.advanceTimersByTime(1);
        await flush();
        vi.runAllTimers();
        await flush();
        expect(container.querySelector('.rp-toast')).toBeNull();
        expect(closeReason).toBe('timeout');
    });

    it('pauses auto-dismiss while hovered and resumes with the remaining duration', async () => {
        vi.useFakeTimers();

        const container = mountDom(
            defineComponent({
                render() {
                    return h(Toast, { duration: 3000 }, { default: () => 'Hover me' });
                },
            }),
        );

        await flush();

        const toast = container.querySelector('.rp-toast') as HTMLElement;
        vi.advanceTimersByTime(1000);
        toast.dispatchEvent(new MouseEvent('mouseenter'));
        vi.advanceTimersByTime(5000);
        await flush();
        expect(container.querySelector('.rp-toast')).toBeTruthy();

        toast.dispatchEvent(new MouseEvent('mouseleave'));
        vi.advanceTimersByTime(1999);
        await flush();
        expect(container.querySelector('.rp-toast')).toBeTruthy();

        vi.advanceTimersByTime(1);
        await flush();
        vi.runAllTimers();
        await flush();
        expect(container.querySelector('.rp-toast')).toBeNull();
    });

    it('resumes auto-dismiss when pause-on-hover is disabled while hovered', async () => {
        vi.useFakeTimers();

        const pauseOnHover = ref(true);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toast,
                        { duration: 3000, pauseOnHover: pauseOnHover.value },
                        { default: () => 'Hover me' },
                    );
                },
            }),
        );

        await flush();

        const toast = container.querySelector('.rp-toast') as HTMLElement;
        vi.advanceTimersByTime(1000);
        toast.dispatchEvent(new MouseEvent('mouseenter'));

        pauseOnHover.value = false;
        await flush();

        vi.advanceTimersByTime(1999);
        await flush();
        expect(container.querySelector('.rp-toast')).toBeTruthy();

        vi.advanceTimersByTime(1);
        await flush();
        vi.runAllTimers();
        await flush();
        expect(container.querySelector('.rp-toast')).toBeNull();
    });

    it('resumes auto-dismiss when pause-on-focus is disabled while focused', async () => {
        vi.useFakeTimers();

        const pauseOnFocus = ref(true);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toast,
                        { duration: 3000, pauseOnFocus: pauseOnFocus.value },
                        { default: () => 'Focus me' },
                    );
                },
            }),
        );

        await flush();

        const toast = container.querySelector('.rp-toast') as HTMLElement;
        vi.advanceTimersByTime(1000);
        toast.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

        pauseOnFocus.value = false;
        await flush();

        vi.advanceTimersByTime(1999);
        await flush();
        expect(container.querySelector('.rp-toast')).toBeTruthy();

        vi.advanceTimersByTime(1);
        await flush();
        vi.runAllTimers();
        await flush();
        expect(container.querySelector('.rp-toast')).toBeNull();
    });

    it('starts a fresh timer when a controlled toast closes and reopens in one tick', async () => {
        vi.useFakeTimers();

        const open = ref(true);
        let closeCount = 0;
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toast,
                        {
                            duration: 3000,
                            open: open.value,
                            'onUpdate:open': (value: boolean) => {
                                open.value = value;
                            },
                            onClose: () => {
                                closeCount += 1;
                                open.value = true;
                            },
                        },
                        { default: () => 'Reopen me' },
                    );
                },
            }),
        );

        await flush();
        vi.advanceTimersByTime(3000);
        await flush();

        expect(container.querySelector('.rp-toast')).toBeTruthy();
        expect(closeCount).toBe(1);

        vi.advanceTimersByTime(2999);
        await flush();
        expect(closeCount).toBe(1);

        vi.advanceTimersByTime(1);
        await flush();
        expect(closeCount).toBe(2);
    });

    it('accepts a new close cycle after a controlled owner reopens synchronously', async () => {
        const open = ref(true);
        const updateOpen = vi.fn((value: boolean) => {
            open.value = value;
        });
        const close = vi.fn(() => {
            open.value = true;
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toast,
                        {
                            duration: 0,
                            open: open.value,
                            'onUpdate:open': updateOpen,
                            onClose: close,
                        },
                        { default: () => 'Reopen each cycle' },
                    );
                },
            }),
        );

        await flush();

        const closeButton = container.querySelector('.rp-toast__close') as HTMLButtonElement;
        click(closeButton);
        click(closeButton);

        expect(updateOpen).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledTimes(1);

        await flush();
        click(container.querySelector('.rp-toast__close') as HTMLButtonElement);

        expect(updateOpen).toHaveBeenCalledTimes(2);
        expect(close).toHaveBeenCalledTimes(2);
    });

    it('times out when pausing an overdue timer before its callback runs', async () => {
        vi.useFakeTimers();

        let closeReason: string | undefined;
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toast,
                        {
                            duration: 3000,
                            onClose: (reason: string) => {
                                closeReason = reason;
                            },
                        },
                        { default: () => 'Overdue toast' },
                    );
                },
            }),
        );

        await flush();

        const toast = container.querySelector('.rp-toast') as HTMLElement;
        vi.setSystemTime(Date.now() + 3000);
        toast.dispatchEvent(new MouseEvent('mouseenter'));
        await flush();
        vi.runAllTimers();
        await flush();

        expect(container.querySelector('.rp-toast')).toBeNull();
        expect(closeReason).toBe('timeout');
    });

    it('supports controlled visibility and removing the live-region role', async () => {
        const hiddenContainer = mountDom(
            defineComponent({
                render() {
                    return h(Toast, { duration: 0, open: false }, { default: () => 'Hidden' });
                },
            }),
        );
        const visibleContainer = mountDom(
            defineComponent({
                render() {
                    return h(Toast, { duration: 0, role: 'none' }, { default: () => 'No role' });
                },
            }),
        );

        await flush();

        expect(hiddenContainer.querySelector('.rp-toast')).toBeNull();
        expect(visibleContainer.querySelector('.rp-toast')?.getAttribute('role')).toBeNull();
    });
});
