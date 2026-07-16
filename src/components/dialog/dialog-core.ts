import type { ComponentPublicInstance, ComputedRef, InjectionKey, Ref } from 'vue';
import type { OverlayLayerContext } from '@/composables/useOverlayLayer';
import type { DialogCloseReason } from './types';

export interface DialogRootContext {
    isOpen: ComputedRef<boolean>;
    modal: ComputedRef<boolean>;
    closeOnEscape: ComputedRef<boolean>;
    closeOnOutsideClick: ComputedRef<boolean>;
    returnFocus: ComputedRef<boolean>;
    triggerRef: Ref<HTMLElement | null>;
    contentRef: Ref<HTMLElement | null>;
    contentId: Ref<string>;
    titleIds: Ref<readonly string[]>;
    descriptionIds: Ref<readonly string[]>;
    layer: OverlayLayerContext;
    open: () => void;
    close: (reason?: DialogCloseReason) => void;
    toggle: () => void;
    setTrigger: (element: HTMLElement | null) => void;
    setContent: (element: HTMLElement | null, id: string) => void;
    registerTitle: (id: string) => () => void;
    registerDescription: (id: string) => () => void;
}

export const dialogRootKey = Symbol('dialog-root') as InjectionKey<DialogRootContext>;

export function resolveDialogCloseReason(reason: unknown): DialogCloseReason {
    return reason === 'escape' || reason === 'outside' || reason === 'programmatic'
        ? reason
        : 'programmatic';
}

export function toDialogHTMLElement(
    value: Element | ComponentPublicInstance | null,
): HTMLElement | null {
    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return value;
    if (value == null || (typeof Element !== 'undefined' && value instanceof Element)) return null;
    const element = (value as ComponentPublicInstance).$el;
    return element instanceof HTMLElement ? element : null;
}

export function createDialogEvent<T>(type: string, detail: T, originalEvent: Event) {
    const target = originalEvent.target;
    const view =
        typeof Node !== 'undefined' && target instanceof Node
            ? target.ownerDocument?.defaultView
            : null;
    const EventConstructor = view?.CustomEvent ?? CustomEvent;
    return new EventConstructor(type, { bubbles: false, cancelable: true, detail });
}
