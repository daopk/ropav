import { computed, isRef, onBeforeUnmount, watch } from 'vue';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { createCancelableCustomEvent } from '@/utils/dom/events';
import { querySelectorSafe } from '@/utils/dom/query';
import { useFocusTrap } from '../focus-trap/useFocusTrap';
import type { FocusTrapContainers } from '../focus-trap/types';
import type { DialogRootContext } from './dialogContext';
import type {
    DialogContentProps,
    DialogFocusTrapOptions,
    DialogInteractOutsideEvent,
} from './types';

type DialogContentInteractionProps = Readonly<
    DialogContentProps & {
        focusTrapOptions: DialogFocusTrapOptions;
    }
>;

interface DialogContentInteractionEvents {
    escapeKeyDown: (event: CustomEvent<{ originalEvent: KeyboardEvent }>) => void;
    pointerDownOutside: (event: DialogInteractOutsideEvent) => void;
    interactOutside: (event: DialogInteractOutsideEvent) => void;
}

export function useDialogContentInteractions(
    root: DialogRootContext,
    props: DialogContentInteractionProps,
    events: Readonly<DialogContentInteractionEvents>,
) {
    const id = computed(() => props.id ?? root.contentId.value);
    const focusTrapContainers = computed<FocusTrapContainers | null>(() => {
        const content = root.contentRef.value;
        if (!content) return null;
        return [content, ...root.layer.focusBranches.value];
    });
    let listenerDocument: Document | null = null;

    function resolveInitialFocus() {
        const initialFocus = props.initialFocus;
        const resolved = isRef(initialFocus) ? initialFocus.value : initialFocus;
        if (typeof resolved !== 'string') return resolved ?? undefined;
        return querySelectorSafe<HTMLElement>(resolved, root.contentRef.value) ?? undefined;
    }

    const focusTrap = useFocusTrap(focusTrapContainers, {
        ...props.focusTrapOptions,
        initialFocus: resolveInitialFocus,
        fallbackFocus: () => root.contentRef.value!,
        returnFocusOnDeactivate: false,
        escapeDeactivates: false,
        allowOutsideClick: true,
        preventScroll: true,
        delayInitialFocus: props.focusTrapOptions.delayInitialFocus ?? false,
    });

    function setElement(value: ComponentElementRef) {
        resolveHTMLElementRef(value, id.value, (element) => root.setContent(element, id.value));
    }

    function onDocumentKeydown(event: KeyboardEvent) {
        if (
            event.key !== 'Escape' ||
            event.defaultPrevented ||
            !root.closeOnEscape.value ||
            !root.layer.isTopLayer()
        ) {
            return;
        }

        const customEvent = createCancelableCustomEvent(
            'dialog-escape-key-down',
            { originalEvent: event },
            event,
        );
        events.escapeKeyDown(customEvent);
        if (customEvent.defaultPrevented) return;

        event.preventDefault();
        root.close('escape');
    }

    function onDocumentPointerdown(event: PointerEvent) {
        if (
            event.defaultPrevented ||
            !root.closeOnOutsideClick.value ||
            !root.layer.isTopLayer() ||
            root.layer.isInside(event)
        ) {
            return;
        }

        const customEvent = createCancelableCustomEvent(
            'dialog-pointer-down-outside',
            { originalEvent: event },
            event,
        );
        events.pointerDownOutside(customEvent);
        events.interactOutside(customEvent);
        if (!customEvent.defaultPrevented) root.close('outside');
    }

    function removeDocumentListeners() {
        if (!listenerDocument) return;
        listenerDocument.removeEventListener('keydown', onDocumentKeydown as EventListener);
        listenerDocument.removeEventListener(
            'pointerdown',
            onDocumentPointerdown as EventListener,
            true,
        );
        listenerDocument = null;
    }

    function addDocumentListeners(document: Document) {
        if (listenerDocument === document) return;
        removeDocumentListeners();
        document.addEventListener('keydown', onDocumentKeydown as EventListener);
        document.addEventListener('pointerdown', onDocumentPointerdown as EventListener, true);
        listenerDocument = document;
    }

    watch(
        [root.isOpen, root.modal, root.contentRef],
        ([open, modal], _previous, onCleanup) => {
            const content = root.contentRef.value;
            if (!open || !content) {
                focusTrap.deactivate({ returnFocus: false });
                return;
            }

            addDocumentListeners(content.ownerDocument);
            if (modal) focusTrap.activate();
            else focusTrap.deactivate({ returnFocus: false });
            onCleanup(removeDocumentListeners);
        },
        { flush: 'post', immediate: true },
    );

    watch(
        id,
        (nextId) => {
            root.setContent(root.contentRef.value, nextId);
        },
        { immediate: true },
    );

    onBeforeUnmount(() => {
        removeDocumentListeners();
        focusTrap.deactivate({ returnFocus: false });
        root.setContent(null, id.value);
    });

    return { id, setElement };
}
