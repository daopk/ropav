import type { ComputedRef } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const tabsParts = ['root'] as const;
export const tabsListParts = ['root'] as const;
export const tabsTriggerParts = ['root'] as const;
export const tabsContentParts = ['root'] as const;
export type TabsPart = (typeof tabsParts)[number];
export type TabsListPart = (typeof tabsListParts)[number];
export type TabsTriggerPart = (typeof tabsTriggerParts)[number];
export type TabsContentPart = (typeof tabsContentParts)[number];

export type TabsValue = string | number;

export type TabsOrientation = 'horizontal' | 'vertical';

export type TabsPlacement = 'left' | 'right';

export type TabsTriggerAlign = 'left' | 'center' | 'right';

export type TabsActivationMode = 'automatic' | 'manual';

export type TabsState = 'active' | 'inactive';

export type TabsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TabsVariant = 'line' | 'pills' | 'outline';

export interface TabsProps extends StylesApiProps<TabsPart> {
    id?: string;
    modelValue?: TabsValue | null;
    defaultValue?: TabsValue | null;
    size?: TabsSize;
    variant?: TabsVariant;
    orientation?: TabsOrientation;
    placement?: TabsPlacement;
    align?: TabsTriggerAlign;
    activationMode?: TabsActivationMode;
    disabled?: boolean;
    unmountOnExit?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}

export interface TabsListProps extends StylesApiProps<TabsListPart> {
    id?: string;
    ariaLabel?: string;
    ariaDescribedby?: string;
    ariaLabelledby?: string;
}

export interface TabsTriggerProps extends StylesApiProps<TabsTriggerPart> {
    id?: string;
    value: TabsValue;
    disabled?: boolean;
    align?: TabsTriggerAlign;
}

export interface TabsContentProps extends StylesApiProps<TabsContentPart> {
    id?: string;
    value: TabsValue;
    unmountOnExit?: boolean;
    ariaLabel?: string;
    ariaDescribedby?: string;
    ariaLabelledby?: string;
}

export interface TabsRootProps {
    id?: string;
    class: string[];
    'data-disabled'?: boolean;
    'data-size': TabsSize;
    'data-variant': TabsVariant;
    'data-orientation': TabsOrientation;
    'data-placement'?: TabsPlacement;
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
    'data-variant': TabsVariant;
    'data-orientation': TabsOrientation;
    'data-placement'?: TabsPlacement;
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
    'data-variant': TabsVariant;
    'data-align'?: TabsTriggerAlign;
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
    variant: TabsVariant;
    disabled: boolean;
    placement: TabsPlacement;
    align: TabsTriggerAlign;
    select: (value: TabsValue) => void;
}

export interface TabsListSlotProps {
    disabled: boolean;
    variant: TabsVariant;
    orientation: TabsOrientation;
    placement: TabsPlacement;
}

export interface TabsTriggerSlotProps {
    value: TabsValue;
    selected: boolean;
    size: TabsSize;
    variant: TabsVariant;
    disabled: boolean;
    align: TabsTriggerAlign;
    select: () => void;
}

export interface TabsContentSlotProps {
    value: TabsValue;
    selected: boolean;
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
