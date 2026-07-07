export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export type TooltipColor =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral';

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
    color?: TooltipColor;
    open?: boolean;
    openDelay?: number;
    arrow?: boolean;
    disabled?: boolean;
}
