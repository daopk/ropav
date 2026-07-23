import { onBeforeUnmount, onMounted, shallowRef, toValue, watch, type ComputedRef } from 'vue';
import { isEventWithinTargets } from '@/utils/dom/events';
import { isElement, querySelectorSafe } from '@/utils/dom/query';
import type {
    HoverDisclosureContentTarget,
    HoverDisclosureInteractionTarget,
    UseHoverDisclosureOptions,
} from './types';
import type { HoverDisclosureInteractionPart } from './hoverDisclosureInteractionModel';

export type HoverDisclosureTargetListener = readonly [type: string, listener: EventListener];

export interface HoverDisclosureTargetState {
    contentElement: Element | null;
    resolvedContentTarget: ReturnType<typeof shallowRef<Element | null>>;
    resolvedInteractionTarget: ReturnType<typeof shallowRef<Element | null>>;
    triggerElement: Element | null;
}

interface HoverDisclosureBindingAdapter {
    contentListeners: readonly HoverDisclosureTargetListener[];
    isOutsideDismissalActive: () => boolean;
    onDocumentKeydown: (event: KeyboardEvent) => void;
    onOutsidePointerdown: (event: PointerEvent) => void;
    onTargetDetached: (part: HoverDisclosureInteractionPart) => void;
    triggerListeners: readonly HoverDisclosureTargetListener[];
}

interface UseHoverDisclosureTargetBindingOptions {
    adapter: HoverDisclosureBindingAdapter;
    isOpen: ComputedRef<boolean>;
    options: Readonly<UseHoverDisclosureOptions>;
    targets: HoverDisclosureTargetState;
}

export function createHoverDisclosureTargetState(): HoverDisclosureTargetState {
    return {
        contentElement: null,
        resolvedContentTarget: shallowRef(null),
        resolvedInteractionTarget: shallowRef(null),
        triggerElement: null,
    };
}

export function useHoverDisclosureTargetBinding({
    adapter,
    isOpen,
    options,
    targets,
}: UseHoverDisclosureTargetBindingOptions) {
    let documentListenersActive = false;

    function syncInteractionTarget() {
        targets.resolvedInteractionTarget.value = resolveInteractionTarget(
            toValue(options.interactionTarget),
        );
    }

    function syncContentTarget() {
        targets.resolvedContentTarget.value = resolveContentTarget(toValue(options.contentTarget));
    }

    function syncTargets() {
        syncInteractionTarget();
        syncContentTarget();
    }

    function bindTarget(
        part: HoverDisclosureInteractionPart,
        target: Element,
        listeners: readonly HoverDisclosureTargetListener[],
        cleanup: (callback: () => void) => void,
    ) {
        setCurrentTarget(part, target);
        for (const [type, listener] of listeners) {
            target.addEventListener(type, listener);
        }

        cleanup(() => {
            for (const [type, listener] of listeners) {
                target.removeEventListener(type, listener);
            }
            clearCurrentTarget(part, target);
            adapter.onTargetDetached(part);
        });
    }

    function setCurrentTarget(part: HoverDisclosureInteractionPart, target: Element) {
        if (part === 'trigger') targets.triggerElement = target;
        else targets.contentElement = target;
    }

    function clearCurrentTarget(part: HoverDisclosureInteractionPart, target: Element) {
        if (part === 'trigger' && targets.triggerElement === target) {
            targets.triggerElement = null;
        }
        if (part === 'content' && targets.contentElement === target) {
            targets.contentElement = null;
        }
    }

    function onDocumentPointerdown(event: PointerEvent) {
        if (!adapter.isOutsideDismissalActive()) return;
        if (isEventInsideTargets(event, targets)) return;
        adapter.onOutsidePointerdown(event);
    }

    function setDocumentListeners(active: boolean) {
        if (typeof document === 'undefined' || active === documentListenersActive) {
            return;
        }

        documentListenersActive = active;
        if (active) {
            document.addEventListener('keydown', adapter.onDocumentKeydown as EventListener);
            document.addEventListener('pointerdown', onDocumentPointerdown as EventListener, true);
            return;
        }

        document.removeEventListener('keydown', adapter.onDocumentKeydown as EventListener);
        document.removeEventListener('pointerdown', onDocumentPointerdown as EventListener, true);
    }

    watch(() => toValue(options.interactionTarget), syncInteractionTarget, {
        flush: 'post',
        immediate: true,
    });
    watch(() => toValue(options.contentTarget), syncContentTarget, {
        flush: 'post',
        immediate: true,
    });
    watch(
        targets.resolvedInteractionTarget,
        (target, _previous, cleanup) => {
            if (target) {
                bindTarget('trigger', target, adapter.triggerListeners, cleanup);
            }
        },
        { flush: 'sync', immediate: true },
    );
    watch(
        targets.resolvedContentTarget,
        (target, _previous, cleanup) => {
            if (target) {
                bindTarget('content', target, adapter.contentListeners, cleanup);
            }
        },
        { flush: 'sync', immediate: true },
    );
    watch(isOpen, setDocumentListeners, { flush: 'sync' });
    watch(isOpen, syncTargets, { flush: 'post' });

    onMounted(() => {
        syncTargets();
        setDocumentListeners(isOpen.value);
    });
    onBeforeUnmount(() => setDocumentListeners(false));
}

function resolveInteractionTarget(
    target: HoverDisclosureInteractionTarget | null | undefined,
): Element | null {
    if (!target) return null;
    if (typeof target === 'string') return querySelectorSafe(target);
    if (isElement(target)) return target;

    return isElement(target.contextElement) ? target.contextElement : null;
}

function resolveContentTarget(
    target: HoverDisclosureContentTarget | null | undefined,
): Element | null {
    if (!target) return null;
    if (typeof target === 'string') return querySelectorSafe(target);
    return isElement(target) ? target : null;
}

function isEventInsideTargets(event: Event, targets: HoverDisclosureTargetState) {
    const elements = [
        targets.triggerElement,
        targets.contentElement,
        targets.resolvedInteractionTarget.value,
        targets.resolvedContentTarget.value,
    ].filter((element): element is Element => element !== null);
    return isEventWithinTargets(event, elements);
}
