import type { ComputedRef, InjectionKey } from 'vue';

export type TabsValue = string | number;

export type TabsOrientation = 'horizontal' | 'vertical';

export type TabsActivationMode = 'automatic' | 'manual';

export type TabsState = 'active' | 'inactive';

export type TabsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface TabsProps {
    id?: string;
    modelValue?: TabsValue | null;
    defaultValue?: TabsValue | null;
    size?: TabsSize;
    orientation?: TabsOrientation;
    activationMode?: TabsActivationMode;
    disabled?: boolean;
    unmountOnExit?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}

export interface TabsListProps {
    id?: string;
    ariaLabel?: string;
    ariaDescribedby?: string;
    ariaLabelledby?: string;
}

export interface TabsTriggerProps {
    id?: string;
    value: TabsValue;
    disabled?: boolean;
}

export interface TabsContentProps {
    id?: string;
    value: TabsValue;
    unmountOnExit?: boolean;
    ariaLabel?: string;
    ariaDescribedby?: string;
    ariaLabelledby?: string;
}

export interface TabsTriggerRegistration {
    id: string;
    value: TabsValue;
    disabled: boolean;
}

export interface TabsContentRegistration {
    id: string;
    value: TabsValue;
}

export interface TabsRootProps {
    id?: string;
    class: string[];
    'data-disabled'?: boolean;
    'data-size': TabsSize;
    'data-orientation': TabsOrientation;
    'data-activation-mode': TabsActivationMode;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
}

export interface TabsListRootProps {
    id?: string;
    class: string[];
    role: 'tablist';
    'data-disabled'?: boolean;
    'data-orientation': TabsOrientation;
    'aria-orientation': TabsOrientation;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface TabsTriggerRootProps {
    id: string;
    class: string[];
    role: 'tab';
    type: 'button';
    disabled?: boolean;
    tabIndex: number;
    'data-state': TabsState;
    'data-disabled'?: boolean;
    'aria-selected': boolean;
    'aria-controls'?: string;
    'aria-disabled'?: boolean;
    onClick: (event: MouseEvent) => void;
    onFocus: (event: FocusEvent) => void;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface TabsContentRootProps {
    id: string;
    class: string[];
    role: 'tabpanel';
    tabIndex: number;
    hidden?: boolean;
    'data-state': TabsState;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
}

export interface TabsSlotProps {
    value: TabsValue | null;
    size: TabsSize;
    disabled: boolean;
    select: (value: TabsValue) => void;
}

export interface TabsListSlotProps {
    disabled: boolean;
    orientation: TabsOrientation;
}

export interface TabsTriggerSlotProps {
    value: TabsValue;
    selected: boolean;
    size: TabsSize;
    disabled: boolean;
    select: () => void;
}

export interface TabsContentSlotProps {
    value: TabsValue;
    selected: boolean;
}

export interface TabsContext {
    selectedValue: TabsValue | null;
    size: TabsSize;
    disabled: boolean;
    orientation: TabsOrientation;
    activationMode: TabsActivationMode;
    unmountOnExit: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    isSelected: (value: TabsValue) => boolean;
    selectValue: (value: TabsValue) => void;
    getFocusableValue: () => TabsValue | null;
    getTriggerId: (value: TabsValue) => string | undefined;
    getContentId: (value: TabsValue) => string | undefined;
    getTriggerValue: (id: string) => TabsValue | undefined;
    registerTrigger: (registration: TabsTriggerRegistration) => void;
    unregisterTrigger: (id: string) => void;
    registerContent: (registration: TabsContentRegistration) => void;
    unregisterContent: (id: string) => void;
    onListKeydown: (event: KeyboardEvent) => void;
}

export interface UseTabsReturn {
    rootClass: ComputedRef<string[]>;
    rootProps: ComputedRef<TabsRootProps>;
    slotProps: ComputedRef<TabsSlotProps>;
    selectedValue: ComputedRef<TabsValue | null>;
    selectValue: (value: TabsValue) => void;
}

export interface UseTabsListReturn {
    rootClass: ComputedRef<string[]>;
    rootProps: ComputedRef<TabsListRootProps>;
    slotProps: ComputedRef<TabsListSlotProps>;
}

export interface UseTabsTriggerReturn {
    id: ComputedRef<string>;
    state: ComputedRef<TabsState>;
    isSelected: ComputedRef<boolean>;
    isDisabled: ComputedRef<boolean>;
    rootClass: ComputedRef<string[]>;
    rootProps: ComputedRef<TabsTriggerRootProps>;
    slotProps: ComputedRef<TabsTriggerSlotProps>;
    select: () => void;
}

export interface UseTabsContentReturn {
    id: ComputedRef<string>;
    state: ComputedRef<TabsState>;
    isSelected: ComputedRef<boolean>;
    shouldRenderContent: ComputedRef<boolean>;
    rootClass: ComputedRef<string[]>;
    rootProps: ComputedRef<TabsContentRootProps>;
    slotProps: ComputedRef<TabsContentSlotProps>;
}

export const tabsKey = Symbol('tabs') as InjectionKey<TabsContext>;
