import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, shallowReactive, shallowRef } from 'vue';
import { flush, mountDom, mountDomWithApp, waitForAssertion } from '../../../tests/utils/vue';
import type { FloatingReference, FloatingTarget } from './types';
import { useFloatingTargetLifecycle } from './useFloatingTargetLifecycle';

function createVirtualReference(x: number, y: number): FloatingReference {
    return {
        getBoundingClientRect: () => new DOMRect(x, y, 0, 0),
    };
}

describe('floating target lifecycle', () => {
    it('resolves selector, element, virtual element, and ref targets reactively', async () => {
        const first = document.createElement('button');
        first.id = 'floating-first';
        const second = document.createElement('button');
        document.body.append(first, second);

        const virtual = createVirtualReference(20, 30);
        const innerTarget = shallowRef<FloatingReference | null>(first);
        const target = shallowReactive<{ value: FloatingTarget | null }>({
            value: '#floating-first',
        });
        let lifecycle!: ReturnType<typeof useFloatingTargetLifecycle>;

        mountDom(
            defineComponent({
                setup() {
                    const fallback = ref<HTMLElement | null>(null);
                    lifecycle = useFloatingTargetLifecycle({
                        target: () => target.value,
                        fallback,
                    });
                    return () => h('span', { ref: fallback });
                },
            }),
        );

        await flush();
        expect(lifecycle.reference.value).toBe(first);
        expect(lifecycle.targetElement.value).toBe(first);

        target.value = second;
        await flush();
        expect(lifecycle.reference.value).toBe(second);
        expect(lifecycle.targetElement.value).toBe(second);

        target.value = virtual;
        await flush();
        expect(lifecycle.reference.value).toBe(virtual);
        expect(lifecycle.targetElement.value).toBeNull();

        target.value = innerTarget;
        await flush();
        expect(lifecycle.reference.value).toBe(first);

        innerTarget.value = second;
        await flush();
        expect(lifecycle.reference.value).toBe(second);

        target.value = '[';
        await flush();
        expect(lifecycle.reference.value).toBeNull();

        target.value = null;
        await flush();
        expect(lifecycle.reference.value).toBeInstanceOf(HTMLElement);
    });

    it('owns late resolution, same-selector replacement, rebinding, restoration, and cleanup', async () => {
        const listener = vi.fn();
        const attributesActive = ref(true);
        const bindingId = ref('first-binding');
        let lifecycle!: ReturnType<typeof useFloatingTargetLifecycle>;

        const { unmount } = mountDomWithApp(
            defineComponent({
                setup() {
                    const fallback = ref<HTMLElement | null>(null);
                    lifecycle = useFloatingTargetLifecycle({
                        target: () => '#replaceable-floating-target',
                        fallback,
                    });
                    lifecycle.bindTarget({
                        listeners: [['click', listener]],
                        attributes: {
                            names: ['aria-controls'],
                            isActive: () => attributesActive.value,
                            apply: (target, snapshot) => {
                                const original = snapshot.get('aria-controls');
                                target.setAttribute(
                                    'aria-controls',
                                    [original, bindingId.value].filter(Boolean).join(' '),
                                );
                            },
                        },
                    });
                    return () => h('span', { ref: fallback });
                },
            }),
        );

        await flush();
        expect(lifecycle.reference.value).toBeNull();

        const first = document.createElement('button');
        first.id = 'replaceable-floating-target';
        first.setAttribute('aria-controls', 'first-owner');
        document.body.append(first);

        await waitForAssertion(() => {
            expect(lifecycle.targetElement.value).toBe(first);
            expect(first.getAttribute('aria-controls')).toBe('first-owner first-binding');
        });

        first.dispatchEvent(new MouseEvent('click'));
        expect(listener).toHaveBeenCalledOnce();

        bindingId.value = 'updated-binding';
        await flush();
        expect(first.getAttribute('aria-controls')).toBe('first-owner updated-binding');

        attributesActive.value = false;
        await flush();
        expect(first.getAttribute('aria-controls')).toBe('first-owner');

        attributesActive.value = true;
        await flush();
        expect(first.getAttribute('aria-controls')).toBe('first-owner updated-binding');

        const replacement = document.createElement('button');
        replacement.id = first.id;
        replacement.setAttribute('aria-controls', 'replacement-owner');
        first.replaceWith(replacement);

        await waitForAssertion(() => {
            expect(lifecycle.targetElement.value).toBe(replacement);
            expect(replacement.getAttribute('aria-controls')).toBe(
                'replacement-owner updated-binding',
            );
        });
        expect(first.getAttribute('aria-controls')).toBe('first-owner');

        first.dispatchEvent(new MouseEvent('click'));
        replacement.dispatchEvent(new MouseEvent('click'));
        expect(listener).toHaveBeenCalledTimes(2);

        unmount();
        expect(replacement.getAttribute('aria-controls')).toBe('replacement-owner');

        replacement.dispatchEvent(new MouseEvent('click'));
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('rebinds when selector membership moves through attribute changes', async () => {
        const listener = vi.fn();
        const first = document.createElement('button');
        const second = document.createElement('button');
        first.classList.add('attribute-floating-target');
        first.setAttribute('aria-controls', 'first-owner');
        second.setAttribute('aria-controls', 'second-owner');
        document.body.append(first, second);
        let lifecycle!: ReturnType<typeof useFloatingTargetLifecycle>;

        const { unmount } = mountDomWithApp(
            defineComponent({
                setup() {
                    const fallback = ref<HTMLElement | null>(null);
                    lifecycle = useFloatingTargetLifecycle({
                        target: () => '.attribute-floating-target',
                        fallback,
                    });
                    lifecycle.bindTarget({
                        listeners: [['click', listener]],
                        attributes: {
                            names: ['aria-controls'],
                            apply: (target) =>
                                target.setAttribute('aria-controls', 'lifecycle-owner'),
                        },
                    });
                    return () => h('span', { ref: fallback });
                },
            }),
        );

        await flush();
        expect(lifecycle.targetElement.value).toBe(first);
        expect(first.getAttribute('aria-controls')).toBe('lifecycle-owner');

        first.classList.remove('attribute-floating-target');
        second.classList.add('attribute-floating-target');

        await waitForAssertion(() => {
            expect(lifecycle.targetElement.value).toBe(second);
            expect(first.getAttribute('aria-controls')).toBe('first-owner');
            expect(second.getAttribute('aria-controls')).toBe('lifecycle-owner');
        });

        first.dispatchEvent(new MouseEvent('click'));
        second.dispatchEvent(new MouseEvent('click'));
        expect(listener).toHaveBeenCalledOnce();

        unmount();
        expect(second.getAttribute('aria-controls')).toBe('second-owner');
    });

    it('does not re-resolve selectors from lifecycle-owned attribute writes', async () => {
        const bindingVersion = ref(0);
        const connect = vi.fn();
        const first = document.createElement('button');
        const second = document.createElement('button');
        for (const target of [first, second]) {
            target.setAttribute('data-owned-selector', '');
            target.setAttribute('aria-expanded', 'false');
        }
        document.body.append(first, second);
        let lifecycle!: ReturnType<typeof useFloatingTargetLifecycle>;

        const { unmount } = mountDomWithApp(
            defineComponent({
                setup() {
                    const fallback = ref<HTMLElement | null>(null);
                    lifecycle = useFloatingTargetLifecycle({
                        target: () => '[data-owned-selector][aria-expanded="false"]',
                        fallback,
                    });
                    lifecycle.bindTarget({
                        connect: () => {
                            connect();
                        },
                        attributes: {
                            names: ['aria-expanded'],
                            apply: (target) => {
                                void bindingVersion.value;
                                target.setAttribute('aria-expanded', 'true');
                            },
                        },
                    });
                    return () => h('span', { ref: fallback });
                },
            }),
        );

        await flush();
        const connectedTarget = lifecycle.targetElement.value;
        const otherTarget = connectedTarget === first ? second : first;
        const connectionCount = connect.mock.calls.length;
        expect(connectedTarget).not.toBeNull();
        expect(connectedTarget?.getAttribute('aria-expanded')).toBe('true');
        expect(otherTarget.getAttribute('aria-expanded')).toBe('false');

        bindingVersion.value += 1;
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        await flush();

        expect(lifecycle.targetElement.value).toBe(connectedTarget);
        expect(connectedTarget?.getAttribute('aria-expanded')).toBe('true');
        expect(otherTarget.getAttribute('aria-expanded')).toBe('false');
        expect(connect).toHaveBeenCalledTimes(connectionCount);

        unmount();
        expect(connectedTarget?.getAttribute('aria-expanded')).toBe('false');
    });
});
