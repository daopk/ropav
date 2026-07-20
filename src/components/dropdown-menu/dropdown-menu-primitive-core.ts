import {
    computed,
    nextTick,
    onBeforeUnmount,
    ref,
    shallowRef,
    useId,
    watch,
    type ComponentPublicInstance,
    type ComputedRef,
    type InjectionKey,
    type Ref,
    type VaporComponentInstance,
} from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import type { OverlayLayerContext } from '@/composables/useOverlayLayer';
import { useTypeahead } from '@/composables/useTypeahead';
import type { FloatingReference } from '../floating/types';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuItemPrimitiveProps,
    DropdownMenuItemValue,
    DropdownMenuOpenOptions,
    DropdownMenuPlacement,
    DropdownMenuPoint,
    DropdownMenuSelectEvent,
    DropdownMenuVirtualAnchor,
} from './types';

export type ElementReference = FloatingReference;
export type OpenFocusTarget = DropdownMenuFocusTarget | false;
export type ComponentRefValue = Element | ComponentPublicInstance | VaporComponentInstance | null;

export interface MenuItemRegistration {
    id: string;
    element: () => HTMLElement | null;
    textValue: () => string;
    disabled: () => boolean;
    activate: (event: Event) => void;
    submenu?: DropdownMenuSubContext;
}

