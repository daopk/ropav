import {
    autoUpdate,
    computePosition,
    flip,
    offset as floatingOffset,
    shift,
    type Placement,
    type VirtualElement,
} from '@floating-ui/dom';
import {
    computed,
    defineComponent,
    h,
    mergeProps,
    nextTick,
    onBeforeUnmount,
    onMounted,
    provide,
    ref,
    shallowRef,
    Teleport,
    useId,
    watch,
    type ComponentPublicInstance,
    type ComputedRef,
    type CSSProperties,
    type InjectionKey,
    type PropType,
    type Ref,
} from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import type {
    DropdownMenuAs,
    DropdownMenuCheckedState,
    DropdownMenuCloseOptions,
    DropdownMenuContentPrimitiveProps,
    DropdownMenuFocusTarget,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuItemPrimitiveProps,
    DropdownMenuItemValue,
    DropdownMenuOffset,
    DropdownMenuOpenOptions,
    DropdownMenuPlacement,
    DropdownMenuPoint,
    DropdownMenuRootSlotProps,
    DropdownMenuSelectEvent,
    DropdownMenuVirtualAnchor,
} from './types';

type ElementReference = Element | VirtualElement;
type OpenFocusTarget = DropdownMenuFocusTarget | false;

interface MenuItemRegistration {
    id: string;
    element: () => HTMLElement | null;
    disabled: () => boolean;
    activate: (event: Event) => void;
    submenu?: DropdownMenuSubContext;
}

