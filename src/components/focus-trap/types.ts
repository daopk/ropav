import type {
    FocusTrap as FocusTrapInstance,
    FocusTargetValueOrFalse,
    Options as FocusTrapOptions,
} from 'focus-trap';
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue';

export type { FocusTrapOptions };

export type FocusTrapContainer = HTMLElement | SVGElement | string;

export type FocusTrapContainers = FocusTrapContainer | FocusTrapContainer[];

export type FocusTrapTarget = MaybeRefOrGetter<FocusTrapContainers | null | undefined>;

export type FocusTrapInitialFocus =
    | NonNullable<FocusTrapOptions['initialFocus']>
    | Ref<FocusTargetValueOrFalse | null | undefined>;

export type FocusTrapActivateOptions = Parameters<FocusTrapInstance['activate']>[0];

export type FocusTrapDeactivateOptions = Parameters<FocusTrapInstance['deactivate']>[0];

export type FocusTrapPauseOptions = Parameters<FocusTrapInstance['pause']>[0];

export type FocusTrapUnpauseOptions = Parameters<FocusTrapInstance['unpause']>[0];

export interface UseFocusTrapOptions extends FocusTrapOptions {
    immediate?: boolean;
}

export interface FocusTrapProps {
    active?: boolean;
    paused?: boolean;
    as?: keyof HTMLElementTagNameMap;
    options?: FocusTrapOptions;
}

export interface FocusTrapSlotProps {
    active: boolean;
    paused: boolean;
    activate: (options?: FocusTrapActivateOptions) => void;
    deactivate: (options?: FocusTrapDeactivateOptions) => void;
    pause: (options?: FocusTrapPauseOptions) => void;
    unpause: (options?: FocusTrapUnpauseOptions) => void;
}

export interface UseFocusTrapReturn {
    focusTrap: ShallowRef<FocusTrapInstance | null>;
    isActive: Readonly<Ref<boolean>>;
    isPaused: Readonly<Ref<boolean>>;
    activate: (options?: FocusTrapActivateOptions) => void;
    deactivate: (options?: FocusTrapDeactivateOptions) => void;
    pause: (options?: FocusTrapPauseOptions) => void;
    unpause: (options?: FocusTrapUnpauseOptions) => void;
    updateContainerElements: (containers: FocusTrapContainers) => void;
}
