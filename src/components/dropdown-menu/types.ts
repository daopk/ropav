import type { Component, HTMLAttributes, Ref } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const dropdownMenuParts = [
    'root',
    'trigger',
    'content',
    'item',
    'label',
    'shortcut',
    'submenu',
    'submenuIndicator',
    'empty',
] as const;
export type DropdownMenuPart = (typeof dropdownMenuParts)[number];
import type {
    FloatingAutoUpdateOptions,
    FloatingCollisionPadding,
    FloatingFlipOptions,
    FloatingOffset,
    FloatingOffsetOptions,
    FloatingPositionProps,
    FloatingStrategy,
    FloatingTarget,
    FloatingVirtualElement,
    TeleportProps,
} from '../floating/types';

export type DropdownMenuPlacement =
    | 'top-start'
    | 'top'
    | 'top-end'
    | 'right-start'
    | 'right'
    | 'right-end'
    | 'bottom-start'
    | 'bottom'
    | 'bottom-end'
    | 'left-start'
    | 'left'
    | 'left-end';

export type DropdownMenuTarget = FloatingTarget;

export type DropdownMenuStrategy = FloatingStrategy;

export type DropdownMenuCollisionPadding = FloatingCollisionPadding;

export type DropdownMenuItemValue = string | number;

export type DropdownMenuFocusTarget = 'first' | 'last';

export type DropdownMenuItemPath = number[];

export interface DropdownMenuOpenOptions {
    focus?: DropdownMenuFocusTarget;
}

export interface DropdownMenuCloseOptions {
    focusTrigger?: boolean;
}

export interface DropdownMenuItem {
    label: string;
    value: DropdownMenuItemValue;
    disabled?: boolean;
    destructive?: boolean;
    shortcut?: string;
    children?: DropdownMenuItem[];
}

export interface DropdownMenuTriggerProps {
    'aria-controls'?: string;
    'aria-expanded'?: boolean;
    'aria-haspopup': 'menu';
    disabled?: boolean;
    class?: HTMLAttributes['class'];
    style?: HTMLAttributes['style'];
    'data-state'?: 'open' | 'closed';
    'data-disabled'?: '';
    onClick: (event: MouseEvent) => void;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface DropdownMenuContentProps {
    id: string;
    role: 'menu';
    tabindex: -1;
    'aria-label'?: string;
    'aria-activedescendant'?: string;
    onKeydown: (event: KeyboardEvent) => void;
    onMousemove: (event: MouseEvent) => void;
    onMouseleave: (event: MouseEvent) => void;
}

export interface DropdownMenuSlotProps {
    triggerProps: DropdownMenuTriggerProps;
    isOpen: boolean;
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions) => void;
    toggle: () => void;
}

export interface DropdownMenuItemSlotProps {
    item: DropdownMenuItem;
    index: number;
    path: DropdownMenuItemPath;
    level: number;
    focused: boolean;
    disabled: boolean;
    hasSubmenu: boolean;
    isSubmenuOpen: boolean;
    select: () => void;
    openSubmenu: (focus?: DropdownMenuFocusTarget) => void;
    closeSubmenu: () => void;
    close: (options?: DropdownMenuCloseOptions) => void;
}

export interface DropdownMenuItemProps {
    id: string;
    type: 'button';
    role: 'menuitem';
    tabindex: -1;
    class: string[];
    'aria-controls'?: string;
    'aria-expanded'?: boolean;
    'aria-haspopup'?: 'menu';
    'aria-disabled'?: true;
    'data-disabled'?: '';
    'data-highlighted'?: '';
    'data-submenu'?: '';
    onClick: (event: MouseEvent) => void;
    onMouseenter: (event: MouseEvent) => void;
}

export interface DropdownMenuSubmenuProps {
    id: string;
    role: 'menu';
    class: string[];
    'aria-label'?: string;
    'aria-activedescendant'?: string;
}

export interface DropdownMenuRenderedItem {
    item: DropdownMenuItem;
    index: number;
    key: string;
    path: DropdownMenuItemPath;
    level: number;
    focused: boolean;
    disabled: boolean;
    hasSubmenu: boolean;
    submenuOpen: boolean;
    props: DropdownMenuItemProps;
    submenuProps?: DropdownMenuSubmenuProps;
    slotProps: DropdownMenuItemSlotProps;
    children: DropdownMenuRenderedItem[];
}

export interface DropdownMenuProps
    extends FloatingPositionProps<DropdownMenuPlacement>, StylesApiProps<DropdownMenuPart> {
    id?: string;
    baseZIndex?: number;
    items?: DropdownMenuItem[];
    open?: boolean;
    disabled?: boolean;
    closeOnSelect?: boolean;
    ariaLabel?: string;
    modal?: boolean;
    ignore?: readonly DropdownMenuInteractOutsideTarget[];
    /** @deprecated Use `teleport` instead. */
    portal?: boolean;
    /** @deprecated Use `teleportTo` instead. */
    portalTo?: string | HTMLElement;
}

