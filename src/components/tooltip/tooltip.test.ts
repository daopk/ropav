import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';

import { flush, keydown, mountDom, waitTransition } from '../../../tests/utils/vue';
import Tooltip from './tooltip.vue';
import type { TooltipPlacement, TooltipProps, TooltipSlotProps } from './types';
import { useTooltip } from './useTooltip';

describe('Tooltip', () => {
    const placements: TooltipPlacement[] = ['top', 'right', 'bottom', 'left'];

    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps state handlers testable without rendering the full component', async () => {
        const props = reactive<TooltipProps>({
            content: 'Composable help',
            id: 'composable-tooltip',
            placement: 'left',
            openDelay: 0,
            disabled: false,
        });
        let tooltip!: ReturnType<typeof useTooltip>;

        mountDom(
            defineComponent({
                setup() {
                    tooltip = useTooltip(props);
                    return () => h('div');
                },
            }),
        );

        expect(tooltip.triggerProps.value['aria-describedby']).toBe('composable-tooltip');
        expect(tooltip.rootClass.value).toEqual(['rp-tooltip', 'rp-tooltip--placement-left']);

        tooltip.openTooltip();
        await nextTick();
        expect(tooltip.isVisible.value).toBe(true);
        expect(tooltip.rootClass.value).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-left',
            'rp-tooltip--open',
        ]);

        tooltip.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
        await nextTick();
        expect(tooltip.isVisible.value).toBe(false);

        tooltip.openTooltip();
        await nextTick();
        props.disabled = true;
        await nextTick();
        expect(tooltip.isVisible.value).toBe(false);
        expect(tooltip.triggerProps.value['aria-describedby']).toBeUndefined();
    });

    it('renders the trigger slot and exposes trigger props for accessible wiring', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        {
                            content: 'Copy to clipboard',
                            id: 'copy-tooltip',
                            openDelay: 0,
                        },
                        {
                            default: ({ triggerProps }: TooltipSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Copy'),
                        },
                    );
                },
            }),
        );

        const root = container.querySelector('.rp-tooltip') as HTMLElement;
        root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;

        expect(trigger.getAttribute('aria-describedby')).toBe('copy-tooltip');
        expect(tooltip.id).toBe('copy-tooltip');
        expect(tooltip.textContent).toBe('Copy to clipboard');
        expect([...root.classList]).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-top',
            'rp-tooltip--open',
        ]);
    });

    it('keeps arrow disabled by default and enables it through the arrow prop', () => {
        const props = reactive<TooltipProps>({
            content: 'Arrow help',
            openDelay: 0,
        });
        let tooltip!: ReturnType<typeof useTooltip>;

        mountDom(
            defineComponent({
                setup() {
                    tooltip = useTooltip(props);
                    return () => h('div');
                },
            }),
        );

        expect(tooltip.rootClass.value).toEqual(['rp-tooltip', 'rp-tooltip--placement-top']);

        props.arrow = true;

        expect(tooltip.rootClass.value).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-top',
            'rp-tooltip--arrow',
        ]);
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

        const root = container.querySelector('.rp-tooltip') as HTMLElement;
        root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await nextTick();

        expect(container.querySelector('[role="tooltip"]')).toBeNull();

        vi.advanceTimersByTime(149);
        await nextTick();
        expect(container.querySelector('[role="tooltip"]')).toBeNull();

        vi.advanceTimersByTime(1);
        await flush();
        expect(container.querySelector('[role="tooltip"]')?.textContent).toBe('Delayed help');
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

        const root = container.querySelector('.rp-tooltip') as HTMLElement;
        root.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await flush();
        expect(root.classList.contains('rp-tooltip--open')).toBe(true);

        keydown(root, 'Escape');
        await waitTransition();
        expect(root.classList.contains('rp-tooltip--open')).toBe(false);
        expect(container.querySelector('[role="tooltip"]')).toBeNull();
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

        const root = container.querySelector('.rp-tooltip') as HTMLElement;
        root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;
        expect(trigger.getAttribute('aria-describedby')).toBeNull();
        expect(container.querySelector('[role="tooltip"]')).toBeNull();
        expect([...root.classList]).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-top',
            'rp-tooltip--disabled',
        ]);
    });

    it('supports slotted content and placement modifiers', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        placements.map((placement) =>
                            h(
                                Tooltip,
                                {
                                    content: `${placement} prop`,
                                    placement,
                                    openDelay: 0,
                                },
                                {
                                    default: () => h('button', placement),
                                    content: () => h('strong', `${placement} slot`),
                                },
                            ),
                        ),
                    );
                },
            }),
        );

        const roots = [...container.querySelectorAll('.rp-tooltip')] as HTMLElement[];

        expect(roots).toHaveLength(placements.length);
        for (const [index, placement] of placements.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-tooltip',
                `rp-tooltip--placement-${placement}`,
            ]);
        }

        roots[2].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        expect(container.querySelector('[role="tooltip"]')?.textContent).toBe('bottom slot');
    });
});
