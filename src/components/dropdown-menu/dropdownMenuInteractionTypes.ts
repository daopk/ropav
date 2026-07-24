import type { ComputedRef, Ref } from 'vue';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuInteractOutsideTarget,
    DropdownMenuOpenOptions,
    DropdownMenuPlacement,
    DropdownMenuSelectEvent,
} from './types';

export type DropdownMenuInteractionFocusTarget = DropdownMenuFocusTarget | false;

export interface DropdownMenuInteractionMenuRegistration {
    id: string;
    parentItemId?: () => string | undefined;
    element: () => HTMLElement | null;
    focusTarget?: () => HTMLElement | null;
    placement: () => DropdownMenuPlacement;
    isOpen: () => boolean;
    setOpen?: (open: boolean) => void;
    stopKeyPropagation?: boolean;
    onEscape?: (event: KeyboardEvent) => boolean;
}

export interface DropdownMenuInteractionMenuStateRegistration {
    id: string;
    isOpen: () => boolean;
    setOpen: (open: boolean) => void;
}

export interface DropdownMenuInteractionItemRegistration {
    id: string;
    menuId: string;
    element: () => HTMLElement | null;
    textValue: () => string;
    disabled: () => boolean;
    order?: () => number;
    submenuId?: () => string | undefined;
    submenuDirection?: () => 'left' | 'right';
    select?: (originalEvent: Event) => DropdownMenuSelectEvent | undefined;
    closeOnSelect?: () => boolean;
}

export interface DropdownMenuInteractionDismissalRegistration {
    ignoredTargets: () => readonly DropdownMenuInteractOutsideTarget[];
    pointerDownOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
    focusOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
    interactOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
}

export interface DropdownMenuInteractionHost {
    rootMenuId: string;
    isOpen: Readonly<Ref<boolean>>;
    disabled: Readonly<Ref<boolean>>;
    modal: Readonly<Ref<boolean>>;
    setOpen: (open: boolean) => void;
    isTopLayer: () => boolean;
    focusTrigger: () => void;
    beforeOpen?: () => void;
    beforeClose?: () => void;
}

export interface DropdownMenuInteractionMenuOptions {
    element: () => HTMLElement | null;
    focusTarget?: () => HTMLElement | null;
    placement: () => DropdownMenuPlacement;
    stopKeyPropagation?: boolean;
    onEscape?: (event: KeyboardEvent) => boolean;
}

export interface DropdownMenuInteractionItemOptions {
    id: string;
    element: () => HTMLElement | null;
    textValue: () => string;
    disabled: () => boolean;
    order?: () => number;
    submenu?: DropdownMenuInteractionSubmenu;
    submenuDirection?: () => 'left' | 'right';
    select?: (originalEvent: Event) => DropdownMenuSelectEvent | undefined;
    closeOnSelect?: () => boolean;
}

export interface DropdownMenuInteractionItem {
    active: ComputedRef<boolean>;
    submenuOpen: ComputedRef<boolean>;
    setActive: (focusElement?: boolean) => boolean;
    openSubmenu: (focus?: DropdownMenuInteractionFocusTarget) => boolean;
    closeSubmenu: (focusParent?: boolean) => boolean;
    select: (originalEvent?: Event) => void;
    activate: (originalEvent?: Event) => void;
    hover: (openSubmenu?: boolean) => boolean;
    dispose: () => void;
}

export interface DropdownMenuInteractionMenu {
    activeId: ComputedRef<string | null>;
    connectItem: (registration: DropdownMenuInteractionItemOptions) => DropdownMenuInteractionItem;
    clearActive: () => void;
    focusPending: () => boolean;
    onKeydown: (event: KeyboardEvent) => void;
    dispose: () => void;
}

export interface DropdownMenuInteractionSubmenu {
    id: string;
    open: (focus?: DropdownMenuInteractionFocusTarget) => boolean;
    close: (focusParent?: boolean) => boolean;
    connectContent: (options: DropdownMenuInteractionMenuOptions) => DropdownMenuInteractionMenu;
    dispose: () => void;
}

export interface DropdownMenuInteractionSubmenuOptions {
    id: string;
    parentItemId: () => string | undefined;
    isOpen: () => boolean;
    setOpen: (open: boolean) => void;
}

export interface DropdownMenuInteraction {
    activeItemId: Readonly<Ref<string | null>>;
    connectRootMenu: (options: DropdownMenuInteractionMenuOptions) => DropdownMenuInteractionMenu;
    connectSubmenu: (
        options: DropdownMenuInteractionSubmenuOptions,
    ) => DropdownMenuInteractionSubmenu;
    connectInside: (element: Element) => () => void;
    connectDismissal: (registration: DropdownMenuInteractionDismissalRegistration) => () => void;
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions & { returnFocus?: boolean }) => void;
    toggle: () => void;
    onTriggerClick: (beforeToggle?: () => void) => void;
    onTriggerKeydown: (event: KeyboardEvent, beforeOpen?: () => void) => void;
    onMenuKeydown: (event: KeyboardEvent) => void;
}
