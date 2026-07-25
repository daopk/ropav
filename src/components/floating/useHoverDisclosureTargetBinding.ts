import {
    onBeforeUnmount,
    onMounted,
    shallowRef,
    toValue,
    watch,
    type ComputedRef,
    type Ref,
} from 'vue';
import { isEventWithinTargets } from '@/utils/dom/events';
import { isElement } from '@/utils/dom/query';
import type { UseHoverDisclosureOptions } from './types';
import type { HoverDisclosureInteractionPart } from './hoverDisclosureInteractionModel';
import { useFloatingTargetLifecycle } from './useFloatingTargetLifecycle';

export type HoverDisclosureTargetListener = readonly [type: string, listener: EventListener];

export interface HoverDisclosureTargetState {
    contentElement: Element | null;
    resolvedContentTarget: Readonly<Ref<Element | null>>;
    resolvedInteractionTarget: Readonly<Ref<Element | null>>;
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

    function connectTarget(part: HoverDisclosureInteractionPart, target: Element) {
        setCurrentTarget(part, target);
        return () => {
            clearCurrentTarget(part, target);
            adapter.onTargetDetached(part);
        };
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

    const fallbackTarget = shallowRef<Element | null>(null);
    const interactionTargetLifecycle = useFloatingTargetLifecycle({
        target: () => toValue(options.interactionTarget),
        fallback: fallbackTarget,
        getTargetElement: (reference) => {
            if (isElement(reference)) return reference;
            return isElement(reference.contextElement) ? reference.contextElement : null;
        },
    });
    const contentTargetLifecycle = useFloatingTargetLifecycle({
        target: () => toValue(options.contentTarget),
        fallback: fallbackTarget,
    });
    targets.resolvedInteractionTarget = interactionTargetLifecycle.targetElement;
    targets.resolvedContentTarget = contentTargetLifecycle.targetElement;
    interactionTargetLifecycle.bindTarget({
        connect: (target) => connectTarget('trigger', target),
        listeners: adapter.triggerListeners,
    });
    contentTargetLifecycle.bindTarget({
        connect: (target) => connectTarget('content', target),
        listeners: adapter.contentListeners,
    });

    watch(isOpen, setDocumentListeners, { flush: 'sync' });

    onMounted(() => {
        setDocumentListeners(isOpen.value);
    });
    onBeforeUnmount(() => setDocumentListeners(false));
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
