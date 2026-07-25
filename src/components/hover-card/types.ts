import type { HTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';
import type {
    FloatingOffset,
    FloatingOffsetOptions,
    FloatingPositionProps,
    FloatingTarget,
    HoverDisclosureOpenChangeDetails,
    HoverDisclosureOpenChangeReason,
    HoverDisclosureState,
    HoverDisclosureTouchBehavior,
} from '../floating/types';

export const hoverCardPlacements = [
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

export const hoverCardParts = ['root', 'trigger', 'content'] as const;

export type HoverCardPart = (typeof hoverCardParts)[number];

export type HoverCardPlacement = (typeof hoverCardPlacements)[number];

export type HoverCardTarget = FloatingTarget;

export type HoverCardOffsetOptions = FloatingOffsetOptions;

export type HoverCardOffset = FloatingOffset;

export type HoverCardTouchBehavior = HoverDisclosureTouchBehavior;

export type HoverCardOpenChangeReason = HoverDisclosureOpenChangeReason;

export type HoverCardOpenChangeDetails = HoverDisclosureOpenChangeDetails;

export interface HoverCardTriggerProps {
    class?: HTMLAttributes['class'];
    style?: HTMLAttributes['style'];
    'data-state': HoverDisclosureState;
    'data-disabled'?: '';
}

export interface HoverCardSlotProps {
    triggerProps: HoverCardTriggerProps;
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface HoverCardContentSlotProps {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface HoverCardProps
    extends FloatingPositionProps<HoverCardPlacement>, StylesApiProps<HoverCardPart> {
    id?: string;
    baseZIndex?: number;
    open?: boolean;
    defaultOpen?: boolean;
    openDelay?: number;
    closeDelay?: number;
    disabled?: boolean;
    openOnFocus?: boolean;
    closeOnEscape?: boolean;
    touchBehavior?: HoverCardTouchBehavior;
    keepMounted?: boolean;
}
