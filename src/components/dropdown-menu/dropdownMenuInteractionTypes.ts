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

export interface DropdownMenuInteractionRuntime {
    rootMenuId: string;
    activeItemId: Readonly<Ref<string | null>>;
    activeMenuId: Readonly<Ref<string>>;
    pendingRootFocus: Ref<DropdownMenuInteractionFocusTarget>;
    registerMenu: (registration: DropdownMenuInteractionMenuRegistration) => () => void;
    unregisterMenu: (id: string) => void;
    registerMenuState: (registration: DropdownMenuInteractionMenuStateRegistration) => () => void;
    registerItem: (registration: DropdownMenuInteractionItemRegistration) => () => void;
    unregisterItem: (id: string) => void;
    registerInside: (element: Element) => void;
    unregisterInside: (element: Element) => void;
    registerDismissal: (registration: DropdownMenuInteractionDismissalRegistration) => () => void;
    getActiveId: (menuId: string) => ComputedRef<string | null>;
    getItem: (id: string) => DropdownMenuInteractionItemRegistration | undefined;
    getMenu: (id: string) => DropdownMenuInteractionMenuRegistration | undefined;
    isActive: (id: string) => boolean;
    isMenuOpen: (menuId: string) => boolean;
    setActive: (id: string | null, focusElement?: boolean) => boolean;
    focusMenu: (menuId: string, target?: DropdownMenuFocusTarget) => boolean;
    focusMenuElement: (menuId: string) => void;
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions & { returnFocus?: boolean }) => void;
    toggle: () => void;
    openMenu: (menuId: string, focus?: DropdownMenuInteractionFocusTarget) => boolean;
    closeMenu: (menuId: string, focusParent?: boolean) => boolean;
    closeSubmenus: (menuId: string, exceptMenuId?: string) => void;
    selectItem: (id: string, originalEvent?: Event) => void;
    activateItem: (id: string, originalEvent?: Event) => void;
    hoverItem: (id: string, openSubmenu?: boolean) => void;
    reconcile: (menuId?: string) => void;
    onTriggerClick: (beforeToggle?: () => void) => void;
    onTriggerKeydown: (event: KeyboardEvent, beforeOpen?: () => void) => void;
    onMenuKeydown: (menuId: string, event: KeyboardEvent) => void;
}
