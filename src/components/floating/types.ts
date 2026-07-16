import type { VirtualElement } from '@floating-ui/dom';
import type { ComputedRef, CSSProperties, MaybeRefOrGetter, Ref } from 'vue';

export type FloatingSide = 'top' | 'right' | 'bottom' | 'left';

export type FloatingAlignment = 'start' | 'end';

export type FloatingPlacement = FloatingSide | `${FloatingSide}-${FloatingAlignment}`;

export type FloatingStrategy = 'absolute' | 'fixed';

export interface FloatingOffsetOptions {
    mainAxis?: number;
    crossAxis?: number;
}

export type FloatingOffset = number | FloatingOffsetOptions;

export type FloatingCollisionPadding = number | Partial<Record<FloatingSide, number>>;

export type FloatingReference = Element | VirtualElement;

export type FloatingTarget = string | FloatingReference | Ref<FloatingReference | null | undefined>;

export interface FloatingPositionProps<
    TPlacement extends FloatingPlacement = FloatingPlacement,
> extends TeleportProps {
    target?: FloatingTarget | null;
    placement?: TPlacement;
    strategy?: FloatingStrategy;
    offset?: FloatingOffset;
    flip?: boolean;
    shift?: boolean;
    collisionPadding?: FloatingCollisionPadding;
    arrow?: boolean;
}

export interface UseFloatingPositionOptions {
    reference: MaybeRefOrGetter<FloatingReference | null | undefined>;
    floating: MaybeRefOrGetter<HTMLElement | null | undefined>;
    arrow?: MaybeRefOrGetter<HTMLElement | null | undefined>;
    open?: MaybeRefOrGetter<boolean | undefined>;
    placement?: MaybeRefOrGetter<FloatingPlacement | undefined>;
    strategy?: MaybeRefOrGetter<FloatingStrategy | undefined>;
    offset?: MaybeRefOrGetter<FloatingOffset | undefined>;
    flip?: MaybeRefOrGetter<boolean | undefined>;
    shift?: MaybeRefOrGetter<boolean | undefined>;
    collisionPadding?: MaybeRefOrGetter<FloatingCollisionPadding | undefined>;
    restartKey?: MaybeRefOrGetter<unknown>;
}

export interface UseFloatingPositionReturn {
    actualPlacement: Readonly<Ref<FloatingPlacement>>;
    arrowStyle: Readonly<Ref<CSSProperties | undefined>>;
    floatingStyle: Readonly<Ref<CSSProperties>>;
    isPositioned: Readonly<Ref<boolean>>;
    update: () => Promise<void>;
}

export type TeleportTargetValue = string | Element;

export type TeleportTarget = TeleportTargetValue | Ref<TeleportTargetValue | null | undefined>;

export interface TeleportProps {
    teleport?: boolean;
    teleportTo?: TeleportTarget | null;
}

export type FloatingVirtualElement = VirtualElement;

export type HoverDisclosureState = 'open' | 'closed';

export type HoverDisclosureTouchBehavior = 'none' | 'toggle';

export type HoverDisclosureOpenChangeReason =
    | 'hover'
    | 'focus'
    | 'touch'
    | 'escape'
    | 'outside'
    | 'disabled'
    | 'programmatic';

export type HoverDisclosureOption<T> = MaybeRefOrGetter<T>;

export type HoverDisclosureInteractionTarget = string | FloatingReference;

export type HoverDisclosureContentTarget = string | Element;

export interface HoverDisclosureOpenChangeDetails {
    reason: HoverDisclosureOpenChangeReason;
    event?: Event;
}

export interface HoverDisclosureTriggerProps {
    'data-state': HoverDisclosureState;
    onPointerenter: (event: PointerEvent) => void;
    onPointerleave: (event: PointerEvent) => void;
    onPointerdown: (event: PointerEvent) => void;
    onPointerup: (event: PointerEvent) => void;
    onPointercancel: (event: PointerEvent) => void;
    onClick: (event: MouseEvent) => void;
    onFocusin: (event: FocusEvent) => void;
    onFocusout: (event: FocusEvent) => void;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface HoverDisclosureContentProps {
    'data-state': HoverDisclosureState;
    onPointerenter: (event: PointerEvent) => void;
    onPointerleave: (event: PointerEvent) => void;
    onPointerdown: (event: PointerEvent) => void;
    onFocusin: (event: FocusEvent) => void;
    onFocusout: (event: FocusEvent) => void;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface UseHoverDisclosureOptions {
    open?: HoverDisclosureOption<boolean | undefined>;
    defaultOpen?: boolean;
    openDelay?: HoverDisclosureOption<number | undefined>;
    closeDelay?: HoverDisclosureOption<number | undefined>;
    disabled?: HoverDisclosureOption<boolean | undefined>;
    openOnFocus?: HoverDisclosureOption<boolean | undefined>;
    closeOnEscape?: HoverDisclosureOption<boolean | undefined>;
    touchBehavior?: HoverDisclosureOption<HoverDisclosureTouchBehavior | undefined>;
    interactionTarget?: HoverDisclosureOption<HoverDisclosureInteractionTarget | null | undefined>;
    contentTarget?: HoverDisclosureOption<HoverDisclosureContentTarget | null | undefined>;
    onOpenChange?: (open: boolean, details: HoverDisclosureOpenChangeDetails) => void;
}

export interface UseHoverDisclosureReturn {
    isOpen: ComputedRef<boolean>;
    isDisabled: ComputedRef<boolean>;
    state: ComputedRef<HoverDisclosureState>;
    triggerProps: ComputedRef<HoverDisclosureTriggerProps>;
    contentProps: ComputedRef<HoverDisclosureContentProps>;
    open: () => void;
    close: () => void;
    toggle: () => void;
}
