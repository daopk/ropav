import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { flush, keydown, mountDom, queryDom, waitForAssertion } from '../../../tests/utils/vue';
import Tooltip from './tooltip.vue';
import type { TooltipSlotProps } from './types';

describe('Tooltip interactions', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders immediately when open is controlled true', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        {
                            content: 'Pinned help',
                            open: true,
                        },
                        {
                            default: ({ triggerProps }: TooltipSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Pinned'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-tooltip') as HTMLElement;
        expect(root.classList.contains('rp-tooltip--open')).toBe(true);
        expect(queryDom(container, '[role="tooltip"]')?.textContent).toBe('Pinned help');
    });

    it('emits update:open from trigger interactions when controlled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        {
                            content: 'Controlled help',
                            open: false,
                            openDelay: 0,
                            'onUpdate:open': onUpdate,
                        },
                        {
                            default: () => h('button', 'Hover'),
                        },
                    );
                },
            }),
        );

        const root = queryDom(container, '.rp-tooltip') as HTMLElement;
        root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(true);
        expect(root.classList.contains('rp-tooltip--open')).toBe(false);
        expect((queryDom(container, '[role="tooltip"]') as HTMLElement).style.display).toBe('none');
    });

    it('honors openDelay before showing content', async () => {
        vi.useFakeTimers();

        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        {
                            content: 'Delayed help',
                            openDelay: 150,
                        },
                        {
                            default: () => h('button', 'Hover'),
                        },
                    );
                },
            }),
        );

        const root = queryDom(container, '.rp-tooltip') as HTMLElement;
        root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await nextTick();

        expect((queryDom(container, '[role="tooltip"]') as HTMLElement).style.display).toBe('none');

        vi.advanceTimersByTime(149);
        await nextTick();
        expect((queryDom(container, '[role="tooltip"]') as HTMLElement).style.display).toBe('none');

        vi.advanceTimersByTime(1);
        await flush();
        expect(queryDom(container, '[role="tooltip"]')?.textContent).toBe('Delayed help');
    });

    it('opens on focus and closes on Escape', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        {
                            content: 'Keyboard help',
                            openDelay: 0,
                        },
                        {
                            default: () => h('button', 'Focus'),
                        },
                    );
                },
            }),
        );

        const root = queryDom(container, '.rp-tooltip') as HTMLElement;
        root.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await flush();
        expect(root.classList.contains('rp-tooltip--open')).toBe(true);

        keydown(root, 'Escape');
        await waitForAssertion(() => {
            expect((queryDom(container, '[role="tooltip"]') as HTMLElement).style.display).toBe(
                'none',
            );
        });
        expect(root.classList.contains('rp-tooltip--open')).toBe(false);
        expect((queryDom(container, '[role="tooltip"]') as HTMLElement).style.display).toBe('none');
    });

    it('does not open when disabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        {
                            content: 'Hidden help',
                            disabled: true,
                            openDelay: 0,
                        },
                        {
                            default: ({ triggerProps }: TooltipSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Hover'),
                        },
                    );
                },
            }),
        );

        const root = queryDom(container, '.rp-tooltip') as HTMLElement;
        root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;
        expect(trigger.getAttribute('aria-describedby')).toBeNull();
        expect(queryDom(container, '[role="tooltip"]')).toBeNull();
        expect([...root.classList]).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-top',
            'rp-tooltip--disabled',
        ]);
    });
});
