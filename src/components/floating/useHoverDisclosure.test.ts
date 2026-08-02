import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, shallowRef } from 'vue';
import { flush, mountDom, mountDomWithApp, queryDom } from '../../../tests/utils/vue';
import type {
    FloatingReference,
    HoverDisclosureOpenChangeDetails,
    UseHoverDisclosureOptions,
} from './types';
import { useHoverDisclosure } from './useHoverDisclosure';

function pointerEvent(type: string, pointerType: 'mouse' | 'pen' | 'touch' = 'mouse') {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    return event as PointerEvent;
}

function dispatchPointer(
    target: EventTarget,
    type: string,
    pointerType: 'mouse' | 'pen' | 'touch' = 'mouse',
) {
    const event = pointerEvent(type, pointerType);
    target.dispatchEvent(event);
    return event;
}

function mountDisclosure(options: Readonly<UseHoverDisclosureOptions> = {}) {
    let disclosure!: ReturnType<typeof useHoverDisclosure>;
    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                disclosure = useHoverDisclosure(options);
                return () =>
                    h('div', [
                        h(
                            'button',
                            { class: 'trigger', ...disclosure.triggerProps.value },
                            'Trigger',
                        ),
                        disclosure.isOpen.value
                            ? h(
                                  'section',
                                  { class: 'content', ...disclosure.contentProps.value },
                                  'Content',
                              )
                            : null,
                    ]);
            },
        }),
    );

    return {
        ...mounted,
        get disclosure() {
            return disclosure;
        },
    };
}

afterEach(() => {
    vi.useRealTimers();
});

