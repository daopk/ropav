import type { ComputedRef, HTMLAttributes, InjectionKey } from 'vue';
import type { StylesApiProps } from '../../styles-api';
import type {
    CollapseContentProps,
    CollapseContentRole,
    CollapseTriggerProps,
} from '../collapse/types';

export type AccordionItemValue = string | number;

export type AccordionModelValue = AccordionItemValue | AccordionItemValue[] | null;

export type AccordionOrientation = 'vertical' | 'horizontal';

export type AccordionState = 'open' | 'closed';

export const accordionParts = ['root'] as const;
export const accordionItemParts = ['root', 'trigger', 'title', 'icon', 'content'] as const;

export type AccordionPart = (typeof accordionParts)[number];
export type AccordionItemPart = (typeof accordionItemParts)[number];

export interface AccordionProps extends StylesApiProps<AccordionPart> {
    id?: string;
    modelValue?: AccordionModelValue;
    defaultValue?: AccordionModelValue;
    multiple?: boolean;
    collapsible?: boolean;
    disabled?: boolean;
    unmountOnExit?: boolean;
    orientation?: AccordionOrientation;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}

export interface AccordionItemProps extends StylesApiProps<AccordionItemPart> {
    id?: string;
    value: AccordionItemValue;
    title?: string;
    disabled?: boolean;
    unmountOnExit?: boolean;
    role?: CollapseContentRole;
    ariaLabel?: string;
    ariaDescribedby?: string;
    ariaLabelledby?: string;
}

export interface AccordionRootProps {
    id?: string;
    class: string[];
    'data-disabled'?: boolean;
    'data-orientation': AccordionOrientation;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface AccordionItemRootProps {
    id: string;
    class: string[];
    'data-state': AccordionState;
    'data-disabled'?: boolean;
}

export interface AccordionTriggerProps extends CollapseTriggerProps {
    id: string;
    class: HTMLAttributes['class'];
    'aria-disabled'?: boolean;
}

export interface AccordionContentProps extends CollapseContentProps {
    class: string;
}

export interface AccordionItemSlotProps {
    value: AccordionItemValue;
    isOpen: boolean;
    disabled: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface AccordionItemTriggerSlotProps extends AccordionItemSlotProps {
    triggerProps: AccordionTriggerProps;
}

export interface AccordionContext {
    multiple: boolean;
    collapsible: boolean;
    disabled: boolean;
    unmountOnExit: boolean;
    orientation: AccordionOrientation;
    isItemOpen: (value: AccordionItemValue) => boolean;
    setItemOpen: (value: AccordionItemValue, open: boolean) => void;
}

export interface UseAccordionReturn {
    rootClass: ComputedRef<string[]>;
    rootProps: ComputedRef<AccordionRootProps>;
    openValues: ComputedRef<AccordionItemValue[]>;
    setItemOpen: (value: AccordionItemValue, open: boolean) => void;
}

export interface UseAccordionItemReturn {
    group: AccordionContext;
    id: ComputedRef<string>;
    triggerId: ComputedRef<string>;
    contentId: ComputedRef<string>;
    state: ComputedRef<AccordionState>;
    isOpen: ComputedRef<boolean>;
    isDisabled: ComputedRef<boolean>;
    shouldRenderContent: ComputedRef<boolean>;
    rootClass: ComputedRef<string[]>;
    rootProps: ComputedRef<AccordionItemRootProps>;
    triggerProps: ComputedRef<AccordionTriggerProps>;
    contentProps: ComputedRef<AccordionContentProps>;
    triggerSlotProps: ComputedRef<AccordionItemTriggerSlotProps>;
    contentSlotProps: ComputedRef<AccordionItemSlotProps>;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export const accordionKey = Symbol('accordion') as InjectionKey<AccordionContext>;
