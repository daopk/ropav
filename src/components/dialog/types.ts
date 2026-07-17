import type { Component } from 'vue';
import type { FocusTrapInitialFocus, FocusTrapOptions } from '../focus-trap/types';
import type { TeleportProps } from '../floating/types';

export type DialogAs = string | Component;

export type DialogRole = 'dialog' | 'alertdialog';

export type DialogCloseReason = 'escape' | 'outside' | 'programmatic';

export interface DialogInteractOutsideDetail {
    originalEvent: Event;
}

export type DialogInteractOutsideEvent = CustomEvent<DialogInteractOutsideDetail>;

export type DialogFocusTrapOptions = Omit<
    FocusTrapOptions,
    | 'allowOutsideClick'
    | 'clickOutsideDeactivates'
    | 'escapeDeactivates'
    | 'fallbackFocus'
    | 'initialFocus'
    | 'preventScroll'
    | 'returnFocusOnDeactivate'
>;

export interface DialogRootProps {
    open?: boolean;
    defaultOpen?: boolean;
    baseZIndex?: number;
    modal?: boolean;
    closeOnEscape?: boolean;
    closeOnOutsideClick?: boolean;
    preventScroll?: boolean;
    returnFocus?: boolean;
}

export interface DialogRootSlotProps {
    isOpen: boolean;
    zIndex: number;
    open: () => void;
    close: (reason?: DialogCloseReason) => void;
    toggle: () => void;
}

export interface DialogTriggerProps {
    id?: string;
    as?: DialogAs;
    disabled?: boolean;
}

export interface DialogPortalProps extends TeleportProps {}

export interface DialogOverlayProps {
    as?: DialogAs;
    forceMount?: boolean;
}

export interface DialogContentProps {
    id?: string;
    as?: DialogAs;
    role?: DialogRole;
    forceMount?: boolean;
    initialFocus?: FocusTrapInitialFocus | null;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    focusTrapOptions?: DialogFocusTrapOptions;
}

export interface DialogTitleProps {
    id?: string;
    as?: DialogAs;
}

export interface DialogDescriptionProps {
    id?: string;
    as?: DialogAs;
}

export interface DialogCloseProps {
    as?: DialogAs;
    disabled?: boolean;
}
