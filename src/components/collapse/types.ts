import type { ComputedRef, MaybeRefOrGetter } from 'vue';

export type CollapseState = 'open' | 'closed';

export type CollapseContentRole = 'region' | 'group';

export type CollapseOption<T> = MaybeRefOrGetter<T>;

export interface CollapseRootProps {
    class: string[];
    'data-state': CollapseState;
    'data-disabled'?: boolean;
}

export interface CollapseTriggerProps {
    type: 'button';
    disabled?: boolean;
    'aria-controls': string;
    'aria-expanded': boolean;
    'aria-disabled'?: boolean;
    onClick: (event: MouseEvent) => void;
}

export interface CollapseContentProps {
    class: string;
    id: string;
    role: CollapseContentRole;
    'data-state': CollapseState;
    'aria-hidden'?: 'true';
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
}

export interface CollapseSlotProps {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface CollapseTriggerSlotProps extends CollapseSlotProps {
    triggerProps: CollapseTriggerProps;
}

export interface CollapseProps {
    id?: string;
    open?: boolean;
    disabled?: boolean;
    unmountOnExit?: boolean;
    role?: CollapseContentRole;
    ariaLabel?: string;
    ariaDescribedby?: string;
    ariaLabelledby?: string;
}

export interface UseCollapseOptions {
    id?: CollapseOption<string | undefined>;
    open?: CollapseOption<boolean | undefined>;
    disabled?: CollapseOption<boolean | undefined>;
    unmountOnExit?: CollapseOption<boolean | undefined>;
    role?: CollapseOption<CollapseContentRole | undefined>;
    ariaLabel?: CollapseOption<string | undefined>;
    ariaDescribedby?: CollapseOption<string | undefined>;
    ariaLabelledby?: CollapseOption<string | undefined>;
    onOpenChange?: (open: boolean) => void;
}

export interface UseCollapseReturn {
    id: ComputedRef<string>;
    state: ComputedRef<CollapseState>;
    isDisabled: ComputedRef<boolean>;
    isOpen: ComputedRef<boolean>;
    shouldRenderContent: ComputedRef<boolean>;
    rootClass: ComputedRef<string[]>;
    rootProps: ComputedRef<CollapseRootProps>;
    triggerProps: ComputedRef<CollapseTriggerProps>;
    contentProps: ComputedRef<CollapseContentProps>;
    triggerSlotProps: ComputedRef<CollapseTriggerSlotProps>;
    contentSlotProps: ComputedRef<CollapseSlotProps>;
    setOpen: (open: boolean) => void;
    open: () => void;
    close: () => void;
    toggle: () => void;
}
