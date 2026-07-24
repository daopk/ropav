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
    DropdownMenuInteraction,
    DropdownMenuInteractionFocusTarget,
    DropdownMenuInteractionItem,
    DropdownMenuInteractionMenu,
    DropdownMenuInteractionSubmenu,
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
    actualPlacement: Ref<DropdownMenuPlacement>;
    parentSub?: DropdownMenuSubContext;
    interaction: DropdownMenuInteractionMenu;
    connectItem: (item: MenuItemRegistration) => DropdownMenuInteractionItem;
}

export interface DropdownMenuSubContext {
    menuId: string;
    isOpen: ComputedRef<boolean>;
    trigger: Ref<HTMLElement | null>;
    contentId: Ref<string | undefined>;
    actualPlacement: Ref<DropdownMenuPlacement>;
    menu: DropdownMenuContext | null;
    interaction: DropdownMenuInteractionSubmenu;
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
    interactionRootMenuId: string;
    layer: OverlayLayerContext;
    interaction: DropdownMenuInteraction;
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
    connectInside: (element: HTMLElement) => () => void;
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
    const id = options.parentSub?.menuId ?? options.root.interactionRootMenuId;
    const interaction = options.parentSub
        ? options.parentSub.interaction.connectContent({
              element: () => options.element.value,
              placement: () => options.actualPlacement.value,
              stopKeyPropagation: true,
              onEscape: options.onEscape,
          })
        : options.root.interaction.connectRootMenu({
              element: () => options.element.value,
              placement: () => options.actualPlacement.value,
              stopKeyPropagation: true,
              onEscape: options.onEscape,
          });

    function connectItem(item: MenuItemRegistration) {
        return interaction.connectItem({
            id: item.id,
            element: item.element,
            textValue: item.textValue,
            disabled: item.disabled,
            submenu: item.submenu?.interaction,
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
        actualPlacement: options.actualPlacement,
        parentSub: options.parentSub,
        interaction,
        connectItem,
    };

    onBeforeUnmount(interaction.dispose);
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

    let itemInteraction = menu.connectItem(registration);
    const focused = computed(() => {
        const currentId = id.value;
        return currentId === registration.id && itemInteraction.active.value;
    });
    watch(
        id,
        () => {
            const previous = itemInteraction;
            const wasActive = previous.active.value;
            itemInteraction = menu.connectItem(registration);
            previous.dispose();
            if (wasActive) itemInteraction.setActive();
        },
        { flush: 'sync' },
    );
    onBeforeUnmount(() => itemInteraction.dispose());

    function setElement(value: ComponentElementRef) {
        resolveHTMLElementRef(value, id.value, (resolved) => {
            element.value = resolved;
        });
    }

    function activate(originalEvent: Event) {
        itemInteraction.activate(originalEvent);
    }

    function onPointerenter() {
        if (isDisabled.value) return;
        itemInteraction.hover();
    }

    function select() {
        itemInteraction.activate(new Event('select'));
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
