import {
    computed,
    isRef,
    onBeforeUnmount,
    onMounted,
    shallowRef,
    watch,
    watchEffect,
    type ComputedRef,
    type Ref,
} from 'vue';
import {
    restoreAttributes,
    snapshotAttributes,
    type AttributeSnapshot,
} from '@/utils/dom/attributes';
import { isElement, querySelectorSafe } from '@/utils/dom/query';
import type { FloatingReference, FloatingTarget } from './types';

type Source<T> = () => T;

const SELECTOR_OBSERVER_OPTIONS = {
    attributes: true,
    childList: true,
    subtree: true,
} as const satisfies MutationObserverInit;

export type FloatingTargetListener = readonly [
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
];

export interface FloatingTargetAttributeAdapter<AttributeName extends string> {
    names: readonly AttributeName[];
    isActive?: Source<boolean>;
    apply: (target: Element, snapshot: AttributeSnapshot<AttributeName>) => void;
}

export interface FloatingTargetBindingAdapter<AttributeName extends string = never> {
    connect?: (target: Element) => void | (() => void);
    listeners?: readonly FloatingTargetListener[];
    attributes?: FloatingTargetAttributeAdapter<AttributeName>;
}

export interface FloatingTargetLifecycle {
    bindTarget: <AttributeName extends string = never>(
        adapter: FloatingTargetBindingAdapter<AttributeName>,
    ) => void;
    isExplicitTarget: ComputedRef<boolean>;
    reference: ComputedRef<FloatingReference | null>;
    targetElement: ComputedRef<Element | null>;
}

interface UseFloatingTargetLifecycleOptions {
    target: Source<FloatingTarget | null | undefined>;
    fallback: Readonly<Ref<Element | null>>;
    getTargetElement?: (reference: FloatingReference) => Element | null;
}

function readTarget(target: FloatingTarget | null | undefined) {
    return isRef(target) ? target.value : target;
}

function isVirtualReference(value: unknown): value is FloatingReference {
    if (value == null || typeof value !== 'object') return false;
    return 'getBoundingClientRect' in value && typeof value.getBoundingClientRect === 'function';
}

function resolveTarget(target: FloatingReference | string | null | undefined) {
    if (!target) return null;
    if (typeof target !== 'string') return isVirtualReference(target) ? target : null;
    return querySelectorSafe(target);
}

function getMutationObserverConstructor() {
    if (typeof document === 'undefined') return undefined;
    return document.defaultView?.MutationObserver ?? globalThis.MutationObserver;
}

export function useFloatingTargetLifecycle({
    target,
    fallback,
    getTargetElement,
}: UseFloatingTargetLifecycleOptions): FloatingTargetLifecycle {
    const resolvedTarget = shallowRef<FloatingReference | null>(null);
    const isExplicitTarget = computed(() => {
        const currentTarget = readTarget(target());
        return currentTarget != null && currentTarget !== '';
    });
    const reference = computed<FloatingReference | null>(() =>
        isExplicitTarget.value ? resolvedTarget.value : fallback.value,
    );
    const targetElement = computed(() => {
        const currentTarget = resolvedTarget.value;
        if (!currentTarget) return null;
        if (getTargetElement) return getTargetElement(currentTarget);
        return isElement(currentTarget) ? currentTarget : null;
    });

    let selectorObserver: MutationObserver | undefined;
    let selectorObserverActive = false;
    let ownedAttributeMutationDepth = 0;
    let selectorSyncScheduled = false;

    function syncTarget() {
        resolvedTarget.value = isExplicitTarget.value ? resolveTarget(readTarget(target())) : null;
    }

    function stopObservingSelector() {
        selectorObserverActive = false;
        selectorObserver?.disconnect();
        selectorObserver = undefined;
    }

    function scheduleSelectorSync() {
        if (selectorSyncScheduled) return;

        selectorSyncScheduled = true;
        queueMicrotask(() => {
            selectorSyncScheduled = false;
            if (selectorObserverActive) syncTarget();
        });
    }

    function mutateWithoutSelectorObservation(mutate: () => void) {
        const observer = selectorObserver;
        const shouldPause =
            observer !== undefined && selectorObserverActive && ownedAttributeMutationDepth === 0;
        ownedAttributeMutationDepth += 1;

        if (shouldPause) {
            if (observer.takeRecords().length > 0) scheduleSelectorSync();
            observer.disconnect();
        }

        try {
            mutate();
        } finally {
            ownedAttributeMutationDepth -= 1;
            if (
                shouldPause &&
                selectorObserverActive &&
                selectorObserver === observer &&
                typeof document !== 'undefined'
            ) {
                observer.observe(document, SELECTOR_OBSERVER_OPTIONS);
            }
        }
    }

    function observeSelector() {
        stopObservingSelector();

        const currentTarget = readTarget(target());
        const MutationObserverConstructor = getMutationObserverConstructor();
        if (
            typeof currentTarget !== 'string' ||
            !MutationObserverConstructor ||
            typeof document === 'undefined'
        ) {
            return;
        }

        const observer = new MutationObserverConstructor(syncTarget);
        selectorObserver = observer;
        selectorObserverActive = true;
        observer.observe(document, SELECTOR_OBSERVER_OPTIONS);
    }

    function syncLifecycle() {
        syncTarget();
        observeSelector();
    }

    function bindTarget<AttributeName extends string = never>(
        adapter: FloatingTargetBindingAdapter<AttributeName>,
    ) {
        watchEffect(
            (onCleanup) => {
                const currentTarget = targetElement.value;
                if (!currentTarget) return;

                const disconnect = adapter.connect?.(currentTarget);
                const listeners = adapter.listeners ?? [];
                for (const [type, listener, options] of listeners) {
                    currentTarget.addEventListener(type, listener, options);
                }

                onCleanup(() => {
                    for (const [type, listener, options] of listeners) {
                        currentTarget.removeEventListener(type, listener, options);
                    }
                    disconnect?.();
                });
            },
            { flush: 'sync' },
        );

        const attributeAdapter = adapter.attributes;
        if (!attributeAdapter) return;

        watchEffect(
            (onCleanup) => {
                const currentTarget = targetElement.value;
                if (!currentTarget || attributeAdapter.isActive?.() === false) return;

                const snapshot = snapshotAttributes(currentTarget, attributeAdapter.names);
                mutateWithoutSelectorObservation(() => {
                    attributeAdapter.apply(currentTarget, snapshot);
                });
                onCleanup(() => {
                    mutateWithoutSelectorObservation(() => {
                        restoreAttributes(currentTarget, snapshot);
                    });
                });
            },
            { flush: 'sync' },
        );
    }

    watch(() => readTarget(target()), syncLifecycle, { flush: 'post' });
    onMounted(syncLifecycle);
    onBeforeUnmount(stopObservingSelector);

    return {
        bindTarget,
        isExplicitTarget,
        reference,
        targetElement,
    };
}