export interface DropdownMenuContext {
    root: DropdownMenuRootContext;
    element: Ref<HTMLElement | null>;
    activeId: Ref<string | null>;
    actualPlacement: Ref<DropdownMenuPlacement>;
    parentSub?: DropdownMenuSubContext;
    registerItem: (item: MenuItemRegistration) => void;
    unregisterItem: (id: string) => void;
    registerSub: (sub: DropdownMenuSubContext) => void;
    unregisterSub: (sub: DropdownMenuSubContext) => void;
    closeSubmenus: (except?: DropdownMenuSubContext) => void;
    setActive: (id: string) => void;
    isActive: (id: string) => boolean;
    focus: (target?: DropdownMenuFocusTarget) => boolean;
    focusElement: () => void;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface DropdownMenuSubContext {
    isOpen: ComputedRef<boolean>;
    trigger: Ref<HTMLElement | null>;
    contentId: Ref<string | undefined>;
    actualPlacement: Ref<DropdownMenuPlacement>;
    pendingFocus: Ref<OpenFocusTarget>;
    menu: DropdownMenuContext | null;
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
    isInside: (event: Event) => boolean;
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

export function optionalAttr<T extends boolean | string | undefined>(value: T): T | undefined {
    return value || undefined;
}

export function getFocusTarget(
    options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
): DropdownMenuFocusTarget {
    if (typeof options === 'string') return options;
    return options?.focus ?? 'first';
}

export function toHTMLElement(value: ComponentRefValue, fallbackId?: string): HTMLElement | null {
    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return value;
    if (typeof HTMLElement === 'undefined') return null;

    const vdomElement = (value as ComponentPublicInstance | null)?.$el;
    if (vdomElement instanceof HTMLElement) return vdomElement;

    const vaporBlock = (value as VaporComponentInstance | null)?.block;
    if (vaporBlock instanceof HTMLElement) return vaporBlock;

    return fallbackId && typeof document !== 'undefined'
        ? document.getElementById(fallbackId)
        : null;
}

export function resolveHTMLElementRef(
    value: ComponentRefValue,
    fallbackId: string,
    resolve: (element: HTMLElement | null) => void,
) {
    const element = toHTMLElement(value, fallbackId);
    resolve(element);
    if (element || !value) return;
    void nextTick(() => resolve(toHTMLElement(value, fallbackId)));
}

function createPointRect(point: DropdownMenuPoint): DOMRect {
    return {
        x: point.x,
        y: point.y,
        left: point.x,
        right: point.x,
        top: point.y,
        bottom: point.y,
        width: 0,
        height: 0,
        toJSON: () => ({}),
    } as DOMRect;
}

export function createVirtualAnchor(point: DropdownMenuPoint): DropdownMenuVirtualAnchor {
    return {
        getBoundingClientRect: () => createPointRect(point),
    };
}

export function createCustomEvent<T>(
    type: string,
    detail: T,
    originalEvent: Event,
): CustomEvent<T> {
    const target = originalEvent.target;
    const view = target instanceof Node ? target.ownerDocument?.defaultView : null;
    const EventConstructor = view?.CustomEvent ?? CustomEvent;
    return new EventConstructor(type, { bubbles: false, cancelable: true, detail });
}

export function createSelectEvent(
    originalEvent: Event,
    value?: DropdownMenuItemValue,
): DropdownMenuSelectEvent {
    return createCustomEvent('dropdown-menu-select', { originalEvent, value }, originalEvent);
}

export function createOutsideEvent(originalEvent: Event): DropdownMenuInteractOutsideEvent {
    return createCustomEvent('dropdown-menu-interact-outside', { originalEvent }, originalEvent);
}

function sortItems(items: MenuItemRegistration[]) {
    // oxlint-disable-next-line unicorn/no-array-sort -- ES2022 target lacks toSorted; this sorts a copy.
    return [...items].sort((left, right) => {
        const leftElement = left.element();
        const rightElement = right.element();
        if (!leftElement || !rightElement || leftElement === rightElement) return 0;

        const position = leftElement.compareDocumentPosition(rightElement);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
    });
}

function getPlacementSide(placement: DropdownMenuPlacement) {
    return placement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left';
}

function getOpenDirection(sub: DropdownMenuSubContext) {
    return getPlacementSide(sub.actualPlacement.value) === 'left' ? 'ArrowLeft' : 'ArrowRight';
}

function getCloseDirection(menu: DropdownMenuContext) {
    return getPlacementSide(menu.actualPlacement.value) === 'left' ? 'ArrowRight' : 'ArrowLeft';
}

function blockDocumentClick(event: Event) {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    document.removeEventListener('click', blockDocumentClick, true);
}

export function blockNextDocumentClick() {
    if (typeof document === 'undefined') return;
    document.addEventListener('click', blockDocumentClick, true);
    window.setTimeout(() => document.removeEventListener('click', blockDocumentClick, true), 1000);
}

export function createMenuContext(options: {
    root: DropdownMenuRootContext;
    element: Ref<HTMLElement | null>;
    actualPlacement: Ref<DropdownMenuPlacement>;
    parentSub?: DropdownMenuSubContext;
    onEscape: (event: KeyboardEvent) => void;
}): DropdownMenuContext {
    const items = shallowRef<MenuItemRegistration[]>([]);
    const activeId = ref<string | null>(null);
    const submenus = new Set<DropdownMenuSubContext>();

    function getEnabledItems() {
        return sortItems(items.value).filter((item) => !item.disabled());
    }

    function registerItem(item: MenuItemRegistration) {
        items.value = [...items.value.filter((current) => current.id !== item.id), item];
        const open = options.parentSub?.isOpen.value ?? options.root.isOpen.value;
        if (open && activeId.value == null && !item.disabled()) {
            activeId.value = item.id;
            void nextTick(() => {
                options.element.value?.focus();
                item.element()?.scrollIntoView?.({ block: 'nearest' });
            });
        }
    }

    function unregisterItem(id: string) {
        items.value = items.value.filter((item) => item.id !== id);
        if (activeId.value === id) activeId.value = null;
    }

    function registerSub(sub: DropdownMenuSubContext) {
        submenus.add(sub);
    }

    function unregisterSub(sub: DropdownMenuSubContext) {
        submenus.delete(sub);
    }

    function closeSubmenus(except?: DropdownMenuSubContext) {
        for (const submenu of submenus) {
            if (submenu !== except) submenu.close(false);
        }
    }

    function setActive(id: string) {
        const item = items.value.find((current) => current.id === id);
        if (!item || item.disabled()) return;
        activeId.value = id;
        void nextTick(() => item.element()?.scrollIntoView?.({ block: 'nearest' }));
    }

    function focus(target: DropdownMenuFocusTarget = 'first') {
        const enabledItems = getEnabledItems();
        const item = target === 'last' ? enabledItems[enabledItems.length - 1] : enabledItems[0];
        if (!item) {
            activeId.value = null;
            options.element.value?.focus();
            return false;
        }

        activeId.value = item.id;
        options.element.value?.focus();
        item.element()?.scrollIntoView?.({ block: 'nearest' });
        return true;
    }

    function focusElement() {
        options.element.value?.focus();
    }

    function move(direction: 1 | -1) {
        const enabledItems = getEnabledItems();
        if (enabledItems.length === 0) return;
        const currentIndex = enabledItems.findIndex((item) => item.id === activeId.value);
        const start = currentIndex < 0 ? (direction === 1 ? -1 : 0) : currentIndex;
        const nextIndex = (start + direction + enabledItems.length) % enabledItems.length;
        const item = enabledItems[nextIndex];
        if (item) setActive(item.id);
    }

    const typeahead = useTypeahead<MenuItemRegistration>({
        items: () => sortItems(items.value),
        activeIndex: () => sortItems(items.value).findIndex((item) => item.id === activeId.value),
        getKey: (item) => item.id,
        getTextValue: (item) => item.textValue(),
        isDisabled: (item) => item.disabled(),
        onMatch: (item) => setActive(item.id),
    });
    const isOpen = computed(() => options.parentSub?.isOpen.value ?? options.root.isOpen.value);
    watch(
        isOpen,
        (open) => {
            if (!open) typeahead.reset();
        },
        { flush: 'sync' },
    );

    function onHorizontalKeydown(event: KeyboardEvent, active?: MenuItemRegistration) {
        if (options.parentSub && event.key === getCloseDirection(context)) {
            event.preventDefault();
            event.stopPropagation();
            options.parentSub.close(true);
            return;
        }

        if (!active?.submenu || event.key !== getOpenDirection(active.submenu)) return;
        event.preventDefault();
        event.stopPropagation();
        active.submenu.open('first');
    }

    function onKeydown(event: KeyboardEvent) {
        if (typeahead.handleKey(event)) {
            event.stopPropagation();
            return;
        }
        const active = items.value.find((item) => item.id === activeId.value);

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                event.stopPropagation();
                move(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                event.stopPropagation();
                move(-1);
                break;
            case 'Home':
                event.preventDefault();
                event.stopPropagation();
                focus('first');
                break;
            case 'End':
                event.preventDefault();
                event.stopPropagation();
                focus('last');
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
                onHorizontalKeydown(event, active);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                event.stopPropagation();
                active?.activate(event);
                break;
            case 'Escape':
                event.preventDefault();
                event.stopPropagation();
                options.onEscape(event);
                break;
            case 'Tab':
                options.root.close({ returnFocus: false });
                break;
        }
    }

    const context: DropdownMenuContext = {
        root: options.root,
        element: options.element,
        activeId,
        actualPlacement: options.actualPlacement,
        parentSub: options.parentSub,
        registerItem,
        unregisterItem,
        registerSub,
        unregisterSub,
        closeSubmenus,
        setActive,
        isActive: (id) => activeId.value === id,
        focus,
        focusElement,
        onKeydown,
    };

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

    function activate(originalEvent: Event) {
        if (isDisabled.value) return;
        const selectEvent = createSelectEvent(originalEvent, props.value);
        emitSelect(selectEvent);
        options.afterSelect?.();
        if (
            !selectEvent.defaultPrevented &&
            (props.closeOnSelect ?? options.defaultCloseOnSelect)
        ) {
            menu.root.close({ returnFocus: true });
        }
    }

    const registration: MenuItemRegistration = {
        get id() {
            return id.value;
        },
        element: () => element.value,
        textValue: () => props.textValue ?? element.value?.textContent?.trim() ?? '',
        disabled: () => isDisabled.value,
        activate,
    };

    menu.registerItem(registration);
    watch(id, (nextId, previousId) => {
        menu.unregisterItem(previousId);
        menu.registerItem(registration);
        if (menu.activeId.value === previousId) menu.activeId.value = nextId;
    });
    onBeforeUnmount(() => menu.unregisterItem(id.value));

    function setElement(value: ComponentRefValue) {
        resolveHTMLElementRef(value, id.value, (resolved) => {
            element.value = resolved;
        });
    }

    function onPointerenter() {
        if (isDisabled.value) return;
        menu.closeSubmenus();
        menu.setActive(id.value);
    }

    function select() {
        activate(new Event('select'));
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
