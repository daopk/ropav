import { onBeforeUnmount, readonly, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { getComposedAncestry, observeComposedAncestry } from '@/utils/dom/ancestry';
import { getElementDirection, type ElementDirection } from '@/utils/dom/direction';
import { isElement } from '@/utils/dom/query';

const directionAttributeFilter = ['class', 'dir', 'style'];

function getMutationObserverConstructor(element: Element) {
    return element.ownerDocument.defaultView?.MutationObserver ?? globalThis.MutationObserver;
}

function observeDirectionAttributes(element: Element, onChange: () => void) {
    const observers = new Map<typeof MutationObserver, MutationObserver>();
    const ancestry = [element, ...getComposedAncestry(element)];

    for (const node of ancestry) {
        if (!isElement(node)) continue;
        const MutationObserverConstructor = getMutationObserverConstructor(node);
        if (!MutationObserverConstructor) continue;

        let observer = observers.get(MutationObserverConstructor);
        if (!observer) {
            observer = new MutationObserverConstructor(onChange);
            observers.set(MutationObserverConstructor, observer);
        }
        observer.observe(node, {
            attributes: true,
            attributeFilter: directionAttributeFilter,
        });
    }

    return () => {
        for (const observer of observers.values()) observer.disconnect();
    };
}

export function useElementDirection(elementSource: MaybeRefOrGetter<Element | null | undefined>) {
    const direction = ref<ElementDirection>('ltr');
    let disconnectElement: (() => void) | undefined;

    function readDirection(element: Element | null | undefined) {
        direction.value = element ? getElementDirection(element) : 'ltr';
    }

    function connectElement(element: Element | null | undefined) {
        disconnectElement?.();
        disconnectElement = undefined;
        readDirection(element);
        if (!element) return;
        const target = element;

        let disconnectAttributes: (() => void) | undefined;

        function reconnectAttributes() {
            disconnectAttributes?.();
            disconnectAttributes = observeDirectionAttributes(target, () => readDirection(target));
            readDirection(target);
        }

        reconnectAttributes();
        const disconnectAncestry = observeComposedAncestry(() => [target], reconnectAttributes, {
            deferWhileDisconnected: true,
            notifyOnDisconnect: true,
        });
        disconnectElement = () => {
            disconnectAttributes?.();
            disconnectAncestry();
        };
    }

    const stopSourceWatch = watch(() => toValue(elementSource), connectElement, {
        immediate: true,
        flush: 'post',
    });

    onBeforeUnmount(() => {
        stopSourceWatch();
        disconnectElement?.();
    });

    return readonly(direction);
}
