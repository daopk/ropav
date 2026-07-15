import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { colors, placements } from '../../../tests/fixtures/tooltip';
import { flush, mountDom, queryDom, queryDomAll } from '../../../tests/utils/vue';
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

        const root = queryDom(container, '.rp-tooltip') as HTMLElement;
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;
        const hiddenTooltip = queryDom(container, '[role="tooltip"]') as HTMLElement;

        expect(trigger.getAttribute('aria-describedby')).toBe('copy-tooltip');
        expect(hiddenTooltip.id).toBe('copy-tooltip');
        expect(hiddenTooltip.style.display).toBe('none');

        root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        const tooltip = queryDom(container, '[role="tooltip"]') as HTMLElement;

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

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;
        const tooltip = queryDom(container, '.rp-tooltip__content') as HTMLElement;

        expect(trigger.getAttribute('aria-describedby')).toBeNull();
        expect(tooltip.id).toBe('decorative-tooltip');
        expect(tooltip.getAttribute('role')).toBeNull();
        expect(tooltip.getAttribute('aria-hidden')).toBe('true');
        expect(tooltip.textContent).toBe('Visual value');
    });

    it('renders a real arrow element when enabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        { arrow: true, content: 'Arrow help', open: true },
                        { default: () => h('button', 'Target') },
                    );
                },
            }),
        );

        await flush();

        const arrow = queryDom(container, '.rp-tooltip__arrow') as HTMLElement;
        expect(arrow.getAttribute('aria-hidden')).toBe('true');
        expect(arrow.dataset.side).toBe('top');
    });

    it('resolves final color variables for each supported color', async () => {
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

        const roots = [...queryDomAll(container, '.rp-tooltip')] as HTMLElement[];
        const contents = [...queryDomAll(container, '[role="tooltip"]')] as HTMLElement[];

        expect(roots).toHaveLength(colors.length);
        expect(contents).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-tooltip',
                'rp-tooltip--placement-top',
            ]);
            expect(contents[index].style.getPropertyValue('--_rp-tooltip-bg')).toBe(
                `var(--rp-color-${color}-filled)`,
            );
            expect(contents[index].style.getPropertyValue('--_rp-tooltip-fg')).toBe(
                'var(--rp-color-white)',
            );
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

        const root = queryDom(container, '.rp-tooltip') as HTMLElement;
        const content = queryDom(container, '[role="tooltip"]') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-tooltip', 'rp-tooltip--placement-top']);
        expect(content.style.getPropertyValue('--_rp-tooltip-bg')).toBe('#ff3366');
        expect(content.style.getPropertyValue('--_rp-tooltip-fg')).toBe('var(--rp-color-white)');
    });

    it('uses readable arbitrary color contrast when autoContrast is enabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tooltip,
                        {
                            autoContrast: true,
                            color: '#fab005',
                            content: 'Contrast help',
                        },
                        {
                            default: () => h('button', 'Contrast'),
                        },
                    );
                },
            }),
        );

        await flush();

        const content = queryDom(container, '[role="tooltip"]') as HTMLElement;

        expect(content.style.getPropertyValue('--_rp-tooltip-bg')).toBe('#fab005');
        expect(content.style.getPropertyValue('--_rp-tooltip-fg')).toBe('var(--rp-color-black)');
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
            ...queryDomAll(container, '[role="tooltip"]'),
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

        const roots = [...queryDomAll(container, '.rp-tooltip')] as HTMLElement[];

        expect(roots).toHaveLength(placements.length);
        for (const [index, placement] of placements.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-tooltip',
                `rp-tooltip--placement-${placement}`,
            ]);
        }

        roots[2].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        expect(document.querySelectorAll('[role="tooltip"]')[2]?.textContent).toBe('bottom slot');
    });
});
