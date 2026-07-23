import {
    computed,
    onBeforeUnmount,
    ref,
    useId,
    watch,
    type ComputedRef,
    type InjectionKey,
    type Ref,
} from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import type { OverlayLayerContext } from '@/internal/composables/useOverlayLayer';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { createCancelableCustomEvent } from '@/utils/dom/events';
import { createPointRect } from '@/utils/geometry';
import type { FloatingReference } from '../floating/types';
import type {
    DropdownMenuInteractionFocusTarget,
    DropdownMenuInteractionRuntime,
} from './dropdownMenuInteraction';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuItemPrimitiveProps,
    DropdownMenuItemValue,
    DropdownMenuOpenOptions,
    DropdownMenuPlacement,
    DropdownMenuPoint,
    DropdownMenuSelectEvent,
    DropdownMenuVirtualAnchor,
} from './types';

export type ElementReference = FloatingReference;
export type OpenFocusTarget = DropdownMenuInteractionFocusTarget;

export interface MenuItemRegistration {
    id: string;
    element: () => HTMLElement | null;
    textValue: () => string;
    disabled: () => boolean;
    activate: (event: Event) => DropdownMenuSelectEvent | undefined;
    closeOnSelect?: () => boolean;
    submenu?: DropdownMenuSubContext;
}

export interface DropdownMenuContext {
    root: DropdownMenuRootContext;
    id: string;
    element: Ref<HTMLElement | null>;
    activeId: ComputedRef<string | null>;
    actualPlacement: Ref<DropdownMenuPlacement>;
    parentSub?: DropdownMenuSubContext;
    registerItem: (item: MenuItemRegistration) => void;
    unregisterItem: (id: string) => void;
    closeSubmenus: (except?: DropdownMenuSubContext) => void;
    setActive: (id: string) => void;
    isActive: (id: string) => boolean;
    focus: (target?: DropdownMenuFocusTarget) => boolean;
    focusElement: () => void;
    activate: (id: string, event?: Event) => void;
    hover: (id: string, openSubmenu?: boolean) => void;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface DropdownMenuSubContext {
    menuId: string;
    isOpen: ComputedRef<boolean>;
    trigger: Ref<HTMLElement | null>;
    contentId: Ref<string | undefined>;
    actualPlacement: Ref<DropdownMenuPlacement>;
    pendingFocus: Ref<OpenFocusTarget>;
    menu: DropdownMenuContext | null;
    setOpen: (open: boolean) => void;
    open: (focus?: OpenFocusTarget) => void;
    close: (focusParent?: boolean) => void;
}

export interface DropdownMenuRootContext {
    id: ComputedRef<string>;
    isOpen: ComputedRef<boolean>;
    disabled: ComputedRef<boolean>;
    modal: ComputedRef<boolean>;
    trigger: Ref<HTMLElement | null>;
    triggerId: Ref<string | undefined>;
    contentId: Ref<string | undefined>;
    reference: ComputedRef<ElementReference | null>;
    pendingFocus: Ref<OpenFocusTarget>;
    layer: OverlayLayerContext;
    interaction: DropdownMenuInteractionRuntime;
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions & { returnFocus?: boolean }) => void;
    toggle: () => void;
    openAt: (
        point: DropdownMenuPoint,
        options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
    ) => void;
    setTrigger: (element: HTMLElement | null, id?: string) => void;
    setReference: (reference: ElementReference | null) => void;
    setReturnFocus: (element: HTMLElement | null) => void;
    registerInside: (element: HTMLElement) => void;
    unregisterInside: (element: HTMLElement) => void;
}

export interface DropdownMenuRadioGroupContext {
    value: ComputedRef<DropdownMenuItemValue | null>;
    select: (value: DropdownMenuItemValue) => void;
}

export interface DropdownMenuCheckedContext {
    state: ComputedRef<'checked' | 'unchecked' | 'indeterminate'>;
    checked: ComputedRef<boolean>;
}

export const rootKey = Symbol('dropdown-menu-root') as InjectionKey<DropdownMenuRootContext>;
export const menuKey = Symbol('dropdown-menu-content') as InjectionKey<DropdownMenuContext>;
export const subKey = Symbol('dropdown-menu-sub') as InjectionKey<DropdownMenuSubContext>;
export const radioGroupKey = Symbol(
    'dropdown-menu-radio-group',
) as InjectionKey<DropdownMenuRadioGroupContext>;
export const checkedKey = Symbol(
    'dropdown-menu-checked',
) as InjectionKey<DropdownMenuCheckedContext>;

export function createVirtualAnchor(point: DropdownMenuPoint): DropdownMenuVirtualAnchor {
    return {
        getBoundingClientRect: () => createPointRect(point),
    };
}

