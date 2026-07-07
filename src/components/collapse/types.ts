import type { ComputedRef, Ref } from 'vue';

export type CollapseState = 'open' | 'closed';

export type CollapseContentRole = 'region' | 'group';

export type CollapseOptionValue<T> = T | Ref<T> | (() => T);

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
    defaultOpen?: boolean;
    disabled?: boolean;
    unmountOnExit?: boolean;
    role?: CollapseContentRole;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}

export interface UseCollapseOptions {
    id?: CollapseOptionValue<string | undefined>;
    open?: CollapseOptionValue<boolean | undefined>;
    defaultOpen?: CollapseOptionValue<boolean | undefined>;
    disabled?: CollapseOptionValue<boolean | undefined>;
    unmountOnExit?: CollapseOptionValue<boolean | undefined>;
    role?: CollapseOptionValue<CollapseContentRole | undefined>;
    ariaLabel?: CollapseOptionValue<string | undefined>;
    describedby?: CollapseOptionValue<string | undefined>;
    labelledby?: CollapseOptionValue<string | undefined>;
    onOpenChange?: (open: boolean) => void;
}

export interface UseCollapseReturn {
    collapseId: ComputedRef<string>;
    collapseState: ComputedRef<CollapseState>;
    contentRole: ComputedRef<CollapseContentRole>;
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
    openCollapse: () => void;
    closeCollapse: () => void;
    toggleCollapse: () => void;
}
