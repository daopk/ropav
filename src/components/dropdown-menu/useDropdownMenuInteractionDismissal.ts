import { isRef } from 'vue';
import { createCancelableCustomEvent, isEventWithinTargets } from '@/utils/dom/events';
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

function blockNextDocumentClick(document: Document) {
    function blockDocumentClick(event: Event) {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        document.removeEventListener('click', blockDocumentClick, true);
    }

    document.addEventListener('click', blockDocumentClick, true);
    document.defaultView?.setTimeout(
        () => document.removeEventListener('click', blockDocumentClick, true),
        1000,
    );
}

export function useDropdownMenuInteractionDismissal({
    host,
    registry,
    closeRoot,
}: UseDropdownMenuInteractionDismissalOptions) {
    const inside = new Set<Element>();
    let dismissal: DropdownMenuInteractionDismissalRegistration | undefined;
    let layerInteraction:
        | ReturnType<DropdownMenuInteractionHost['connectLayerInteraction']>
        | undefined;

    function registerInside(element: Element) {
        inside.add(element);
        layerInteraction?.refresh();
    }

    function unregisterInside(element: Element) {
        inside.delete(element);
        layerInteraction?.refresh();
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
        const listenerDocument = event.currentTarget as Document | null;
        if (event.type === 'pointerdown' && listenerDocument?.nodeType === 9) {
            blockNextDocumentClick(listenerDocument);
        }
    }

    function shouldIgnoreOutside(event: Event) {
        const ignoredTargets = (dismissal?.ignoredTargets() ?? []).map((target) =>
            isRef(target) ? target.value : target,
        );
        return isEventWithinTargets(event, ignoredTargets);
    }

    function onDocumentPointer(event: Event) {
        if (shouldIgnoreOutside(event)) return;
        const outsideEvent = emitOutside('pointer', event);
        blockModalInteraction(event);
        if (!outsideEvent.defaultPrevented) closeRoot({ focusTrigger: host.modal.value });
    }

    function onDocumentFocus(event: Event) {
        if (shouldIgnoreOutside(event)) return;
        const outsideEvent = emitOutside('focus', event);
        blockModalInteraction(event);
        if (!outsideEvent.defaultPrevented) closeRoot({ focusTrigger: host.modal.value });
        else if (host.modal.value) registry.focusMenuElement(registry.activeMenuId.value);
    }

    function registerDismissal(registration: DropdownMenuInteractionDismissalRegistration) {
        layerInteraction?.();
        dismissal = registration;
        layerInteraction = host.connectLayerInteraction({
            inside: () => [...inside],
            pointerDownOutside: onDocumentPointer,
            focusOutside: onDocumentFocus,
        });

        return () => {
            if (dismissal !== registration) return;
            dismissal = undefined;
            layerInteraction?.();
            layerInteraction = undefined;
        };
    }

    return {
        registerInside,
        unregisterInside,
        registerDismissal,
    };
}
