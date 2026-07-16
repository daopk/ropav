import type { VirtualElement } from '@floating-ui/dom';
import type { CSSProperties, MaybeRefOrGetter, Ref } from 'vue';

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