interface DropdownMenuContext {
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

interface DropdownMenuSubContext {
    isOpen: ComputedRef<boolean>;
    trigger: Ref<HTMLElement | null>;
    contentId: Ref<string | undefined>;
    actualPlacement: Ref<DropdownMenuPlacement>;
    pendingFocus: Ref<OpenFocusTarget>;
    menu: DropdownMenuContext | null;
    open: (focus?: OpenFocusTarget) => void;
    close: (focusParent?: boolean) => void;
}

interface DropdownMenuRootContext {
    id: ComputedRef<string>;
    isOpen: ComputedRef<boolean>;
    disabled: ComputedRef<boolean>;
    modal: ComputedRef<boolean>;
    trigger: Ref<HTMLElement | null>;
    triggerId: Ref<string | undefined>;
    contentId: Ref<string | undefined>;
    reference: ComputedRef<ElementReference | null>;
    pendingFocus: Ref<OpenFocusTarget>;
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
    isInside: (target: EventTarget | null) => boolean;
}

interface DropdownMenuRadioGroupContext {
    value: ComputedRef<DropdownMenuItemValue | null>;
    select: (value: DropdownMenuItemValue) => void;
}

interface DropdownMenuCheckedContext {
    state: ComputedRef<'checked' | 'unchecked' | 'indeterminate'>;
    checked: ComputedRef<boolean>;
}

const rootKey = Symbol('dropdown-menu-root') as InjectionKey<DropdownMenuRootContext>;
const menuKey = Symbol('dropdown-menu-content') as InjectionKey<DropdownMenuContext>;
const subKey = Symbol('dropdown-menu-sub') as InjectionKey<DropdownMenuSubContext>;
const radioGroupKey = Symbol(
    'dropdown-menu-radio-group',
) as InjectionKey<DropdownMenuRadioGroupContext>;
const checkedKey = Symbol('dropdown-menu-checked') as InjectionKey<DropdownMenuCheckedContext>;

const openLayers: DropdownMenuRootContext[] = [];

function optionalAttr<T extends boolean | string | undefined>(value: T): T | undefined {
    return value || undefined;
}

function getFocusTarget(
    options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
): DropdownMenuFocusTarget {
    if (typeof options === 'string') return options;
    return options?.focus ?? 'first';
}

function toHTMLElement(value: Element | ComponentPublicInstance | null): HTMLElement | null {
    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return value;
    const element = (value as ComponentPublicInstance | null)?.$el;
    return typeof HTMLElement !== 'undefined' && element instanceof HTMLElement ? element : null;
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

function createVirtualAnchor(point: DropdownMenuPoint): DropdownMenuVirtualAnchor {
    return {
        getBoundingClientRect: () => createPointRect(point),
    };
}

function createCustomEvent<T>(type: string, detail: T, originalEvent: Event): CustomEvent<T> {
    const target = originalEvent.target;
    const view = target instanceof Node ? target.ownerDocument?.defaultView : null;
    const EventConstructor = view?.CustomEvent ?? CustomEvent;
    return new EventConstructor(type, { bubbles: false, cancelable: true, detail });
}

function createSelectEvent(
    originalEvent: Event,
    value?: DropdownMenuItemValue,
): DropdownMenuSelectEvent {
    return createCustomEvent('dropdown-menu-select', { originalEvent, value }, originalEvent);
}

function createOutsideEvent(originalEvent: Event): DropdownMenuInteractOutsideEvent {
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

function addOpenLayer(root: DropdownMenuRootContext) {
    const index = openLayers.indexOf(root);
    if (index >= 0) openLayers.splice(index, 1);
    openLayers.push(root);
}

function removeOpenLayer(root: DropdownMenuRootContext) {
    const index = openLayers.indexOf(root);
    if (index >= 0) openLayers.splice(index, 1);
}

function isTopLayer(root: DropdownMenuRootContext) {
    return openLayers[openLayers.length - 1] === root;
}

function blockDocumentClick(event: Event) {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    document.removeEventListener('click', blockDocumentClick, true);
}

function blockNextDocumentClick() {
    if (typeof document === 'undefined') return;
    document.addEventListener('click', blockDocumentClick, true);
    window.setTimeout(() => document.removeEventListener('click', blockDocumentClick, true), 1000);
}

function createMenuContext(options: {
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

function useFloatingPosition(
    props: Readonly<DropdownMenuContentPrimitiveProps>,
    isOpen: Readonly<Ref<boolean>>,
    reference: Readonly<Ref<ElementReference | null>>,
    floating: Ref<HTMLElement | null>,
    actualPlacement: Ref<DropdownMenuPlacement>,
) {
    const style = ref<CSSProperties>({ position: 'fixed', visibility: 'hidden' });
    let cleanup: (() => void) | undefined;
    let generation = 0;

    function stop() {
        cleanup?.();
        cleanup = undefined;
        generation += 1;
    }

    async function update() {
        const currentReference = reference.value;
        const currentFloating = floating.value;
        if (!currentReference || !currentFloating || !isOpen.value) return;

        const currentGeneration = generation;
        const middleware = [floatingOffset(props.offset ?? 8)];
        if (props.avoidCollisions !== false) {
            middleware.push(
                flip({ padding: props.collisionPadding ?? 8 }),
                shift({ padding: props.collisionPadding ?? 8 }),
            );
        }

        const result = await computePosition(currentReference, currentFloating, {
            placement: (props.placement ?? 'bottom-start') as Placement,
            strategy: 'fixed',
            middleware,
        });

        if (currentGeneration !== generation) return;
        actualPlacement.value = result.placement as DropdownMenuPlacement;
        style.value = {
            position: result.strategy,
            top: `${result.y}px`,
            left: `${result.x}px`,
        };
    }

    function start() {
        stop();
        if (!isOpen.value) return;

        void nextTick(() => {
            const currentReference = reference.value;
            const currentFloating = floating.value;
            if (!currentReference || !currentFloating || !isOpen.value) return;

            void update();
            cleanup = autoUpdate(currentReference, currentFloating, () => void update());
        });
    }

    watch(
        [
            isOpen,
            reference,
            floating,
            () => props.placement,
            () => props.offset,
            () => props.collisionPadding,
            () => props.avoidCollisions,
        ],
        start,
        { flush: 'post', immediate: true },
    );
    onBeforeUnmount(stop);

    return style;
}

function primitiveAsProp(defaultValue: string) {
    return {
        type: [String, Object, Function] as PropType<DropdownMenuAs>,
        default: defaultValue,
    };
}

export const DropdownMenuRoot = defineComponent({
    name: 'RpDropdownMenuRoot',
    props: {
        id: String,
        open: { type: Boolean, default: undefined },
        defaultOpen: { type: Boolean, default: false },
        disabled: { type: Boolean, default: false },
        modal: { type: Boolean, default: true },
        virtualAnchor: {
            type: Object as PropType<DropdownMenuVirtualAnchor | null>,
            default: null,
        },
    },
    emits: ['update:open'],
    setup(props, { emit, expose, slots }) {
        const generatedId = useId();
        const id = computed(() => props.id ?? `${generatedId}-dropdown-menu`);
        const uncontrolledOpen = ref(props.defaultOpen);
        const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
        const disabled = computed(() => props.disabled);
        const modal = computed(() => props.modal);
        const trigger = ref<HTMLElement | null>(null);
        const triggerId = ref<string>();
        const contentId = ref<string>();
        const activeReference = shallowRef<ElementReference | null>(null);
        const reference = computed<ElementReference | null>(
            () => activeReference.value ?? props.virtualAnchor ?? trigger.value,
        );
        const pendingFocus = ref<OpenFocusTarget>('first');
        const inside = new Set<HTMLElement>();
        let returnFocusElement: HTMLElement | null = null;

        function setOpen(value: boolean) {
            if (value && disabled.value) return;
            const previous = isOpen.value;
            if (props.open === undefined) uncontrolledOpen.value = value;
            if (previous !== value) emit('update:open', value);
        }

        function rememberFocus() {
            if (typeof document === 'undefined' || returnFocusElement) return;
            const activeElement = document.activeElement;
            if (activeElement instanceof HTMLElement) returnFocusElement = activeElement;
        }

        function open(options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) {
            if (disabled.value) return;
            rememberFocus();
            pendingFocus.value = getFocusTarget(options);
            setOpen(true);
        }

        function focusReturnTarget() {
            const target = returnFocusElement ?? trigger.value;
            void nextTick(() => target?.focus());
        }

        function close(options: DropdownMenuCloseOptions & { returnFocus?: boolean } = {}) {
            setOpen(false);
            pendingFocus.value = false;
            if (options.focusTrigger || options.returnFocus) focusReturnTarget();
        }

        function toggle() {
            if (isOpen.value) close({ returnFocus: true });
            else open();
        }

        function openAt(
            point: DropdownMenuPoint,
            options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
        ) {
            activeReference.value = createVirtualAnchor(point);
            open(options);
        }

        function setTrigger(element: HTMLElement | null, nextId?: string) {
            if (trigger.value && trigger.value !== element) inside.delete(trigger.value);
            trigger.value = element;
            triggerId.value = nextId;
            if (element) inside.add(element);
        }

        const context: DropdownMenuRootContext = {
            id,
            isOpen,
            disabled,
            modal,
            trigger,
            triggerId,
            contentId,
            reference,
            pendingFocus,
            open,
            close,
            toggle,
            openAt,
            setTrigger,
            setReference(nextReference) {
                activeReference.value = nextReference;
            },
            setReturnFocus(element) {
                returnFocusElement = element;
            },
            registerInside(element) {
                inside.add(element);
            },
            unregisterInside(element) {
                inside.delete(element);
            },
            isInside(target) {
                return (
                    target instanceof Node &&
                    [...inside].some((element) => element.contains(target))
                );
            },
        };

        const slotProps = computed<DropdownMenuRootSlotProps>(() => ({
            isOpen: isOpen.value,
            open,
            close,
            toggle,
            openAt,
        }));

        watch(disabled, (value) => {
            if (value) close();
        });
        watch(
            isOpen,
            (value) => {
                if (value) addOpenLayer(context);
                else removeOpenLayer(context);
            },
            { immediate: true },
        );
        onBeforeUnmount(() => removeOpenLayer(context));

        provide(rootKey, context);
        expose({ open, close, toggle, openAt });

        return () => slots.default?.(slotProps.value);
    },
});

export const DropdownMenuTrigger = defineComponent({
    name: 'RpDropdownMenuTrigger',
    inheritAttrs: false,
    props: {
        id: String,
        as: primitiveAsProp('button'),
        disabled: { type: Boolean, default: false },
    },
    setup(props, { attrs, slots }) {
        const root = useRequiredInject(rootKey, 'RpDropdownMenuTrigger');
        const generatedId = useId();
        const id = computed(() => props.id ?? `${generatedId}-trigger`);
        const element = ref<HTMLElement | null>(null);
        const isDisabled = computed(() => root.disabled.value || props.disabled);

        function setElement(value: Element | ComponentPublicInstance | null) {
            element.value = toHTMLElement(value);
            root.setTrigger(element.value, id.value);
        }

        function openWithReference(focus: DropdownMenuFocusTarget = 'first') {
            root.setReference(element.value);
            root.setReturnFocus(element.value);
            root.open({ focus });
        }

        function onClick(event: MouseEvent) {
            if (event.defaultPrevented || isDisabled.value) return;
            root.setReference(element.value);
            root.setReturnFocus(element.value);
            root.toggle();
        }

        function onKeydown(event: KeyboardEvent) {
            if (isDisabled.value) return;
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                openWithReference('last');
            } else if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
                openWithReference('first');
            } else if (event.key === 'Escape') {
                root.close({ focusTrigger: true });
            }
        }

        onBeforeUnmount(() => root.setTrigger(null));

        return () => {
            const as = props.as ?? 'button';
            return h(
                as,
                mergeProps(attrs, {
                    id: id.value,
                    ref: setElement,
                    type: as === 'button' ? 'button' : undefined,
                    disabled: as === 'button' ? optionalAttr(isDisabled.value) : undefined,
                    'aria-controls': root.contentId.value,
                    'aria-expanded': root.isOpen.value,
                    'aria-haspopup': 'menu',
                    'aria-disabled': as === 'button' ? undefined : optionalAttr(isDisabled.value),
                    'data-state': root.isOpen.value ? 'open' : 'closed',
                    'data-disabled': optionalAttr(isDisabled.value),
                    onClick,
                    onKeydown,
                }),
                slots.default?.({ isOpen: root.isOpen.value }),
            );
        };
    },
});

export const DropdownMenuContextTrigger = defineComponent({
    name: 'RpDropdownMenuContextTrigger',
    inheritAttrs: false,
    props: {
        id: String,
        as: primitiveAsProp('span'),
        disabled: { type: Boolean, default: false },
        longPressDelay: { type: Number, default: 700 },
        longPressTolerance: { type: Number, default: 10 },
    },
    setup(props, { attrs, slots }) {
        const root = useRequiredInject(rootKey, 'RpDropdownMenuContextTrigger');
        const generatedId = useId();
        const id = computed(() => props.id ?? `${generatedId}-context-trigger`);
        const element = ref<HTMLElement | null>(null);
        const isDisabled = computed(() => root.disabled.value || props.disabled);
        let timer: ReturnType<typeof setTimeout> | undefined;
        let pointerId: number | undefined;
        let startPoint: DropdownMenuPoint | undefined;
        let longPressOpened = false;
        let suppressUntil = 0;

        function setElement(value: Element | ComponentPublicInstance | null) {
            const previous = element.value;
            if (previous) root.unregisterInside(previous);
            element.value = toHTMLElement(value);
            if (element.value) root.registerInside(element.value);
            if (!root.triggerId.value) root.triggerId.value = id.value;
        }

        function clearLongPress() {
            if (timer) clearTimeout(timer);
            timer = undefined;
            pointerId = undefined;
            startPoint = undefined;
            element.value?.ownerDocument.defaultView?.removeEventListener(
                'scroll',
                clearLongPress,
                true,
            );
        }

        function openAt(point: DropdownMenuPoint) {
            root.setReturnFocus(element.value);
            root.openAt(point);
        }

        function onContextmenu(event: MouseEvent) {
            if (isDisabled.value) return;
            event.preventDefault();
            if (Date.now() < suppressUntil) return;
            openAt({ x: event.clientX, y: event.clientY });
        }

        function onKeydown(event: KeyboardEvent) {
            if (isDisabled.value) return;
            if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
            event.preventDefault();
            const rect = element.value?.getBoundingClientRect();
            openAt({ x: rect?.left ?? 0, y: rect?.bottom ?? 0 });
        }

        function onPointerdown(event: PointerEvent) {
            if (
                isDisabled.value ||
                (event.pointerType !== 'touch' && event.pointerType !== 'pen')
            ) {
                return;
            }

            clearLongPress();
            pointerId = event.pointerId;
            startPoint = { x: event.clientX, y: event.clientY };
            longPressOpened = false;
            const view = element.value?.ownerDocument.defaultView;
            view?.addEventListener('scroll', clearLongPress, true);
            timer = setTimeout(() => {
                if (!startPoint) return;
                longPressOpened = true;
                suppressUntil = Date.now() + 1000;
                openAt(startPoint);
                timer = undefined;
            }, props.longPressDelay);
        }

        function onPointermove(event: PointerEvent) {
            if (event.pointerId !== pointerId || !startPoint) return;
            const distance = Math.hypot(event.clientX - startPoint.x, event.clientY - startPoint.y);
            if (distance > props.longPressTolerance) clearLongPress();
        }

        function finishPointer(event: PointerEvent) {
            if (event.pointerId !== pointerId) return;
            if (longPressOpened) event.preventDefault();
            clearLongPress();
        }

        function onClick(event: MouseEvent) {
            if (Date.now() >= suppressUntil) return;
            event.preventDefault();
            event.stopPropagation();
        }

        onBeforeUnmount(() => {
            clearLongPress();
            if (element.value) root.unregisterInside(element.value);
            if (root.triggerId.value === id.value) root.triggerId.value = undefined;
        });

        return () =>
            h(
                props.as ?? 'span',
                mergeProps(attrs, {
                    id: id.value,
                    ref: setElement,
                    'aria-controls': root.contentId.value,
                    'aria-expanded': root.isOpen.value,
                    'aria-haspopup': 'menu',
                    'aria-disabled': optionalAttr(isDisabled.value),
                    'data-state': root.isOpen.value ? 'open' : 'closed',
                    'data-disabled': optionalAttr(isDisabled.value),
                    onClick,
                    onContextmenu,
                    onKeydown,
                    onPointerdown,
                    onPointermove,
                    onPointerup: finishPointer,
                    onPointercancel: finishPointer,
                }),
                slots.default?.({ isOpen: root.isOpen.value }),
            );
    },
});

export const DropdownMenuPortal = defineComponent({
    name: 'RpDropdownMenuPortal',
    props: {
        to: { type: [String, Object] as PropType<string | HTMLElement>, default: 'body' },
        disabled: { type: Boolean, default: false },
    },
    setup(props, { slots }) {
        return () =>
            h(Teleport as any, { to: props.to, disabled: props.disabled }, slots.default?.());
    },
});

function createContentComponent(submenu: boolean) {
    return defineComponent({
        name: submenu ? 'RpDropdownMenuSubContent' : 'RpDropdownMenuContent',
        inheritAttrs: false,
        props: {
            id: String,
            as: primitiveAsProp('div'),
            placement: {
                type: String as PropType<DropdownMenuPlacement>,
                default: submenu ? 'right-start' : 'bottom-start',
            },
            offset: {
                type: [Number, Object] as PropType<DropdownMenuOffset>,
                default: undefined,
            },
            collisionPadding: { type: Number, default: 8 },
            avoidCollisions: { type: Boolean, default: true },
            forceMount: { type: Boolean, default: false },
            ariaLabel: String,
            ariaLabelledby: String,
            ariaDescribedby: String,
        },
        emits: ['escapeKeyDown', 'pointerDownOutside', 'focusOutside', 'interactOutside'],
        setup(props, { attrs, emit, slots }) {
            const root = useRequiredInject(
                rootKey,
                submenu ? 'RpDropdownMenuSubContent' : 'RpDropdownMenuContent',
            );
            const sub = submenu ? useRequiredInject(subKey, 'RpDropdownMenuSubContent') : undefined;
            const generatedId = useId();
            const id = computed(() => props.id ?? `${generatedId}-${submenu ? 'submenu' : 'menu'}`);
            const element = ref<HTMLElement | null>(null);
            const actualPlacement = ref<DropdownMenuPlacement>(props.placement);
            const isOpen = computed(() => (sub ? sub.isOpen.value : root.isOpen.value));
            const reference = computed<ElementReference | null>(() =>
                sub ? sub.trigger.value : root.reference.value,
            );
            const menu = createMenuContext({
                root,
                element,
                actualPlacement,
                parentSub: sub,
                onEscape(event) {
                    const customEvent = createCustomEvent(
                        'dropdown-menu-escape-key-down',
                        { originalEvent: event },
                        event,
                    );
                    emit('escapeKeyDown', customEvent);
                    if (customEvent.defaultPrevented) return;
                    if (sub) sub.close(true);
                    else root.close({ returnFocus: true });
                },
            });
            const style = useFloatingPosition(props, isOpen, reference, element, actualPlacement);
            const shouldRender = computed(() => props.forceMount || isOpen.value);

            provide(menuKey, menu);
            if (sub) sub.menu = menu;

            function setElement(value: Element | ComponentPublicInstance | null) {
                const previous = element.value;
                if (previous) root.unregisterInside(previous);
                element.value = toHTMLElement(value);
                if (element.value) root.registerInside(element.value);
            }

            function emitOutside(type: 'pointer' | 'focus', originalEvent: Event) {
                const outsideEvent = createOutsideEvent(originalEvent);
                if (type === 'pointer') emit('pointerDownOutside', outsideEvent);
                else emit('focusOutside', outsideEvent);
                emit('interactOutside', outsideEvent);
                return outsideEvent;
            }

            function onDocumentPointer(event: Event) {
                if (!isTopLayer(root) || root.isInside(event.target)) return;
                const outsideEvent = emitOutside('pointer', event);
                if (root.modal.value) {
                    if (event.cancelable) event.preventDefault();
                    event.stopPropagation();
                    if (event.type === 'pointerdown') blockNextDocumentClick();
                }
                if (!outsideEvent.defaultPrevented) {
                    root.close({ returnFocus: root.modal.value });
                }
            }

            function onDocumentFocus(event: Event) {
                if (!isTopLayer(root) || root.isInside(event.target)) return;
                const outsideEvent = emitOutside('focus', event);
                if (root.modal.value) {
                    if (event.cancelable) event.preventDefault();
                    event.stopPropagation();
                }
                if (!outsideEvent.defaultPrevented) {
                    root.close({ returnFocus: root.modal.value });
                } else if (root.modal.value) {
                    void nextTick(menu.focusElement);
                }
            }

            function setDocumentListeners(active: boolean) {
                if (submenu || typeof document === 'undefined') return;
                const method = active ? 'addEventListener' : 'removeEventListener';
                document[method]('pointerdown', onDocumentPointer, true);
                document[method]('click', onDocumentPointer, true);
                document[method]('focusin', onDocumentFocus, true);
            }

            watch(
                isOpen,
                (open) => {
                    setDocumentListeners(open);
                    if (!open) {
                        menu.activeId.value = null;
                        menu.closeSubmenus();
                        return;
                    }

                    void nextTick(() => {
                        const focus = sub ? sub.pendingFocus.value : root.pendingFocus.value;
                        menu.focus(focus || 'first');
                    });
                },
                { flush: 'post', immediate: true },
            );

            onMounted(() => {
                if (sub) sub.contentId.value = id.value;
                else root.contentId.value = id.value;
                if (isOpen.value)
                    menu.focus((sub ? sub.pendingFocus.value : root.pendingFocus.value) || 'first');
            });
            onBeforeUnmount(() => {
                setDocumentListeners(false);
                if (element.value) root.unregisterInside(element.value);
                if (sub) sub.menu = null;
                else if (root.contentId.value === id.value) root.contentId.value = undefined;
            });

            return () => {
                if (!shouldRender.value) return null;
                const placement = actualPlacement.value.split('-');
                const className = submenu
                    ? bem('rp-dropdown-menu__submenu', { compound: true, open: isOpen.value })
                    : bem('rp-dropdown-menu__content', { compound: true, open: isOpen.value });
                return h(
                    props.as ?? 'div',
                    mergeProps(attrs, {
                        id: id.value,
                        ref: setElement,
                        role: 'menu',
                        tabindex: -1,
                        hidden: optionalAttr(!isOpen.value),
                        class: className,
                        style: [style.value, !isOpen.value ? { display: 'none' } : undefined],
                        'aria-label': props.ariaLabel,
                        'aria-labelledby':
                            props.ariaLabelledby ?? (submenu ? undefined : root.triggerId.value),
                        'aria-describedby': props.ariaDescribedby,
                        'aria-activedescendant': menu.activeId.value ?? undefined,
                        'data-state': isOpen.value ? 'open' : 'closed',
                        'data-side': placement[0],
                        'data-align': placement[1] ?? 'center',
                        onKeydown: menu.onKeydown,
                    }),
                    slots.default?.({
                        isOpen: isOpen.value,
                        placement: actualPlacement.value,
                        close: () => (sub ? sub.close(true) : root.close({ returnFocus: true })),
                    }),
                );
            };
        },
    });
}

export const DropdownMenuContent = createContentComponent(false);
export const DropdownMenuSubContent = createContentComponent(true);

function usePrimitiveItem(
    componentName: string,
    props: Readonly<DropdownMenuItemPrimitiveProps>,
    emit: (event: 'select', value: DropdownMenuSelectEvent) => void,
    options: {
        role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
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
        emit('select', selectEvent);
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

    function setElement(value: Element | ComponentPublicInstance | null) {
        element.value = toHTMLElement(value);
    }

    function onPointerenter() {
        if (isDisabled.value) return;
        menu.closeSubmenus();
        menu.setActive(id.value);
    }

    return {
        menu,
        id,
        element,
        isDisabled,
        focused,
        activate,
        setElement,
        render(
            attrs: Record<string, unknown>,
            slots: Record<string, ((props?: any) => any) | undefined>,
        ) {
            const as = props.as ?? 'button';
            return h(
                as,
                mergeProps(attrs, {
                    id: id.value,
                    ref: setElement,
                    type: as === 'button' ? 'button' : undefined,
                    role: options.role ?? 'menuitem',
                    tabindex: -1,
                    disabled: as === 'button' ? optionalAttr(isDisabled.value) : undefined,
                    'aria-disabled': optionalAttr(isDisabled.value),
                    'aria-checked': options.checked?.value,
                    'data-disabled': optionalAttr(isDisabled.value),
                    'data-focused': optionalAttr(focused.value),
                    'data-highlighted': optionalAttr(focused.value),
                    'data-state': options.checked
                        ? options.checked.value === 'mixed'
                            ? 'indeterminate'
                            : options.checked.value
                              ? 'checked'
                              : 'unchecked'
                        : undefined,
                    class: bem('rp-dropdown-menu__item', {
                        focused: focused.value,
                        disabled: isDisabled.value,
                        destructive: props.destructive,
                    }),
                    onClick: (event: MouseEvent) => {
                        if (!event.defaultPrevented) activate(event);
                    },
                    onMouseenter: onPointerenter,
                }),
                slots.default?.({
                    focused: focused.value,
                    disabled: isDisabled.value,
                    select: () => activate(new Event('select')),
                }),
            );
        },
    };
}

export const DropdownMenuItem = defineComponent({
    name: 'RpDropdownMenuItem',
    inheritAttrs: false,
    props: {
        id: String,
        as: primitiveAsProp('button'),
        value: [String, Number] as PropType<DropdownMenuItemValue>,
        disabled: { type: Boolean, default: false },
        destructive: { type: Boolean, default: false },
        closeOnSelect: { type: Boolean, default: true },
    },
    emits: ['select'],
    setup(props, { attrs, emit, slots }) {
        const item = usePrimitiveItem('RpDropdownMenuItem', props, emit, {
            defaultCloseOnSelect: true,
        });
        return () => item.render(attrs, slots);
    },
});

export const DropdownMenuSeparator = defineComponent({
    name: 'RpDropdownMenuSeparator',
    inheritAttrs: false,
    props: {
        id: String,
        as: primitiveAsProp('div'),
        orientation: {
            type: String as PropType<'horizontal' | 'vertical'>,
            default: 'horizontal',
        },
    },
    setup(props, { attrs }) {
        useRequiredInject(menuKey, 'RpDropdownMenuSeparator');
        return () =>
            h(
                props.as ?? 'div',
                mergeProps(attrs, {
                    id: props.id,
                    role: 'separator',
                    'aria-orientation': props.orientation,
                    class: 'rp-dropdown-menu__separator',
                    'data-orientation': props.orientation,
                }),
            );
    },
});

export const DropdownMenuLabel = defineComponent({
    name: 'RpDropdownMenuLabel',
    inheritAttrs: false,
    props: {
        id: String,
        as: primitiveAsProp('div'),
    },
    setup(props, { attrs, slots }) {
        useRequiredInject(menuKey, 'RpDropdownMenuLabel');
        return () =>
            h(
                props.as ?? 'div',
                mergeProps(attrs, {
                    id: props.id,
                    role: 'presentation',
                    class: 'rp-dropdown-menu__group-label',
                }),
                slots.default?.(),
            );
    },
});

export const DropdownMenuCheckboxItem = defineComponent({
    name: 'RpDropdownMenuCheckboxItem',
    inheritAttrs: false,
    props: {
        id: String,
        as: primitiveAsProp('button'),
        modelValue: {
            type: [Boolean, String] as PropType<DropdownMenuCheckedState>,
            default: undefined,
        },
        defaultValue: {
            type: [Boolean, String] as PropType<DropdownMenuCheckedState>,
            default: false,
        },
        disabled: { type: Boolean, default: false },
        destructive: { type: Boolean, default: false },
        closeOnSelect: { type: Boolean, default: false },
    },
    emits: ['select', 'update:modelValue'],
    setup(props, { attrs, emit, slots }) {
        const uncontrolled = ref<DropdownMenuCheckedState>(props.defaultValue);
        const value = computed(() => props.modelValue ?? uncontrolled.value);
        const checked = computed<boolean | 'mixed'>(() =>
            value.value === 'indeterminate' ? 'mixed' : value.value,
        );
        const state = computed<'checked' | 'unchecked' | 'indeterminate'>(() =>
            value.value === 'indeterminate'
                ? 'indeterminate'
                : value.value
                  ? 'checked'
                  : 'unchecked',
        );

        function toggleChecked() {
            const nextValue = value.value === 'indeterminate' ? true : !value.value;
            if (props.modelValue === undefined) uncontrolled.value = nextValue;
            emit('update:modelValue', nextValue);
        }

        provide(checkedKey, {
            state,
            checked: computed(() => value.value !== false),
        });

        const item = usePrimitiveItem('RpDropdownMenuCheckboxItem', props, emit, {
            role: 'menuitemcheckbox',
            checked,
            defaultCloseOnSelect: false,
            afterSelect: toggleChecked,
        });
        return () => item.render(attrs, slots);
    },
});

export const DropdownMenuRadioGroup = defineComponent({
    name: 'RpDropdownMenuRadioGroup',
    inheritAttrs: false,
    props: {
        id: String,
        as: primitiveAsProp('div'),
        modelValue: {
            type: [String, Number] as PropType<DropdownMenuItemValue | null>,
            default: undefined,
        },
        defaultValue: {
            type: [String, Number] as PropType<DropdownMenuItemValue | null>,
            default: null,
        },
        ariaLabel: String,
        ariaLabelledby: String,
    },
    emits: ['update:modelValue'],
    setup(props, { attrs, emit, slots }) {
        useRequiredInject(menuKey, 'RpDropdownMenuRadioGroup');
        const uncontrolled = ref<DropdownMenuItemValue | null>(props.defaultValue);
        const value = computed(() =>
            props.modelValue === undefined ? uncontrolled.value : props.modelValue,
        );

        function select(nextValue: DropdownMenuItemValue) {
            if (value.value === nextValue) return;
            if (props.modelValue === undefined) uncontrolled.value = nextValue;
            emit('update:modelValue', nextValue);
        }

        provide(radioGroupKey, { value, select });

        return () =>
            h(
                props.as ?? 'div',
                mergeProps(attrs, {
                    id: props.id,
                    role: 'group',
                    class: 'rp-dropdown-menu__radio-group',
                    'aria-label': props.ariaLabel,
                    'aria-labelledby': props.ariaLabelledby,
                }),
                slots.default?.({ value: value.value }),
            );
    },
});

export const DropdownMenuRadioItem = defineComponent({
    name: 'RpDropdownMenuRadioItem',
    inheritAttrs: false,
    props: {
        id: String,
        as: primitiveAsProp('button'),
        value: { type: [String, Number] as PropType<DropdownMenuItemValue>, required: true },
        disabled: { type: Boolean, default: false },
        destructive: { type: Boolean, default: false },
        closeOnSelect: { type: Boolean, default: false },
    },
    emits: ['select'],
    setup(props, { attrs, emit, slots }) {
        const group = useRequiredInject(radioGroupKey, 'RpDropdownMenuRadioItem');
        const isChecked = computed(() => group.value.value === props.value);
        const checked = computed<boolean | 'mixed'>(() => isChecked.value);
        const state = computed<'checked' | 'unchecked'>(() =>
            isChecked.value ? 'checked' : 'unchecked',
        );

        provide(checkedKey, { state, checked: isChecked });
        const item = usePrimitiveItem('RpDropdownMenuRadioItem', props, emit, {
            role: 'menuitemradio',
            checked,
            defaultCloseOnSelect: false,
            afterSelect: () => group.select(props.value),
        });
        return () => item.render(attrs, slots);
    },
});

export const DropdownMenuItemIndicator = defineComponent({
    name: 'RpDropdownMenuItemIndicator',
    inheritAttrs: false,
    props: {
        as: primitiveAsProp('span'),
        forceMount: { type: Boolean, default: false },
    },
    setup(props, { attrs, slots }) {
        const context = useRequiredInject(checkedKey, 'RpDropdownMenuItemIndicator');
        return () => {
            if (!props.forceMount && !context.checked.value) return null;
            return h(
                props.as ?? 'span',
                mergeProps(attrs, {
                    class: 'rp-dropdown-menu__indicator',
                    'data-state': context.state.value,
                    'aria-hidden': true,
                }),
                slots.default?.({ state: context.state.value, checked: context.checked.value }),
            );
        };
    },
});

export const DropdownMenuSub = defineComponent({
    name: 'RpDropdownMenuSub',
    props: {
        open: { type: Boolean, default: undefined },
        defaultOpen: { type: Boolean, default: false },
    },
    emits: ['update:open'],
    setup(props, { emit, slots }) {
        const parentMenu = useRequiredInject(menuKey, 'RpDropdownMenuSub');
        const uncontrolled = ref(props.defaultOpen);
        const isOpen = computed(() => props.open ?? uncontrolled.value);
        const trigger = ref<HTMLElement | null>(null);
        const contentId = ref<string>();
        const actualPlacement = ref<DropdownMenuPlacement>('right-start');
        const pendingFocus = ref<OpenFocusTarget>(false);

        function setOpen(value: boolean) {
            const previous = isOpen.value;
            if (props.open === undefined) uncontrolled.value = value;
            if (previous !== value) emit('update:open', value);
        }

        const context: DropdownMenuSubContext = {
            isOpen,
            trigger,
            contentId,
            actualPlacement,
            pendingFocus,
            menu: null,
            open(focus: OpenFocusTarget = 'first') {
                parentMenu.closeSubmenus(context);
                pendingFocus.value = focus;
                setOpen(true);
                if (focus) void nextTick(() => context.menu?.focus(focus));
            },
            close(focusParent = false) {
                setOpen(false);
                pendingFocus.value = false;
                context.menu?.closeSubmenus();
                if (focusParent) {
                    parentMenu.setActive(trigger.value?.id ?? '');
                    parentMenu.focusElement();
                }
            },
        };

        parentMenu.registerSub(context);
        provide(subKey, context);
        watch(parentMenu.root.isOpen, (open) => {
            if (!open) context.close(false);
        });
        onBeforeUnmount(() => parentMenu.unregisterSub(context));

        return () =>
            slots.default?.({
                isOpen: isOpen.value,
                open: context.open,
                close: context.close,
            });
    },
});

export const DropdownMenuSubTrigger = defineComponent({
    name: 'RpDropdownMenuSubTrigger',
    inheritAttrs: false,
    props: {
        id: String,
        as: primitiveAsProp('button'),
        disabled: { type: Boolean, default: false },
    },
    setup(props, { attrs, slots }) {
        const menu = useRequiredInject(menuKey, 'RpDropdownMenuSubTrigger');
        const sub = useRequiredInject(subKey, 'RpDropdownMenuSubTrigger');
        const generatedId = useId();
        const id = computed(() => props.id ?? `${generatedId}-sub-trigger`);
        const isDisabled = computed(() => menu.root.disabled.value || props.disabled);
        const focused = computed(() => menu.isActive(id.value));

        const registration: MenuItemRegistration = {
            get id() {
                return id.value;
            },
            element: () => sub.trigger.value,
            disabled: () => isDisabled.value,
            activate: () => sub.open('first'),
            submenu: sub,
        };

        menu.registerItem(registration);
        onBeforeUnmount(() => menu.unregisterItem(id.value));

        function setElement(value: Element | ComponentPublicInstance | null) {
            sub.trigger.value = toHTMLElement(value);
        }

        function onMouseenter() {
            if (isDisabled.value) return;
            menu.setActive(id.value);
            sub.open(false);
        }

        return () => {
            const as = props.as ?? 'button';
            return h(
                as,
                mergeProps(attrs, {
                    id: id.value,
                    ref: setElement,
                    type: as === 'button' ? 'button' : undefined,
                    role: 'menuitem',
                    tabindex: -1,
                    disabled: as === 'button' ? optionalAttr(isDisabled.value) : undefined,
                    'aria-disabled': optionalAttr(isDisabled.value),
                    'aria-haspopup': 'menu',
                    'aria-expanded': sub.isOpen.value,
                    'aria-controls': sub.contentId.value,
                    'data-disabled': optionalAttr(isDisabled.value),
                    'data-focused': optionalAttr(focused.value),
                    'data-highlighted': optionalAttr(focused.value),
                    'data-state': sub.isOpen.value ? 'open' : 'closed',
                    class: bem('rp-dropdown-menu__item', {
                        focused: focused.value,
                        disabled: isDisabled.value,
                        submenu: true,
                        open: sub.isOpen.value,
                    }),
                    onClick: (event: MouseEvent) => {
                        if (!event.defaultPrevented && !isDisabled.value) sub.open('first');
                    },
                    onMouseenter,
                }),
                slots.default?.({
                    focused: focused.value,
                    disabled: isDisabled.value,
                    isOpen: sub.isOpen.value,
                    open: sub.open,
                    close: sub.close,
                }),
            );
        };
    },
});