describe('useHoverDisclosure', () => {
    it('supports uncontrolled defaults and immediate programmatic controls', () => {
        const { disclosure } = mountDisclosure({ defaultOpen: true });

        expect(disclosure.isOpen.value).toBe(true);
        expect(disclosure.state.value).toBe('open');

        disclosure.close();
        expect(disclosure.isOpen.value).toBe(false);
        expect(disclosure.state.value).toBe('closed');

        disclosure.toggle();
        expect(disclosure.isOpen.value).toBe(true);
    });

    it('coordinates open and close delays across trigger and content hover', async () => {
        vi.useFakeTimers();
        const { container, disclosure } = mountDisclosure({
            openDelay: 100,
            closeDelay: 150,
        });
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        dispatchPointer(trigger, 'pointerenter');
        vi.advanceTimersByTime(99);
        await nextTick();
        expect(disclosure.isOpen.value).toBe(false);

        vi.advanceTimersByTime(1);
        await nextTick();
        expect(disclosure.isOpen.value).toBe(true);

        const content = queryDom(container, '.content') as HTMLElement;
        dispatchPointer(trigger, 'pointerleave');
        vi.advanceTimersByTime(100);
        dispatchPointer(content, 'pointerenter');
        vi.advanceTimersByTime(100);
        await nextTick();
        expect(disclosure.isOpen.value).toBe(true);

        dispatchPointer(content, 'pointerleave');
        vi.advanceTimersByTime(149);
        expect(disclosure.isOpen.value).toBe(true);

        vi.advanceTimersByTime(1);
        await nextTick();
        expect(disclosure.isOpen.value).toBe(false);
    });

    it('opens immediately on keyboard focus and stays open while focus moves to content', async () => {
        vi.useFakeTimers();
        const { container, disclosure } = mountDisclosure({
            openDelay: 500,
            closeDelay: 50,
        });
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await nextTick();
        expect(disclosure.isOpen.value).toBe(true);

        const content = queryDom(container, '.content') as HTMLElement;
        trigger.dispatchEvent(
            new FocusEvent('focusout', { bubbles: true, relatedTarget: content }),
        );
        content.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: trigger }));
        vi.advanceTimersByTime(50);
        expect(disclosure.isOpen.value).toBe(true);

        content.dispatchEvent(
            new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }),
        );
        vi.advanceTimersByTime(50);
        await nextTick();
        expect(disclosure.isOpen.value).toBe(false);
    });

    it('dismisses on document Escape without reopening until a new trigger interaction', async () => {
        const changes: Array<[boolean, HoverDisclosureOpenChangeDetails]> = [];
        const { container, disclosure } = mountDisclosure({
            onOpenChange(open, details) {
                changes.push([open, details]);
            },
        });
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        dispatchPointer(trigger, 'pointerenter');
        expect(disclosure.isOpen.value).toBe(true);

        document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
        expect(disclosure.isOpen.value).toBe(false);
        expect(changes.at(-1)?.[1].reason).toBe('escape');

        await nextTick();
        expect(disclosure.isOpen.value).toBe(false);

        dispatchPointer(trigger, 'pointerleave');
        dispatchPointer(trigger, 'pointerenter');
        expect(disclosure.isOpen.value).toBe(true);
    });

    it('clears removed content activity after forced dismissal', async () => {
        vi.useFakeTimers();
        const { container, disclosure } = mountDisclosure({ closeDelay: 100 });
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        dispatchPointer(trigger, 'pointerenter');
        await nextTick();
        const content = queryDom(container, '.content') as HTMLElement;
        dispatchPointer(trigger, 'pointerleave');
        dispatchPointer(content, 'pointerenter');

        document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
        await nextTick();
        expect(disclosure.isOpen.value).toBe(false);
        expect(queryDom(container, '.content')).toBeNull();

        dispatchPointer(trigger, 'pointerenter');
        await nextTick();
        expect(disclosure.isOpen.value).toBe(true);

        dispatchPointer(trigger, 'pointerleave');
        vi.advanceTimersByTime(100);
        await nextTick();
        expect(disclosure.isOpen.value).toBe(false);
    });

    it('keeps controlled state external while emitting paired interaction requests', async () => {
        vi.useFakeTimers();
        const model = reactive({ open: false });
        const onOpenChange = vi.fn();
        const { container, disclosure } = mountDisclosure({
            open: () => model.open,
            closeDelay: 0,
            onOpenChange,
        });
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        dispatchPointer(trigger, 'pointerenter');
        dispatchPointer(trigger, 'pointerenter');
        expect(onOpenChange).toHaveBeenLastCalledWith(
            true,
            expect.objectContaining({ reason: 'hover' }),
        );
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(disclosure.isOpen.value).toBe(false);

        model.open = true;
        await nextTick();
        expect(disclosure.isOpen.value).toBe(true);

        dispatchPointer(trigger, 'pointerleave');
        vi.advanceTimersByTime(0);
        expect(onOpenChange).toHaveBeenLastCalledWith(
            false,
            expect.objectContaining({ reason: 'hover' }),
        );
        expect(disclosure.isOpen.value).toBe(true);

        model.open = false;
        await nextTick();
        expect(disclosure.isOpen.value).toBe(false);
    });

    it('ignores touch by default and supports opt-in toggle with outside dismissal', () => {
        const touchBehavior = shallowRef<'none' | 'toggle'>('none');
        const { container, disclosure } = mountDisclosure({ touchBehavior });
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        dispatchPointer(trigger, 'pointerdown', 'touch');
        dispatchPointer(trigger, 'pointerup', 'touch');
        const ignoredClick = new MouseEvent('click', { bubbles: true, cancelable: true });
        trigger.dispatchEvent(ignoredClick);
        expect(ignoredClick.defaultPrevented).toBe(false);
        expect(disclosure.isOpen.value).toBe(false);

        touchBehavior.value = 'toggle';
        for (const pointerType of ['mouse', 'pen'] as const) {
            dispatchPointer(trigger, 'pointerdown', pointerType);
            dispatchPointer(trigger, 'pointerup', pointerType);
            const pointerClick = new MouseEvent('click', { bubbles: true, cancelable: true });
            trigger.dispatchEvent(pointerClick);
            expect(pointerClick.defaultPrevented).toBe(false);
            expect(disclosure.isOpen.value).toBe(false);
        }

        dispatchPointer(trigger, 'pointerdown', 'touch');
        dispatchPointer(trigger, 'pointercancel', 'touch');
        dispatchPointer(trigger, 'pointerup', 'touch');
        const canceledClick = new MouseEvent('click', { bubbles: true, cancelable: true });
        trigger.dispatchEvent(canceledClick);
        expect(canceledClick.defaultPrevented).toBe(false);
        expect(disclosure.isOpen.value).toBe(false);

        dispatchPointer(trigger, 'pointerdown', 'touch');
        dispatchPointer(trigger, 'pointerup', 'touch');
        const toggleClick = new MouseEvent('click', { bubbles: true, cancelable: true });
        trigger.dispatchEvent(toggleClick);
        expect(toggleClick.defaultPrevented).toBe(true);
        expect(disclosure.isOpen.value).toBe(true);

        dispatchPointer(document.body, 'pointerdown');
        expect(disclosure.isOpen.value).toBe(false);
    });

    it.each([
        {
            expectedOpen: false,
            focusTiming: 'before pointerup',
            touchBehavior: 'none' as const,
        },
        {
            expectedOpen: true,
            focusTiming: 'before pointerup',
            touchBehavior: 'toggle' as const,
        },
        {
            expectedOpen: false,
            focusTiming: 'after pointerup',
            touchBehavior: 'none' as const,
        },
        {
            expectedOpen: true,
            focusTiming: 'after pointerup',
            touchBehavior: 'toggle' as const,
        },
    ])(
        'handles touch focus $focusTiming with $touchBehavior behavior',
        ({ expectedOpen, focusTiming, touchBehavior }) => {
            const onOpenChange =
                vi.fn<(open: boolean, details: HoverDisclosureOpenChangeDetails) => void>();
            const { container, disclosure } = mountDisclosure({
                onOpenChange,
                touchBehavior,
            });
            const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

            dispatchPointer(trigger, 'pointerdown', 'touch');
            if (focusTiming === 'before pointerup') {
                trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            }
            dispatchPointer(trigger, 'pointerup', 'touch');
            if (focusTiming === 'after pointerup') {
                trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            }
            trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

            expect(disclosure.isOpen.value).toBe(expectedOpen);
            expect(
                onOpenChange.mock.calls.map(([open, details]) => [open, details.reason]),
            ).toEqual(expectedOpen ? [[true, 'touch']] : []);
        },
    );

    it('expires a missing touch compatibility click before later keyboard focus', () => {
        vi.useFakeTimers();
        const changes: Array<[boolean, HoverDisclosureOpenChangeDetails]> = [];
        const { container, disclosure } = mountDisclosure({
            onOpenChange(open, details) {
                changes.push([open, details]);
            },
            touchBehavior: 'toggle',
        });
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        dispatchPointer(trigger, 'pointerdown', 'touch');
        dispatchPointer(trigger, 'pointerup', 'touch');
        vi.runOnlyPendingTimers();
        trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

        expect(disclosure.isOpen.value).toBe(true);
        expect(changes.map(([open, details]) => [open, details.reason])).toEqual([[true, 'focus']]);
    });

    it('keeps inline content touch actions out of an ancestor interaction target', async () => {
        const onContentClick = vi.fn();
        let disclosure!: ReturnType<typeof useHoverDisclosure>;
        const container = mountDom(
            defineComponent({
                setup() {
                    disclosure = useHoverDisclosure({
                        defaultOpen: true,
                        interactionTarget: '#inline-trigger',
                        contentTarget: '#inline-content',
                        touchBehavior: 'toggle',
                    });
                    return () =>
                        h('div', { id: 'inline-trigger' }, [
                            h('section', { id: 'inline-content' }, [
                                h(
                                    'button',
                                    {
                                        class: 'content-action',
                                        onClick: onContentClick,
                                        type: 'button',
                                    },
                                    'Content action',
                                ),
                            ]),
                        ]);
                },
            }),
        );
        await flush();
        const trigger = queryDom(container, '#inline-trigger') as HTMLElement;
        const contentAction = queryDom(container, '.content-action') as HTMLButtonElement;

        dispatchPointer(contentAction, 'pointerdown', 'touch');
        dispatchPointer(contentAction, 'pointerup', 'touch');
        const contentClick = new MouseEvent('click', { bubbles: true, cancelable: true });
        contentAction.dispatchEvent(contentClick);

        expect(onContentClick).toHaveBeenCalledOnce();
        expect(contentClick.defaultPrevented).toBe(false);
        expect(disclosure.isOpen.value).toBe(true);

        dispatchPointer(trigger, 'pointerdown', 'touch');
        dispatchPointer(trigger, 'pointerup', 'touch');
        const triggerClick = new MouseEvent('click', { bubbles: true, cancelable: true });
        trigger.dispatchEvent(triggerClick);

        expect(triggerClick.defaultPrevented).toBe(true);
        expect(disclosure.isOpen.value).toBe(false);
    });

    it('does not complete a touch sequence across selector target replacement', async () => {
        const original = document.createElement('button');
        original.id = 'replaceable-touch-trigger';
        document.body.append(original);
        let disclosure!: ReturnType<typeof useHoverDisclosure>;

        mountDom(
            defineComponent({
                setup() {
                    disclosure = useHoverDisclosure({
                        interactionTarget: '#replaceable-touch-trigger',
                        touchBehavior: 'toggle',
                    });
                    return () => h('div');
                },
            }),
        );
        await flush();

        dispatchPointer(original, 'pointerdown', 'touch');

        const replacement = document.createElement('button');
        replacement.id = original.id;
        original.replaceWith(replacement);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        await flush();

        dispatchPointer(replacement, 'pointerup', 'touch');
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });
        replacement.dispatchEvent(click);

        expect(click.defaultPrevented).toBe(false);
        expect(disclosure.isOpen.value).toBe(false);

        dispatchPointer(replacement, 'pointerdown', 'touch');
        dispatchPointer(replacement, 'pointerup', 'touch');
        const replacementClick = new MouseEvent('click', { bubbles: true, cancelable: true });
        replacement.dispatchEvent(replacementClick);

        expect(replacementClick.defaultPrevented).toBe(true);
        expect(disclosure.isOpen.value).toBe(true);
    });

    it('binds external virtual context and content targets and cleans up after retargeting', async () => {
        vi.useFakeTimers();
        const firstTrigger = document.createElement('button');
        const secondTrigger = document.createElement('button');
        const content = document.createElement('section');
        document.body.append(firstTrigger, secondTrigger, content);

        const firstReference: FloatingReference = {
            contextElement: firstTrigger,
            getBoundingClientRect: () => new DOMRect(10, 20, 0, 0),
        };
        const secondReference: FloatingReference = {
            contextElement: secondTrigger,
            getBoundingClientRect: () => new DOMRect(30, 40, 0, 0),
        };
        const interactionTarget = shallowRef<FloatingReference>(firstReference);
        let disclosure!: ReturnType<typeof useHoverDisclosure>;

        mountDom(
            defineComponent({
                setup() {
                    disclosure = useHoverDisclosure({
                        interactionTarget,
                        contentTarget: content,
                        closeDelay: 100,
                    });
                    return () => h('div');
                },
            }),
        );
        await flush();

        dispatchPointer(firstTrigger, 'pointerenter');
        expect(disclosure.isOpen.value).toBe(true);

        dispatchPointer(firstTrigger, 'pointerleave');
        dispatchPointer(content, 'pointerenter');
        vi.advanceTimersByTime(100);
        expect(disclosure.isOpen.value).toBe(true);

        dispatchPointer(content, 'pointerleave');
        vi.advanceTimersByTime(100);
        expect(disclosure.isOpen.value).toBe(false);

        interactionTarget.value = secondReference;
        await flush();
        dispatchPointer(firstTrigger, 'pointerenter');
        expect(disclosure.isOpen.value).toBe(false);

        dispatchPointer(secondTrigger, 'pointerenter');
        expect(disclosure.isOpen.value).toBe(true);
    });

    it('rebinds selector targets when conditional content is recreated', async () => {
        vi.useFakeTimers();
        let disclosure!: ReturnType<typeof useHoverDisclosure>;
        const container = mountDom(
            defineComponent({
                setup() {
                    disclosure = useHoverDisclosure({
                        interactionTarget: '#selector-trigger',
                        contentTarget: '#selector-content',
                        closeDelay: 100,
                    });
                    return () =>
                        h('div', [
                            h('button', { id: 'selector-trigger' }, 'Trigger'),
                            disclosure.isOpen.value
                                ? h('section', { id: 'selector-content' }, 'Content')
                                : null,
                        ]);
                },
            }),
        );
        await flush();
        const trigger = queryDom(container, '#selector-trigger') as HTMLButtonElement;

        dispatchPointer(trigger, 'pointerenter');
        await flush();
        const firstContent = queryDom(container, '#selector-content') as HTMLElement;
        dispatchPointer(trigger, 'pointerleave');
        dispatchPointer(firstContent, 'pointerenter');
        vi.advanceTimersByTime(100);
        expect(disclosure.isOpen.value).toBe(true);

        dispatchPointer(firstContent, 'pointerleave');
        vi.advanceTimersByTime(100);
        await flush();
        expect(disclosure.isOpen.value).toBe(false);

        dispatchPointer(trigger, 'pointerenter');
        await flush();
        const secondContent = queryDom(container, '#selector-content') as HTMLElement;
        expect(secondContent).not.toBe(firstContent);

        dispatchPointer(trigger, 'pointerleave');
        dispatchPointer(secondContent, 'pointerenter');
        vi.advanceTimersByTime(100);
        expect(disclosure.isOpen.value).toBe(true);
    });

    it('clears pending timers on disable and unmount', async () => {
        vi.useFakeTimers();
        const disabled = shallowRef(false);
        const onOpenChange = vi.fn();
        const { container, disclosure, unmount } = mountDisclosure({
            disabled,
            openDelay: 100,
            onOpenChange,
        });
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        dispatchPointer(trigger, 'pointerenter');
        disabled.value = true;
        await nextTick();
        vi.advanceTimersByTime(100);
        expect(disclosure.isOpen.value).toBe(false);
        expect(onOpenChange).not.toHaveBeenCalledWith(true, expect.anything());

        disabled.value = false;
        await nextTick();
        dispatchPointer(trigger, 'pointerenter');
        unmount();
        vi.advanceTimersByTime(100);
        expect(onOpenChange).not.toHaveBeenCalledWith(true, expect.anything());
    });
});
