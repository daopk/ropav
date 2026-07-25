import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { flush, mountDom, queryDom, waitForAssertion } from '../../../tests/utils/vue';
import HoverCard from './hover-card.vue';
import type {
    HoverCardContentSlotProps,
    HoverCardOpenChangeDetails,
    HoverCardSlotProps,
} from './types';

function dispatchPointer(
    target: EventTarget,
    type: string,
    pointerType: 'mouse' | 'pen' | 'touch' = 'mouse',
) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    target.dispatchEvent(event);
    return event as PointerEvent;
}

afterEach(() => {
    vi.useRealTimers();
});

describe('HoverCard', () => {
    it('marks the root and trigger disabled when content is missing', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        HoverCard,
                        {},
                        {
                            default: ({ triggerProps }: HoverCardSlotProps) =>
                                h(
                                    'a',
                                    { class: 'trigger', href: '#profile', ...triggerProps },
                                    'Ada',
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-hover-card') as HTMLElement;
        const trigger = queryDom(container, '.trigger') as HTMLAnchorElement;

        expect(root.getAttribute('data-state')).toBe('closed');
        expect(root.getAttribute('data-disabled')).toBe('');
        expect(trigger.getAttribute('data-disabled')).toBe('');
        expect(queryDom(container, '.rp-hover-card__content')).toBeNull();
    });

    it('renders controlled content, positioning attributes, styles, and an arrow', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        HoverCard,
                        {
                            id: 'ada-card',
                            open: true,
                            arrow: true,
                            placement: 'right',
                            baseZIndex: 2400,
                            offset: { mainAxis: 12, crossAxis: -4 },
                            classNames: {
                                root: 'custom-root',
                                trigger: 'custom-trigger',
                                content: 'custom-content',
                            },
                        },
                        {
                            default: ({ triggerProps }: HoverCardSlotProps) =>
                                h('a', { class: 'trigger', ...triggerProps }, 'Ada'),
                            content: () => 'Mathematician and writer',
                        },
                    );
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-hover-card') as HTMLElement;
        const trigger = queryDom(container, '.custom-trigger') as HTMLAnchorElement;
        const content = queryDom(container, '#ada-card') as HTMLElement;
        const arrow = queryDom(container, '.rp-hover-card__arrow') as HTMLElement;

        expect(root.classList).toContain('rp-hover-card--open');
        expect(root.classList).toContain('custom-root');
        expect(trigger.classList).toContain('custom-trigger');
        expect(content.classList).toContain('custom-content');
        expect(content.textContent).toContain('Mathematician and writer');
        expect(content.getAttribute('data-state')).toBe('open');
        expect(content.getAttribute('data-placement')).toBe('right');
        expect(content.style.zIndex).toBe('2400');
        expect(content.style.getPropertyValue('--_rp-hover-card-main-axis-offset')).toBe('12px');
        expect(content.style.getPropertyValue('--_rp-hover-card-cross-axis-offset')).toBe('-4px');
        expect(arrow.getAttribute('aria-hidden')).toBe('true');
        expect(arrow.dataset.side).toBe('right');
    });

    it('coordinates delayed hover across the trigger and teleported content', async () => {
        vi.useFakeTimers();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        HoverCard,
                        {
                            id: 'delayed-card',
                            openDelay: 100,
                            closeDelay: 150,
                        },
                        {
                            default: () => h('button', { class: 'trigger' }, 'Profile'),
                            content: () => h('a', { class: 'content-link' }, 'View profile'),
                        },
                    );
                },
            }),
        );

        await flush();
        const root = queryDom(container, '.rp-hover-card') as HTMLElement;

        dispatchPointer(root, 'pointerenter');
        vi.advanceTimersByTime(99);
        await nextTick();
        expect(queryDom(container, '#delayed-card')).toBeNull();

        vi.advanceTimersByTime(1);
        await flush();
        const content = queryDom(container, '#delayed-card') as HTMLElement;
        expect(content).not.toBeNull();

        dispatchPointer(root, 'pointerleave');
        vi.advanceTimersByTime(100);
        dispatchPointer(content, 'pointerenter');
        vi.advanceTimersByTime(100);
        await nextTick();
        expect(queryDom(container, '#delayed-card')).toBe(content);

        dispatchPointer(content, 'pointerleave');
        vi.advanceTimersByTime(149);
        expect(queryDom(container, '#delayed-card')).toBe(content);

        vi.advanceTimersByTime(1);
        await flush();
        vi.runAllTimers();
        await flush();
        expect(queryDom(container, '#delayed-card')).toBeNull();
    });

    it('opens on focus, closes on Escape, and emits interaction details', async () => {
        const updates: boolean[] = [];
        const changes: Array<[boolean, HoverCardOpenChangeDetails]> = [];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        HoverCard,
                        {
                            id: 'keyboard-card',
                            'onUpdate:open': (open: boolean) => updates.push(open),
                            onOpenChange: (open: boolean, details: HoverCardOpenChangeDetails) =>
                                changes.push([open, details]),
                        },
                        {
                            default: () => h('button', { class: 'trigger' }, 'Profile'),
                            content: () => 'Keyboard details',
                        },
                    );
                },
            }),
        );

        await flush();
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await flush();
        expect(queryDom(container, '#keyboard-card')).not.toBeNull();
        expect(changes.at(-1)?.[1].reason).toBe('focus');

        document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
        await waitForAssertion(() => {
            expect(queryDom(container, '#keyboard-card')).toBeNull();
        });
        expect(updates).toEqual([true, false]);
        expect(changes.at(-1)?.[1].reason).toBe('escape');
    });

    it('supports an external selector target and uses the default slot as content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h('a', { id: 'external-profile', href: '#ada' }, 'Ada'),
                        h(
                            HoverCard,
                            {
                                id: 'external-card',
                                target: '#external-profile',
                                openDelay: 0,
                            },
                            {
                                default: () => 'External profile details',
                            },
                        ),
                    ]);
                },
            }),
        );

        await flush();
        const target = queryDom(container, '#external-profile') as HTMLAnchorElement;
        const root = queryDom(container, '.rp-hover-card') as HTMLElement;

        expect(root.classList).toContain('rp-hover-card--target');
        expect(root.textContent).toBe('');

        dispatchPointer(target, 'pointerenter');
        await flush();

        const content = queryDom(container, '#external-card') as HTMLElement;
        expect(content.textContent).toContain('External profile details');
    });

    it('exposes immediate slot controls and preserves keep-mounted content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        HoverCard,
                        {
                            id: 'persistent-card',
                            keepMounted: true,
                        },
                        {
                            default: ({ open }: HoverCardSlotProps) =>
                                h('button', { class: 'open', onClick: open }, 'Open'),
                            content: ({ close }: HoverCardContentSlotProps) =>
                                h('button', { class: 'close', onClick: close }, 'Close'),
                        },
                    );
                },
            }),
        );

        await flush();
        const content = queryDom(container, '#persistent-card') as HTMLElement;
        expect(content.style.display).toBe('none');

        (queryDom(container, '.open') as HTMLButtonElement).click();
        await flush();
        expect(content.style.display).not.toBe('none');

        (queryDom(container, '.close') as HTMLButtonElement).click();
        await waitForAssertion(() => {
            expect(queryDom(container, '#persistent-card')).toBe(content);
            expect(content.style.display).toBe('none');
        });
    });
});
