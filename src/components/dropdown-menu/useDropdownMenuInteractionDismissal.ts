import { isRef, onBeforeUnmount, watch } from 'vue';
import {
    createCancelableCustomEvent,
    isEventWithinElement,
    isEventWithinTargets,
} from '@/utils/dom/events';
import type { DropdownMenuCloseOptions, DropdownMenuInteractOutsideEvent } from './types';
import type { DropdownMenuInteractionRegistry } from './dropdownMenuInteractionRegistry';
import type {
    DropdownMenuInteractionDismissalRegistration,
    DropdownMenuInteractionHost,
} from './dropdownMenuInteractionTypes';

type DropdownMenuDismissalRegistry = Pick<
    DropdownMenuInteractionRegistry,
    'activeMenuId' | 'focusMenuElement'
>;

interface UseDropdownMenuInteractionDismissalOptions {
    host: DropdownMenuInteractionHost;
    registry: DropdownMenuDismissalRegistry;
    closeRoot: (options?: DropdownMenuCloseOptions & { returnFocus?: boolean }) => void;
}

function createOutsideEvent(originalEvent: Event): DropdownMenuInteractOutsideEvent {
    return createCancelableCustomEvent(
        'dropdown-menu-interact-outside',
        { originalEvent },
        originalEvent,
    );
}

function blockDocumentClick(event: Event) {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    document.removeEventListener('click', blockDocumentClick, true);
}

function blockNextDocumentClick() {
    if (typeof document === 'undefined') return;
    document.addEventListener('click', blockDocumentClick, true);
    window.setTimeout(() => document.removeEventListener('click', blockDocumentClick, true), 1000);
}

export function useDropdownMenuInteractionDismissal({
    host,
    registry,
    closeRoot,
}: UseDropdownMenuInteractionDismissalOptions) {
    const inside = new Set<Element>();
    let dismissal: DropdownMenuInteractionDismissalRegistration | undefined;
    let isListening = false;

    function registerInside(element: Element) {
        inside.add(element);
    }

    function unregisterInside(element: Element) {
        inside.delete(element);
    }

    function isInside(event: Event) {
        return [...inside].some((element) => isEventWithinElement(event, element));
    }

    function emitOutside(type: 'pointer' | 'focus', originalEvent: Event) {
        const outsideEvent = createOutsideEvent(originalEvent);
        if (type === 'pointer') dismissal?.pointerDownOutside?.(outsideEvent);
        else dismissal?.focusOutside?.(outsideEvent);
        dismissal?.interactOutside?.(outsideEvent);
        return outsideEvent;
    }

    function blockModalInteraction(event: Event) {
        if (!host.modal.value) return;
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        if (event.type === 'pointerdown') blockNextDocumentClick();
    }

    function shouldIgnoreOutside(event: Event) {
        const ignoredTargets = (dismissal?.ignoredTargets() ?? []).map((target) =>
            isRef(target) ? target.value : target,
        );
        return isInside(event) || isEventWithinTargets(event, ignoredTargets);
    }

    function onDocumentPointer(event: Event) {
        if (!host.isTopLayer() || shouldIgnoreOutside(event)) return;
        const outsideEvent = emitOutside('pointer', event);
        blockModalInteraction(event);
        if (!outsideEvent.defaultPrevented) closeRoot({ focusTrigger: host.modal.value });
    }

    function onDocumentFocus(event: Event) {
        if (!host.isTopLayer() || shouldIgnoreOutside(event)) return;
        const outsideEvent = emitOutside('focus', event);
        blockModalInteraction(event);
        if (!outsideEvent.defaultPrevented) closeRoot({ focusTrigger: host.modal.value });
        else if (host.modal.value) registry.focusMenuElement(registry.activeMenuId.value);
    }

    function setDocumentListeners(active: boolean) {
        if (typeof document === 'undefined' || active === isListening) return;
        isListening = active;
        const method = active ? 'addEventListener' : 'removeEventListener';
        document[method]('pointerdown', onDocumentPointer, true);
        document[method]('focusin', onDocumentFocus, true);
    }

    function registerDismissal(registration: DropdownMenuInteractionDismissalRegistration) {
        dismissal = registration;
        setDocumentListeners(host.isOpen.value);
        return () => {
            if (dismissal !== registration) return;
            dismissal = undefined;
            setDocumentListeners(false);
        };
    }

    watch(host.isOpen, (open) => setDocumentListeners(open && Boolean(dismissal)));
    onBeforeUnmount(() => setDocumentListeners(false));

    return {
        registerInside,
        unregisterInside,
        registerDismissal,
    };
}
