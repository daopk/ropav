import type { FocusTrapInitialFocus, FocusTrapOptions } from '../focus-trap/types';
import type {
    FloatingOffset,
    FloatingOffsetOptions,
    FloatingPositionProps,
    FloatingTarget,
} from '../floating/types';

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

export type PopoverTarget = FloatingTarget;

export type PopoverOffsetOptions = FloatingOffsetOptions;

export type PopoverOffset = FloatingOffset;

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

export interface PopoverProps extends FloatingPositionProps<PopoverPlacement> {
    id?: string;
    contentClass?: string;
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