export type DropdownMenuAs = string | Component;

export type DropdownMenuCheckedState = boolean | 'indeterminate';

export interface DropdownMenuPoint {
    x: number;
    y: number;
}

export type DropdownMenuVirtualAnchor = FloatingVirtualElement;

export interface DropdownMenuSelectDetail {
    originalEvent: Event;
    value?: DropdownMenuItemValue;
}

export type DropdownMenuSelectEvent = CustomEvent<DropdownMenuSelectDetail>;

export interface DropdownMenuInteractOutsideDetail {
    originalEvent: Event;
}

export type DropdownMenuInteractOutsideEvent = CustomEvent<DropdownMenuInteractOutsideDetail>;

export type DropdownMenuInteractOutsideTarget =
    | string
    | Element
    | null
    | undefined
    | Readonly<Ref<Element | null | undefined>>;

export type DropdownMenuOffsetOptions = FloatingOffsetOptions;

export type DropdownMenuOffset = FloatingOffset;

export interface DropdownMenuRootPrimitiveProps {
    id?: string;
    open?: boolean;
    defaultOpen?: boolean;
    baseZIndex?: number;
    disabled?: boolean;
    modal?: boolean;
    target?: FloatingTarget | null;
    virtualAnchor?: DropdownMenuVirtualAnchor | null;
}

export interface DropdownMenuRootSlotProps {
    isOpen: boolean;
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions) => void;
    toggle: () => void;
    openAt: (
        point: DropdownMenuPoint,
        options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
    ) => void;
}

export interface DropdownMenuTriggerPrimitiveProps {
    id?: string;
    as?: DropdownMenuAs;
    disabled?: boolean;
}

export interface DropdownMenuContextTriggerPrimitiveProps {
    id?: string;
    as?: DropdownMenuAs;
    disabled?: boolean;
    longPressDelay?: number;
    longPressTolerance?: number;
}

export interface DropdownMenuPortalPrimitiveProps extends TeleportProps {
    to?: string | HTMLElement;
    disabled?: boolean;
}

export interface DropdownMenuContentPrimitiveProps {
    id?: string;
    as?: DropdownMenuAs;
    placement?: DropdownMenuPlacement;
    offset?: DropdownMenuOffset;
    strategy?: FloatingStrategy;
    flip?: boolean;
    flipOptions?: FloatingFlipOptions;
    shift?: boolean;
    collisionPadding?: FloatingCollisionPadding;
    autoUpdateOptions?: FloatingAutoUpdateOptions;
    arrow?: boolean;
    /** @deprecated Use `flip` and `shift` instead. */
    avoidCollisions?: boolean;
    forceMount?: boolean;
    ignore?: readonly DropdownMenuInteractOutsideTarget[];
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
}

export interface DropdownMenuItemPrimitiveProps {
    id?: string;
    as?: DropdownMenuAs;
    value?: DropdownMenuItemValue;
    disabled?: boolean;
    destructive?: boolean;
    closeOnSelect?: boolean;
}

export interface DropdownMenuItemPrimitiveSlotProps {
    focused: boolean;
    disabled: boolean;
    select: () => void;
}

export interface DropdownMenuSeparatorPrimitiveProps {
    id?: string;
    as?: DropdownMenuAs;
    orientation?: 'horizontal' | 'vertical';
}

export interface DropdownMenuLabelPrimitiveProps {
    id?: string;
    as?: DropdownMenuAs;
}

export interface DropdownMenuCheckboxItemPrimitiveProps extends Omit<
    DropdownMenuItemPrimitiveProps,
    'value'
> {
    modelValue?: DropdownMenuCheckedState;
    defaultValue?: DropdownMenuCheckedState;
}

export interface DropdownMenuRadioGroupPrimitiveProps {
    id?: string;
    as?: DropdownMenuAs;
    modelValue?: DropdownMenuItemValue | null;
    defaultValue?: DropdownMenuItemValue | null;
    ariaLabel?: string;
    ariaLabelledby?: string;
}

export interface DropdownMenuRadioItemPrimitiveProps extends Omit<
    DropdownMenuItemPrimitiveProps,
    'value'
> {
    value: DropdownMenuItemValue;
}

export interface DropdownMenuItemIndicatorPrimitiveProps {
    as?: DropdownMenuAs;
    forceMount?: boolean;
}

export interface DropdownMenuSubPrimitiveProps {
    open?: boolean;
    defaultOpen?: boolean;
}

export interface DropdownMenuSubTriggerPrimitiveProps {
    id?: string;
    as?: DropdownMenuAs;
    disabled?: boolean;
}

export interface DropdownMenuSubContentPrimitiveProps extends Omit<
    DropdownMenuContentPrimitiveProps,
    'arrow' | 'ignore' | 'placement'
> {
    placement?: DropdownMenuPlacement;
}
