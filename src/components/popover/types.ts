import type { Ref } from 'vue';

export type PopoverPlacement = 'top' | 'right' | 'bottom' | 'left';

export type PopoverTarget = string | HTMLElement | Ref<HTMLElement | null | undefined>;

export interface PopoverOffsetOptions {
    mainAxis?: number;
    crossAxis?: number;
}

export type PopoverOffset = number | PopoverOffsetOptions;

export type PopoverRole = 'dialog';

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
}
