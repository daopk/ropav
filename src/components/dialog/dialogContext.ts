import type { ComputedRef, InjectionKey, Ref } from 'vue';
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

export function resolveDialogCloseReason(reason: unknown): DialogCloseReason {
    return reason === 'escape' || reason === 'outside' || reason === 'programmatic'
        ? reason
        : 'programmatic';
}
