import {
    nextTick,
    type ComponentPublicInstance,
    type ComputedRef,
    type InjectionKey,
    type Ref,
    type VaporComponentInstance,
} from 'vue';
import type { OverlayLayerContext } from '@/internal/composables/useOverlayLayer';
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

export type DialogElementRefValue =
    | Element
    | ComponentPublicInstance
    | VaporComponentInstance
    | null;

export function resolveDialogCloseReason(reason: unknown): DialogCloseReason {
    return reason === 'escape' || reason === 'outside' || reason === 'programmatic'
        ? reason
        : 'programmatic';
}

export function toDialogHTMLElement(value: DialogElementRefValue): HTMLElement | null {
    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return value;
    if (value == null || (typeof Element !== 'undefined' && value instanceof Element)) return null;

    const vdomElement = (value as ComponentPublicInstance).$el;
    if (vdomElement instanceof HTMLElement) return vdomElement;

    const vaporBlock = (value as VaporComponentInstance).block;
    return vaporBlock instanceof HTMLElement ? vaporBlock : null;
}

export function resolveDialogHTMLElementRef(
    value: DialogElementRefValue,
    fallbackId: string,
    resolve: (element: HTMLElement | null) => void,
) {
    const element =
        toDialogHTMLElement(value) ??
        (typeof document !== 'undefined' ? document.getElementById(fallbackId) : null);
    resolve(element);
    if (element || !value) return;
    void nextTick(() => {
        resolve(
            toDialogHTMLElement(value) ??
                (typeof document !== 'undefined' ? document.getElementById(fallbackId) : null),
        );
    });
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
