import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive, ref } from 'vue';

import {
    flush,
    keydown,
    mountDom,
    mountDomWithApp,
    waitTransition,
} from '../../../tests/utils/vue';
import { mockAnimationFrames } from '../../../tests/utils/raf';
import Tooltip from './tooltip.vue';
import type { TooltipPlacement, TooltipProps } from './types';

describe('Tooltip targets', () => {
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

        const target = container.querySelector('#decorative-target') as HTMLButtonElement;
        const tooltip = container.querySelector('.rp-tooltip__content') as HTMLElement;

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

    it('coalesces viewport repositioning and cancels pending work when hidden', async () => {
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

        const props = reactive<TooltipProps>({
            content: 'Throttled help',
            id: 'throttled-tooltip',
            open: true,
            openDelay: 0,
            target,
        });
        const { container, unmount } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Tooltip, props);
                },
            }),
        );

        await flush();

        const tooltip = container.querySelector('#throttled-tooltip') as HTMLElement;
        const frames = mockAnimationFrames();

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

            expect(frames.request).toHaveBeenCalledOnce();
            expect(frames.pendingCount()).toBe(1);
            expect(getTargetRect).not.toHaveBeenCalled();

            frames.flushFrame();
            await flush();

            expect(getTargetRect).toHaveBeenCalledOnce();
            expect(tooltip.style.getPropertyValue('--_rp-tooltip-target-x')).toBe('140px');
            expect(tooltip.style.getPropertyValue('--_rp-tooltip-target-y')).toBe('40px');

            window.dispatchEvent(new Event('scroll'));
            expect(frames.pendingCount()).toBe(1);
            const pendingPositionFrame = frames.request.mock.results.at(-1)?.value;

            props.open = false;
            await flush();
            expect(frames.cancel).toHaveBeenCalledWith(pendingPositionFrame);

            frames.flushFrame();
            expect(getTargetRect).toHaveBeenCalledOnce();
        } finally {
            unmount();
            frames.restore();
        }
    });
});
