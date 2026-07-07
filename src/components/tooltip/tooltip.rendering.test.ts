import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { colors, placements } from '../../../tests/fixtures/tooltip';
import { flush, mountDom } from '../../../tests/utils/vue';
import Tooltip from './tooltip.vue';
import type { TooltipSlotProps } from './types';

describe('Tooltip rendering', () => {
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
        const trigger = container.querySelector('.trigger') as HTMLButtonElement;
        const hiddenTooltip = container.querySelector('[role="tooltip"]') as HTMLElement;

        expect(trigger.getAttribute('aria-describedby')).toBe('copy-tooltip');
        expect(hiddenTooltip.id).toBe('copy-tooltip');
        expect(hiddenTooltip.style.display).toBe('none');

        root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

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

    it('renders decorative content without accessible trigger wiring', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        {
                            content: 'Visual value',
                            decorative: true,
                            id: 'decorative-tooltip',
                            open: true,
                        },
                        {
                            default: ({ triggerProps }: TooltipSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Value'),
                        },
                    );
                },
            }),
        );

        await flush();

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;
        const tooltip = container.querySelector('.rp-tooltip__content') as HTMLElement;

        expect(trigger.getAttribute('aria-describedby')).toBeNull();
        expect(tooltip.id).toBe('decorative-tooltip');
        expect(tooltip.getAttribute('role')).toBeNull();
        expect(tooltip.getAttribute('aria-hidden')).toBe('true');
        expect(tooltip.textContent).toBe('Visual value');
    });

    it('adds a color modifier for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) =>
                            h(
                                Tooltip,
                                {
                                    color,
                                    content: `${color} help`,
                                },
                                {
                                    default: () => h('button', color),
                                },
                            ),
                        ),
                    );
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-tooltip')] as HTMLElement[];
        const contents = [...container.querySelectorAll('[role="tooltip"]')] as HTMLElement[];

        expect(roots).toHaveLength(colors.length);
        expect(contents).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-tooltip',
                'rp-tooltip--placement-top',
                `rp-tooltip--color-${color}`,
            ]);
            expect(contents[index].style.getPropertyValue('--_rp-tooltip-bg')).toBe('');
        }
    });

    it('sets inline custom color variables for arbitrary color values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        {
                            color: '#ff3366',
                            content: 'Custom help',
                        },
                        {
                            default: () => h('button', 'Custom'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-tooltip') as HTMLElement;
        const content = container.querySelector('[role="tooltip"]') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-tooltip', 'rp-tooltip--placement-top']);
        expect(content.style.getPropertyValue('--_rp-tooltip-bg')).toBe('#ff3366');
        expect(content.style.getPropertyValue('--_rp-tooltip-fg')).toBe(
            'var(--rp-color-on-primary)',
        );
    });

    it('applies numeric and axis object offsets as content style variables', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(
                            Tooltip,
                            {
                                content: 'Numeric offset',
                                offset: 12,
                            },
                            {
                                default: () => h('button', 'Numeric'),
                            },
                        ),
                        h(
                            Tooltip,
                            {
                                content: 'Axis offset',
                                offset: {
                                    mainAxis: 20,
                                    crossAxis: -6,
                                },
                            },
                            {
                                default: () => h('button', 'Axis'),
                            },
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const [numericTooltip, axisTooltip] = [
            ...container.querySelectorAll('[role="tooltip"]'),
        ] as HTMLElement[];

        expect(numericTooltip.style.getPropertyValue('--_rp-tooltip-main-axis-offset')).toBe(
            '12px',
        );
        expect(numericTooltip.style.getPropertyValue('--_rp-tooltip-cross-axis-offset')).toBe('');
        expect(axisTooltip.style.getPropertyValue('--_rp-tooltip-main-axis-offset')).toBe('20px');
        expect(axisTooltip.style.getPropertyValue('--_rp-tooltip-cross-axis-offset')).toBe('-6px');
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

        expect(roots[2].querySelector('[role="tooltip"]')?.textContent).toBe('bottom slot');
    });
});
