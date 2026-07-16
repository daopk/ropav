import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, shallowReactive } from 'vue';
import {
    flush,
    keydown,
    mountDom,
    mountDomWithApp,
    queryDom,
    waitTransition,
} from '../../../tests/utils/vue';
import DropdownMenuPortal from '../dropdown-menu/dropdown-menu-portal.vue';
import Tooltip from './tooltip.vue';
import type { TooltipPlacement, TooltipProps } from './types';

describe('Tooltip targets', () => {
    it('rebinds positioning when an ancestor portal moves the reference', async () => {
        const portalDisabled = ref(false);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        { class: 'tooltip-scroll-host', style: { overflow: 'auto' } },
                        h(
                            DropdownMenuPortal,
                            { disabled: portalDisabled.value },
                            {
                                default: () =>
                                    h(Tooltip, {
                                        id: 'ancestor-move-tooltip',
                                        content: 'Content',
                                        open: true,
                                        openDelay: 0,
                                        flip: false,
                                        shift: false,
                                    }),
                            },
                        ),
                    );
                },
            }),
        );

        await flush();
        const host = container.querySelector('.tooltip-scroll-host') as HTMLElement;
        const root = document.body.querySelector('.rp-tooltip') as HTMLElement;
        const getReferenceRect = vi.spyOn(root, 'getBoundingClientRect');

        portalDisabled.value = true;
        await flush();
        await vi.waitFor(() => expect(getReferenceRect).toHaveBeenCalled());

        getReferenceRect.mockClear();
        host.dispatchEvent(new Event('scroll'));
        await flush();

        expect(getReferenceRect).toHaveBeenCalled();
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

        const target = queryDom(container, '#selector-target') as HTMLButtonElement;
        const root = queryDom(container, '.rp-tooltip') as HTMLElement;
        const tooltip = queryDom(container, '[role="tooltip"]') as HTMLElement;

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
        await flush();
        expect(root.classList.contains('rp-tooltip--open')).toBe(false);
        expect(tooltip.style.display).toBe('none');

        target.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await flush();
        expect(root.classList.contains('rp-tooltip--open')).toBe(true);

        keydown(target, 'Escape');
        await waitTransition();
        await flush();
        expect(root.classList.contains('rp-tooltip--open')).toBe(false);
        expect(tooltip.style.display).toBe('none');
    });

    it('does not add descriptions to selector targets when decorative', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(
                            'button',
                            { id: 'decorative-target', 'aria-describedby': 'existing-help' },
                            'Selector target',
                        ),
                        h(Tooltip, {
                            content: 'Decorative help',
                            decorative: true,
                            id: 'decorative-target-tooltip',
                            target: '#decorative-target',
                            open: true,
                        }),
                    ]);
                },
            }),
        );

        await flush();

        const target = queryDom(container, '#decorative-target') as HTMLButtonElement;
        const tooltip = queryDom(container, '.rp-tooltip__content') as HTMLElement;

        expect(target.getAttribute('aria-describedby')).toBe('existing-help');
        expect(tooltip.getAttribute('role')).toBeNull();
        expect(tooltip.getAttribute('aria-hidden')).toBe('true');
        expect(tooltip.textContent).toBe('Decorative help');
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
        expect(queryDom(elementContainer, '[role="tooltip"]')?.textContent).toBe('Element help');

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

        const refTarget = queryDom(refContainer, '.ref-target') as HTMLButtonElement;
        refTarget.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();

        expect(refTarget.getAttribute('aria-describedby')).toBe('ref-tooltip');
        expect(queryDom(refContainer, '#ref-tooltip')?.textContent).toBe('Ref help');
    });

    it('appends and restores target aria-describedby on disabled, target change, and unmount', async () => {
        const firstTarget = document.createElement('button');
        const secondTarget = document.createElement('button');

        firstTarget.setAttribute('aria-describedby', 'first-help');
        secondTarget.setAttribute('aria-describedby', 'second-help');
        document.body.append(firstTarget, secondTarget);

        const props = shallowReactive<TooltipProps>({
            content: 'Target help',
            id: 'target-tooltip',
            target: firstTarget,
            openDelay: 0,
            flip: false,
            shift: false,
            disabled: false,
        });

        const { unmount } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Tooltip, { ...props });
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
        const props = shallowReactive<TooltipProps>({
            content: 'Positioned help',
            id: 'position-tooltip',
            placement: 'top',
            openDelay: 0,
            flip: false,
            shift: false,
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

        const target = queryDom(container, '#position-target') as HTMLButtonElement;
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

        const tooltip = queryDom(container, '[role="tooltip"]') as HTMLElement;
        const cases: TooltipPlacement[] = ['top', 'right', 'bottom', 'left'];

        for (const placement of cases) {
            props.placement = placement;
            await flush();
            await vi.waitFor(() => {
                expect(tooltip.style.visibility).not.toBe('hidden');
                expect(tooltip.dataset.placement).toBe(placement);
            });

            expect(tooltip.style.position).toBe('absolute');
        }
    });

    it('auto-updates on viewport changes and cleans up when hidden', async () => {
        const target = document.createElement('button');
        let targetRect = {
            top: 20,
            right: 90,
            bottom: 50,
            left: 10,
            width: 80,
            height: 30,
        };
        const getTargetRect = vi.fn(
            () =>
                ({
                    ...targetRect,
                    x: targetRect.left,
                    y: targetRect.top,
                    toJSON: () => ({}),
                }) as DOMRect,
        );
        target.getBoundingClientRect = getTargetRect;
        document.body.append(target);

        const props = shallowReactive<TooltipProps>({
            content: 'Throttled help',
            id: 'throttled-tooltip',
            open: true,
            openDelay: 0,
            target,
        });
        const { container, unmount } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Tooltip, { ...props });
                },
            }),
        );

        await flush();

        const tooltip = queryDom(container, '#throttled-tooltip') as HTMLElement;
        try {
            getTargetRect.mockClear();
            targetRect = {
                top: 40,
                right: 180,
                bottom: 80,
                left: 100,
                width: 80,
                height: 40,
            };
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new Event('scroll'));
            await flush();

            expect(getTargetRect).toHaveBeenCalled();
            expect(tooltip.style.left).not.toBe('');
            expect(tooltip.style.top).not.toBe('');

            props.open = false;
            await flush();
            getTargetRect.mockClear();
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));
            await flush();
            expect(getTargetRect).not.toHaveBeenCalled();
        } finally {
            unmount();
        }
    });
});
