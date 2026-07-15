import type { ComponentColorValue } from '../../utils/componentColors';
import type {
    FloatingOffset,
    FloatingOffsetOptions,
    FloatingPositionProps,
    FloatingTarget,
} from '../floating/types';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export type TooltipColor = ComponentColorValue;

export type TooltipTarget = FloatingTarget;

export type TooltipOffsetOptions = FloatingOffsetOptions;

export type TooltipOffset = FloatingOffset;

export interface TooltipTriggerProps {
    'aria-describedby'?: string;
}

export interface TooltipSlotProps {
    triggerProps: TooltipTriggerProps;
}

export interface TooltipProps extends FloatingPositionProps<TooltipPlacement> {
    id?: string;
    content?: string;
    color?: TooltipColor;
    autoContrast?: boolean;
    open?: boolean;
    openDelay?: number;
    disabled?: boolean;
    decorative?: boolean;
}
