import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';

import {
    flush,
    keydown,
    mountDom,
    mountDomWithApp,
    waitTransition,
} from '../../../tests/utils/vue';
import Tooltip from './tooltip.vue';
import type { TooltipPlacement, TooltipProps, TooltipSlotProps } from './types';
import { useTooltip } from './useTooltip';

describe('Tooltip', () => {
    const placements: TooltipPlacement[] = ['top', 'right', 'bottom', 'left'];
    const colors = [
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
        'neutral',
    ] as const;

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

        expect(roots).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-tooltip',
                'rp-tooltip--placement-top',
                `rp-tooltip--color-${color}`,
            ]);
        }
    });

    it('supports controlled visibility through the open prop', async () => {
        const props = reactive<TooltipProps>({
            content: 'Controlled help',
            open: false,
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

        expect(tooltip.isVisible.value).toBe(false);

        props.open = true;
        await nextTick();
        expect(tooltip.isVisible.value).toBe(true);
        expect(tooltip.rootClass.value).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-top',
            'rp-tooltip--open',
        ]);

        props.open = false;
        await nextTick();
        expect(tooltip.isVisible.value).toBe(false);
    });

    it('supports a selector target as an alternative trigger', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h('button', { id: 'selector-target' }, 'Selector target'),
                        h(Tooltip, {
                            content: 'Selector help',
                            id: 'selector-tooltip',
                            target: '#selector-target',
                            openDelay: 0,
                        }),
                    ]);
                },
            }),
        );

        await flush();

        const target = container.querySelector('#selector-target') as HTMLButtonElement;
        const root = container.querySelector('.rp-tooltip') as HTMLElement;
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;

        expect(target.getAttribute('aria-describedby')).toBe('selector-tooltip');
        expect([...root.classList]).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-top',
            'rp-tooltip--target',
        ]);
        expect(tooltip.style.display).toBe('none');

        target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();
        expect(root.classList.contains('rp-tooltip--open')).toBe(true);
        expect(tooltip.textContent).toBe('Selector help');
        expect(tooltip.style.display).not.toBe('none');

        target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, cancelable: true }));
        await waitTransition();
        expect(root.classList.contains('rp-tooltip--open')).toBe(false);
        expect(tooltip.style.display).toBe('none');

        target.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await flush();
        expect(root.classList.contains('rp-tooltip--open')).toBe(true);

        keydown(target, 'Escape');
        await waitTransition();
        expect(root.classList.contains('rp-tooltip--open')).toBe(false);
        expect(tooltip.style.display).toBe('none');
    });

    it('supports HTMLElement and ref object targets', async () => {
        const elementTarget = document.createElement('button');
        document.body.appendChild(elementTarget);

        const elementContainer = mountDom(
            defineComponent({
                render() {
                    return h(Tooltip, {
                        content: 'Element help',
                        id: 'element-tooltip',
                        target: elementTarget,
                        openDelay: 0,
                    });
                },
            }),
        );

        await flush();

        elementTarget.dispatchEvent(
            new MouseEvent('mouseenter', { bubbles: true, cancelable: true }),
        );
        await flush();

        expect(elementTarget.getAttribute('aria-describedby')).toBe('element-tooltip');
        expect(elementContainer.querySelector('[role="tooltip"]')?.textContent).toBe(
            'Element help',
        );

        const refContainer = mountDom(
            defineComponent({
                setup() {
                    const target = ref<HTMLElement | null>(null);
                    return () =>
                        h('div', [
                            h('button', { ref: target, class: 'ref-target' }, 'Ref target'),
                            h(Tooltip, {
                                content: 'Ref help',
                                id: 'ref-tooltip',
                                target,
                                openDelay: 0,
                            }),
                        ]);
                },
            }),
        );

        await flush();

        const refTarget = refContainer.querySelector('.ref-target') as HTMLButtonElement;
        refTarget.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        expect(refTarget.getAttribute('aria-describedby')).toBe('ref-tooltip');
        expect(refContainer.querySelector('[role="tooltip"]')?.textContent).toBe('Ref help');
    });

    it('appends and restores target aria-describedby on disabled, target change, and unmount', async () => {
        const firstTarget = document.createElement('button');
        const secondTarget = document.createElement('button');

        firstTarget.setAttribute('aria-describedby', 'first-help');
        secondTarget.setAttribute('aria-describedby', 'second-help');
        document.body.append(firstTarget, secondTarget);

        const props = reactive<TooltipProps>({
            content: 'Target help',
            id: 'target-tooltip',
            target: firstTarget,
            openDelay: 0,
            disabled: false,
        });

        const { unmount } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Tooltip, props);
                },
            }),
        );

        await flush();
        expect(firstTarget.getAttribute('aria-describedby')).toBe('first-help target-tooltip');

        props.disabled = true;
        await flush();
        expect(firstTarget.getAttribute('aria-describedby')).toBe('first-help');

        props.disabled = false;
        await flush();
        expect(firstTarget.getAttribute('aria-describedby')).toBe('first-help target-tooltip');

        props.target = secondTarget;
        await flush();
        expect(firstTarget.getAttribute('aria-describedby')).toBe('first-help');
        expect(secondTarget.getAttribute('aria-describedby')).toBe('second-help target-tooltip');

        unmount();
        expect(secondTarget.getAttribute('aria-describedby')).toBe('second-help');
    });

    it('positions target content from the target rect for each placement', async () => {
        const props = reactive<TooltipProps>({
            content: 'Positioned help',
            id: 'position-tooltip',
            placement: 'top',
            openDelay: 0,
        });

        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h('button', { id: 'position-target' }, 'Position target'),
                        h(Tooltip, {
                            ...props,
                            target: '#position-target',
                        }),
                    ]);
                },
            }),
        );

        await flush();

        const target = container.querySelector('#position-target') as HTMLButtonElement;
        target.getBoundingClientRect = vi.fn(
            () =>
                ({
                    x: 10,
                    y: 20,
                    top: 20,
                    right: 90,
                    bottom: 50,
                    left: 10,
                    width: 80,
                    height: 30,
                    toJSON: () => ({}),
                }) as DOMRect,
        );

        target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        const cases: Array<[TooltipPlacement, string, string]> = [
            ['top', '50px', '20px'],
            ['right', '90px', '35px'],
            ['bottom', '50px', '50px'],
            ['left', '10px', '35px'],
        ];

        for (const [placement, x, y] of cases) {
            props.placement = placement;
            await flush();

            expect(tooltip.style.getPropertyValue('--_rp-tooltip-target-x')).toBe(x);
            expect(tooltip.style.getPropertyValue('--_rp-tooltip-target-y')).toBe(y);
        }
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

        const root = container.querySelector('.rp-tooltip') as HTMLElement;
        expect(root.classList.contains('rp-tooltip--open')).toBe(true);
        expect(container.querySelector('[role="tooltip"]')?.textContent).toBe('Pinned help');
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

        const root = container.querySelector('.rp-tooltip') as HTMLElement;
        root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(true);
        expect(root.classList.contains('rp-tooltip--open')).toBe(false);
        expect((container.querySelector('[role="tooltip"]') as HTMLElement).style.display).toBe(
            'none',
        );
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

        expect((container.querySelector('[role="tooltip"]') as HTMLElement).style.display).toBe(
            'none',
        );

        vi.advanceTimersByTime(149);
        await nextTick();
        expect((container.querySelector('[role="tooltip"]') as HTMLElement).style.display).toBe(
            'none',
        );

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
        expect((container.querySelector('[role="tooltip"]') as HTMLElement).style.display).toBe(
            'none',
        );
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

        expect(roots[2].querySelector('[role="tooltip"]')?.textContent).toBe('bottom slot');
    });
});
