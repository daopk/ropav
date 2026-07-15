import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, shallowReactive } from 'vue';
import {
    click,
    flush,
    keydown,
    mountDom,
    mountDomWithApp,
    queryDom,
    queryDomAll,
    waitTransition,
} from '../../../tests/utils/vue';
import Popover from './popover.vue';
import { popoverPlacements } from './types';
import type {
    PopoverContentSlotProps,
    PopoverPlacement,
    PopoverProps,
    PopoverSlotProps,
} from './types';

function tab(shiftKey = false) {
    (document.activeElement ?? document).dispatchEvent(
        new KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
            shiftKey,
        }),
    );
}

describe('Popover', () => {
    const placements: readonly PopoverPlacement[] = popoverPlacements;

    it('marks the root and trigger disabled when content is missing', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        {},
                        {
                            default: ({ triggerProps }: PopoverSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Target'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-popover') as HTMLElement;
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        expect(root.getAttribute('data-disabled')).toBe('');
        expect(trigger.getAttribute('data-disabled')).toBe('');
    });

    it('renders trigger slot props and toggles interactive content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        {
                            id: 'account-popover',
                            ariaLabel: 'Account actions',
                        },
                        {
                            default: ({ triggerProps, isOpen }: PopoverSlotProps) =>
                                h(
                                    'button',
                                    { class: 'trigger', ...triggerProps },
                                    isOpen ? 'Close account' : 'Open account',
                                ),
                            content: ({ close }: PopoverContentSlotProps) =>
                                h('button', { class: 'inside', onClick: close }, 'Close panel'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-popover') as HTMLElement;
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        expect([...root.classList]).toEqual(['rp-popover', 'rp-popover--placement-bottom']);
        expect(trigger.getAttribute('aria-controls')).toBe('account-popover');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
        expect(queryDom(container, '#account-popover')).toBeNull();

        click(trigger);
        await flush();

        const popover = queryDom(container, '#account-popover') as HTMLElement;
        expect(root.classList.contains('rp-popover--open')).toBe(true);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(popover.getAttribute('role')).toBe('dialog');
        expect(popover.getAttribute('aria-label')).toBe('Account actions');
        expect(popover.style.display).not.toBe('none');

        click(queryDom(container, '.inside') as HTMLButtonElement);
        await waitTransition();

        expect(root.classList.contains('rp-popover--open')).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(queryDom(container, '#account-popover')).toBeNull();
    });

    it('keeps mounted content hidden and preserves its state when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        {
                            id: 'persistent-popover',
                            keepMounted: true,
                        },
                        {
                            default: ({ triggerProps }: PopoverSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Toggle'),
                            content: () =>
                                h('input', { class: 'persistent-input', value: 'Initial' }),
                        },
                    );
                },
            }),
        );

        await flush();

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;
        const popover = queryDom(container, '#persistent-popover') as HTMLElement;
        const input = queryDom(container, '.persistent-input') as HTMLInputElement;

        expect(popover.style.display).toBe('none');
        input.value = 'Edited';

        click(trigger);
        await flush();

        expect(queryDom(container, '#persistent-popover')).toBe(popover);
        expect(popover.style.display).not.toBe('none');

        click(trigger);
        await waitTransition();

        expect(queryDom(container, '#persistent-popover')).toBe(popover);
        expect(popover.style.display).toBe('none');
        expect((queryDom(container, '.persistent-input') as HTMLInputElement).value).toBe('Edited');
    });

    it('renders a real arrow element when enabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        { arrow: true, open: true },
                        {
                            default: () => h('button', 'Target'),
                            content: () => h('span', 'Arrow content'),
                        },
                    );
                },
            }),
        );

        await flush();

        const arrow = queryDom(container, '.rp-popover__arrow') as HTMLElement;
        expect(arrow.getAttribute('aria-hidden')).toBe('true');
        expect(arrow.dataset.side).toBe('bottom');
    });

    it('supports labelled and described dialog content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        {
                            id: 'labelled-popover',
                            open: true,
                            ariaLabelledby: 'labelled-popover-title',
                            ariaDescribedby: 'labelled-popover-description',
                        },
                        {
                            content: () =>
                                h('div', [
                                    h('h2', { id: 'labelled-popover-title' }, 'Project status'),
                                    h(
                                        'p',
                                        { id: 'labelled-popover-description' },
                                        'Ready for release.',
                                    ),
                                ]),
                        },
                    );
                },
            }),
        );

        await flush();

        const popover = queryDom(container, '#labelled-popover') as HTMLElement;

        expect(popover.getAttribute('role')).toBe('dialog');
        expect(popover.getAttribute('aria-labelledby')).toBe('labelled-popover-title');
        expect(popover.getAttribute('aria-describedby')).toBe('labelled-popover-description');
    });

    it('keeps content clicks inside and closes on outside click and Escape', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        {
                            id: 'outside-popover',
                        },
                        {
                            default: ({ triggerProps }: PopoverSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Open'),
                            content: () => h('button', { class: 'inside' }, 'Inside action'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-popover') as HTMLElement;
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        click(trigger);
        await flush();
        expect(root.classList.contains('rp-popover--open')).toBe(true);

        const inside = queryDom(container, '.inside') as HTMLButtonElement;
        click(inside);
        await flush();
        expect(root.classList.contains('rp-popover--open')).toBe(true);

        click(document.body);
        await waitTransition();
        expect(root.classList.contains('rp-popover--open')).toBe(false);

        click(trigger);
        await flush();
        keydown(document, 'Escape');
        await waitTransition();
        expect(root.classList.contains('rp-popover--open')).toBe(false);
    });

    it('optionally traps focus across the trigger and content', async () => {
        const outside = document.createElement('button');
        outside.textContent = 'Outside';
        document.body.append(outside);

        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        {
                            id: 'focus-popover',
                            trapFocus: true,
                            focusTrapOptions: {
                                delayInitialFocus: false,
                                delayReturnFocus: false,
                                tabbableOptions: { displayCheck: 'none' },
                            },
                        },
                        {
                            default: ({ triggerProps }: PopoverSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Open'),
                            content: () => [
                                h('button', { class: 'first' }, 'First action'),
                                h('button', { class: 'last' }, 'Last action'),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;
        trigger.focus();
        click(trigger);
        await flush();

        const content = queryDom(container, '#focus-popover') as HTMLElement;
        const last = queryDom(container, '.last') as HTMLButtonElement;

        expect(content.tabIndex).toBe(-1);
        expect(document.activeElement).toBe(trigger);

        last.focus();
        tab();
        expect(document.activeElement).toBe(trigger);

        tab(true);
        expect(document.activeElement).toBe(last);

        keydown(document, 'Escape');
        await waitTransition();
        expect(document.activeElement).toBe(trigger);

        click(trigger);
        await flush();
        outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        outside.focus();
        click(outside);
        await waitTransition();

        expect(document.activeElement).toBe(outside);
    });

    it('supports a selector target as the trigger and renders default content in target mode', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h('button', { id: 'selector-target' }, 'Selector target'),
                        h(
                            Popover,
                            {
                                id: 'selector-popover',
                                target: '#selector-target',
                            },
                            {
                                default: () => h('p', 'Selector popover body'),
                            },
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const target = queryDom(container, '#selector-target') as HTMLButtonElement;
        const root = queryDom(container, '.rp-popover') as HTMLElement;

        expect(target.getAttribute('aria-controls')).toBe('selector-popover');
        expect(target.getAttribute('aria-expanded')).toBe('false');
        expect(target.getAttribute('aria-haspopup')).toBe('dialog');
        expect([...root.classList]).toEqual([
            'rp-popover',
            'rp-popover--placement-bottom',
            'rp-popover--target',
        ]);
        expect(queryDom(container, '#selector-popover')).toBeNull();

        click(target);
        await flush();

        const popover = queryDom(container, '#selector-popover') as HTMLElement;
        expect(root.classList.contains('rp-popover--open')).toBe(true);
        expect(target.getAttribute('aria-expanded')).toBe('true');
        expect(popover.textContent).toBe('Selector popover body');
        expect(popover.style.display).not.toBe('none');

        click(target);
        await waitTransition();

        expect(root.classList.contains('rp-popover--open')).toBe(false);
        expect(target.getAttribute('aria-expanded')).toBe('false');
        expect(queryDom(container, '#selector-popover')).toBeNull();
    });

    it('positions target content from the target rect for each placement', async () => {
        const props = shallowReactive<PopoverProps>({
            id: 'position-popover',
            placement: 'top',
            target: '#position-target',
            flip: false,
            shift: false,
        });

        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h('button', { id: 'position-target' }, 'Position target'),
                        h(
                            Popover,
                            { ...props },
                            {
                                default: () => h('p', 'Positioned content'),
                            },
                        ),
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

        click(target);
        await flush();

        const popover = queryDom(container, '#position-popover') as HTMLElement;
        const cases: PopoverPlacement[] = [...popoverPlacements];

        for (const placement of cases) {
            props.placement = placement;
            await flush();
            await vi.waitFor(() => {
                expect(popover.style.visibility).not.toBe('hidden');
                expect(popover.dataset.placement).toBe(placement);
            });

            expect(popover.style.position).toBe('absolute');
        }
    });

    it('keeps target content positioned after changing an open target', async () => {
        const firstTarget = document.createElement('button');
        const secondTarget = document.createElement('button');

        let secondRect = {
            top: 20,
            right: 90,
            bottom: 50,
            left: 10,
            width: 80,
            height: 30,
        };

        firstTarget.getBoundingClientRect = vi.fn(
            () =>
                ({
                    top: 12,
                    right: 70,
                    bottom: 36,
                    left: 30,
                    width: 40,
                    height: 24,
                    toJSON: () => ({}),
                }) as DOMRect,
        );
        secondTarget.getBoundingClientRect = vi.fn(
            () =>
                ({
                    ...secondRect,
                    x: secondRect.left,
                    y: secondRect.top,
                    toJSON: () => ({}),
                }) as DOMRect,
        );

        document.body.append(firstTarget, secondTarget);

        const props = shallowReactive<PopoverProps>({
            id: 'retarget-popover',
            target: firstTarget,
            open: true,
            flip: false,
            shift: false,
        });

        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        { ...props },
                        {
                            default: () => h('p', 'Retargeted content'),
                        },
                    );
                },
            }),
        );

        await flush();

        const popover = queryDom(container, '#retarget-popover') as HTMLElement;
        await vi.waitFor(() => {
            expect(firstTarget.getBoundingClientRect).toHaveBeenCalled();
            expect(popover.style.visibility).not.toBe('hidden');
        });

        props.target = secondTarget;
        await flush();

        await vi.waitFor(() => {
            expect(secondTarget.getBoundingClientRect).toHaveBeenCalled();
            expect(popover.style.visibility).not.toBe('hidden');
        });

        secondRect = {
            top: 48,
            right: 160,
            bottom: 88,
            left: 80,
            width: 80,
            height: 40,
        };
        window.dispatchEvent(new Event('resize'));
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        await flush();

        expect(secondTarget.getBoundingClientRect).toHaveBeenCalled();
        expect(popover.style.visibility).not.toBe('hidden');
    });

    it('auto-updates on viewport changes and cleans up when closed', async () => {
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

        const props = shallowReactive<PopoverProps>({
            id: 'throttled-popover',
            open: true,
            target,
        });
        const { container, unmount } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        { ...props },
                        {
                            default: () => h('p', 'Throttled content'),
                        },
                    );
                },
            }),
        );

        await flush();

        const popover = queryDom(container, '#throttled-popover') as HTMLElement;
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
            expect(popover.style.left).not.toBe('');
            expect(popover.style.top).not.toBe('');

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

    it('emits update:open from trigger interactions when controlled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        {
                            id: 'controlled-popover',
                            open: false,
                            'onUpdate:open': onUpdate,
                        },
                        {
                            default: ({ triggerProps }: PopoverSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Open'),
                            content: () => h('p', 'Controlled content'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-popover') as HTMLElement;
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        click(trigger);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(true);
        expect(root.classList.contains('rp-popover--open')).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('applies offset style variables', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(
                            Popover,
                            {
                                id: 'numeric-offset',
                                offset: 12,
                                open: true,
                            },
                            {
                                content: () => h('p', 'Numeric offset'),
                            },
                        ),
                        h(
                            Popover,
                            {
                                id: 'axis-offset',
                                offset: {
                                    mainAxis: 20,
                                    crossAxis: -6,
                                },
                                open: true,
                            },
                            {
                                content: () => h('p', 'Axis offset'),
                            },
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const numericPopover = queryDom(container, '#numeric-offset') as HTMLElement;
        const axisPopover = queryDom(container, '#axis-offset') as HTMLElement;

        expect(numericPopover.style.getPropertyValue('--_rp-popover-main-axis-offset')).toBe(
            '12px',
        );
        expect(numericPopover.style.getPropertyValue('--_rp-popover-cross-axis-offset')).toBe('');
        expect(axisPopover.style.getPropertyValue('--_rp-popover-main-axis-offset')).toBe('20px');
        expect(axisPopover.style.getPropertyValue('--_rp-popover-cross-axis-offset')).toBe('-6px');
    });

    it('restores target aria attributes on disabled, target change, and unmount', async () => {
        const firstTarget = document.createElement('button');
        const secondTarget = document.createElement('button');

        firstTarget.setAttribute('aria-controls', 'first-panel');
        firstTarget.setAttribute('aria-expanded', 'true');
        firstTarget.setAttribute('aria-haspopup', 'menu');
        secondTarget.setAttribute('aria-controls', 'second-panel');

        document.body.append(firstTarget, secondTarget);

        const props = shallowReactive<PopoverProps>({
            id: 'restore-popover',
            target: firstTarget,
            disabled: false,
        });

        const { unmount } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(
                        Popover,
                        { ...props },
                        {
                            default: () => h('p', 'Restored content'),
                        },
                    );
                },
            }),
        );

        await flush();
        expect(firstTarget.getAttribute('aria-controls')).toBe('first-panel restore-popover');
        expect(firstTarget.getAttribute('aria-expanded')).toBe('false');
        expect(firstTarget.getAttribute('aria-haspopup')).toBe('dialog');

        props.disabled = true;
        await flush();
        expect(firstTarget.getAttribute('aria-controls')).toBe('first-panel');
        expect(firstTarget.getAttribute('aria-expanded')).toBe('true');
        expect(firstTarget.getAttribute('aria-haspopup')).toBe('menu');

        props.disabled = false;
        await flush();
        expect(firstTarget.getAttribute('aria-controls')).toBe('first-panel restore-popover');

        props.target = secondTarget;
        await flush();
        expect(firstTarget.getAttribute('aria-controls')).toBe('first-panel');
        expect(firstTarget.getAttribute('aria-expanded')).toBe('true');
        expect(firstTarget.getAttribute('aria-haspopup')).toBe('menu');
        expect(secondTarget.getAttribute('aria-controls')).toBe('second-panel restore-popover');

        unmount();
        expect(secondTarget.getAttribute('aria-controls')).toBe('second-panel');
    });

    it('adds placement modifiers for all placements', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        placements.map((placement) =>
                            h(
                                Popover,
                                {
                                    placement,
                                    open: true,
                                },
                                {
                                    content: () => h('p', placement),
                                },
                            ),
                        ),
                    );
                },
            }),
        );

        await flush();

        const roots = [...queryDomAll(container, '.rp-popover')] as HTMLElement[];

        expect(roots).toHaveLength(placements.length);
        for (const [index, placement] of placements.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-popover',
                `rp-popover--placement-${placement}`,
                'rp-popover--open',
            ]);
        }
    });
});