export function createSelectEvent(
    originalEvent: Event,
    value?: DropdownMenuItemValue,
): DropdownMenuSelectEvent {
    return createCancelableCustomEvent(
        'dropdown-menu-select',
        { originalEvent, value },
        originalEvent,
    );
}

export function createMenuContext(options: {
    root: DropdownMenuRootContext;
    element: Ref<HTMLElement | null>;
    actualPlacement: Ref<DropdownMenuPlacement>;
    parentSub?: DropdownMenuSubContext;
    onEscape: (event: KeyboardEvent) => boolean;
}): DropdownMenuContext {
    const id = options.parentSub?.menuId ?? options.root.interaction.rootMenuId;
    const interaction = options.root.interaction;
    const activeId = interaction.getActiveId(id);
    const cleanupMenu = interaction.registerMenu({
        id,
        parentItemId: () => options.parentSub?.trigger.value?.id,
        element: () => options.element.value,
        placement: () => options.actualPlacement.value,
        isOpen: () => options.parentSub?.isOpen.value ?? options.root.isOpen.value,
        setOpen: options.parentSub?.setOpen,
        stopKeyPropagation: true,
        onEscape: options.onEscape,
    });

    function registerItem(item: MenuItemRegistration) {
        interaction.registerItem({
            get id() {
                return item.id;
            },
            menuId: id,
            element: item.element,
            textValue: item.textValue,
            disabled: item.disabled,
            submenuId: () => item.submenu?.menuId,
            submenuDirection: () =>
                item.submenu?.actualPlacement.value.startsWith('left') ? 'left' : 'right',
            select: item.activate,
            closeOnSelect: item.closeOnSelect,
        });
    }

    const context: DropdownMenuContext = {
        root: options.root,
        id,
        element: options.element,
        activeId,
        actualPlacement: options.actualPlacement,
        parentSub: options.parentSub,
        registerItem,
        unregisterItem: interaction.unregisterItem,
        closeSubmenus: (except) => interaction.closeSubmenus(id, except?.menuId),
        setActive: (itemId) => {
            interaction.setActive(itemId);
        },
        isActive: interaction.isActive,
        focus: (target = 'first') => interaction.focusMenu(id, target),
        focusElement: () => interaction.focusMenuElement(id),
        activate: interaction.activateItem,
        hover: interaction.hoverItem,
        onKeydown: (event) => interaction.onMenuKeydown(id, event),
    };

    onBeforeUnmount(cleanupMenu);
    return context;
}

export function usePrimitiveItem(
    componentName: string,
    props: Readonly<DropdownMenuItemPrimitiveProps>,
    emitSelect: (event: DropdownMenuSelectEvent) => void,
    options: {
        checked?: ComputedRef<boolean | 'mixed'>;
        defaultCloseOnSelect: boolean;
        afterSelect?: () => void;
    },
) {
    const menu = useRequiredInject(menuKey, componentName);
    const generatedId = useId();
    const id = computed(() => props.id ?? `${generatedId}-item`);
    const element = ref<HTMLElement | null>(null);
    const isDisabled = computed(() => Boolean(menu.root.disabled.value || props.disabled));
    const focused = computed(() => menu.isActive(id.value));

    function emitSelection(originalEvent: Event) {
        if (isDisabled.value) return undefined;
        const selectEvent = createSelectEvent(originalEvent, props.value);
        emitSelect(selectEvent);
        options.afterSelect?.();
        return selectEvent;
    }

    const registration: MenuItemRegistration = {
        get id() {
            return id.value;
        },
        element: () => element.value,
        textValue: () => props.textValue ?? element.value?.textContent?.trim() ?? '',
        disabled: () => isDisabled.value,
        activate: emitSelection,
        closeOnSelect: () => props.closeOnSelect ?? options.defaultCloseOnSelect,
    };

    menu.registerItem(registration);
    watch(
        id,
        (nextId, previousId) => {
            const wasActive = menu.activeId.value === previousId;
            menu.unregisterItem(previousId);
            menu.registerItem(registration);
            if (wasActive) menu.setActive(nextId);
        },
        { flush: 'sync' },
    );
    watch(isDisabled, () => menu.root.interaction.reconcile(menu.id));
    onBeforeUnmount(() => menu.unregisterItem(id.value));

    function setElement(value: ComponentElementRef) {
        resolveHTMLElementRef(value, id.value, (resolved) => {
            element.value = resolved;
            menu.root.interaction.reconcile(menu.id);
        });
    }

    function activate(originalEvent: Event) {
        menu.activate(id.value, originalEvent);
    }

    function onPointerenter() {
        if (isDisabled.value) return;
        menu.hover(id.value);
    }

    function select() {
        menu.activate(id.value, new Event('select'));
    }

    return {
        menu,
        id,
        element,
        isDisabled,
        focused,
        checked: options.checked,
        activate,
        select,
        setElement,
        onPointerenter,
    };
}
