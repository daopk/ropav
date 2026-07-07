export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipTriggerProps {
    'aria-describedby'?: string;
}

export interface TooltipSlotProps {
    triggerProps: TooltipTriggerProps;
}

export interface TooltipProps {
    id?: string;
    content?: string;
    placement?: TooltipPlacement;
    open?: boolean;
    openDelay?: number;
    arrow?: boolean;
    disabled?: boolean;
}
