import type { Ref } from 'vue';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export type TooltipColor =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral';

export type TooltipTarget = string | HTMLElement | Ref<HTMLElement | null | undefined>;

export interface TooltipOffsetOptions {
    mainAxis?: number;
    crossAxis?: number;
}

export type TooltipOffset = number | TooltipOffsetOptions;

export interface TooltipTriggerProps {
    'aria-describedby'?: string;
}

export interface TooltipSlotProps {
    triggerProps: TooltipTriggerProps;
}

export interface TooltipProps {
    id?: string;
    content?: string;
    target?: TooltipTarget | null;
    placement?: TooltipPlacement;
    color?: TooltipColor;
    offset?: TooltipOffset;
    open?: boolean;
    openDelay?: number;
    arrow?: boolean;
    disabled?: boolean;
}
