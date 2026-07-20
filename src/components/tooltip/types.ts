import type { HTMLAttributes } from 'vue';
import type { ComponentColorValue } from '../../utils/componentColors';
import type { StylesApiProps } from '../../styles-api';

export const tooltipParts = ['root', 'trigger', 'content'] as const;
export type TooltipPart = (typeof tooltipParts)[number];
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
    class?: HTMLAttributes['class'];
    style?: HTMLAttributes['style'];
    'data-state'?: 'open' | 'closed';
    'data-disabled'?: '';
}

export interface TooltipSlotProps {
    triggerProps: TooltipTriggerProps;
}

export interface TooltipProps
    extends FloatingPositionProps<TooltipPlacement>, StylesApiProps<TooltipPart> {
    id?: string;
    baseZIndex?: number;
    content?: string;
    color?: TooltipColor;
    autoContrast?: boolean;
    contrastColor?: string;
    open?: boolean;
    openDelay?: number;
    disabled?: boolean;
    decorative?: boolean;
}
