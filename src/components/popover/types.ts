import type { Ref } from 'vue';
import type { FocusTrapInitialFocus, FocusTrapOptions } from '../focus-trap/types';

export const popoverPlacements = [
    'top-start',
    'top',
    'top-end',
    'right-start',
    'right',
    'right-end',
    'bottom-start',
    'bottom',
    'bottom-end',
    'left-start',
    'left',
    'left-end',
] as const;

export type PopoverPlacement = (typeof popoverPlacements)[number];

export type PopoverTarget = string | HTMLElement | Ref<HTMLElement | null | undefined>;

export interface PopoverOffsetOptions {
    mainAxis?: number;
    crossAxis?: number;
}

export type PopoverOffset = number | PopoverOffsetOptions;

export type PopoverRole = 'dialog';

export type PopoverFocusTrapOptions = Omit<
    FocusTrapOptions,
    | 'allowOutsideClick'
    | 'clickOutsideDeactivates'
    | 'escapeDeactivates'
    | 'fallbackFocus'
    | 'initialFocus'
    | 'returnFocusOnDeactivate'
>;

export interface PopoverTriggerProps {
    'aria-controls'?: string;
    'aria-expanded'?: boolean;
    'aria-haspopup'?: PopoverRole;
    onClick: (event: MouseEvent) => void;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface PopoverSlotProps {
    triggerProps: PopoverTriggerProps;
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface PopoverContentSlotProps {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface PopoverProps {
    id?: string;
    target?: PopoverTarget | null;
    placement?: PopoverPlacement;
    offset?: PopoverOffset;
    open?: boolean;
    disabled?: boolean;
    role?: PopoverRole;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    closeOnOutsideClick?: boolean;
    closeOnEscape?: boolean;
    keepMounted?: boolean;
    trapFocus?: boolean;
    initialFocus?: FocusTrapInitialFocus | null;
    returnFocus?: boolean;
    focusTrapOptions?: PopoverFocusTrapOptions;
}
