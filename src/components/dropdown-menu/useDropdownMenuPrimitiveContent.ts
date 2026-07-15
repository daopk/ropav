import {
    computed,
    mergeProps,
    nextTick,
    onBeforeUnmount,
    onMounted,
    provide,
    ref,
    useId,
    watch,
    type ComponentPublicInstance,
} from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
import {
    blockNextDocumentClick,
    createCustomEvent,
    createMenuContext,
    createOutsideEvent,
    isTopLayer,
    menuKey,
    optionalAttr,
    rootKey,
    subKey,
    toHTMLElement,
    type ElementReference,
} from './dropdown-menu-primitive-core';
import type {
    DropdownMenuContentPrimitiveProps,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuPlacement,
} from './types';

type ContentProps = Readonly<DropdownMenuContentPrimitiveProps>;

type ContentEvents = {
    escapeKeyDown: (event: CustomEvent<{ originalEvent: KeyboardEvent }>) => void;
    pointerDownOutside: (event: DropdownMenuInteractOutsideEvent) => void;
    focusOutside: (event: DropdownMenuInteractOutsideEvent) => void;
    interactOutside: (event: DropdownMenuInteractOutsideEvent) => void;
};

export function useDropdownMenuPrimitiveContent(
    props: ContentProps,
    attrs: Record<string, unknown>,
    events: ContentEvents,
    submenu: boolean,
) {
    const componentName = submenu ? 'RpDropdownMenuSubContent' : 'RpDropdownMenuContent';
    const root = useRequiredInject(rootKey, componentName);
    const sub = submenu ? useRequiredInject(subKey, componentName) : undefined;
    const generatedId = useId();
    const id = computed(() => props.id ?? `${generatedId}-${submenu ? 'submenu' : 'menu'}`);
    const element = ref<HTMLElement | null>(null);
    const arrowElement = ref<HTMLElement | null>(null);
    const defaultPlacement: DropdownMenuPlacement = submenu ? 'right-start' : 'bottom-start';
    const actualPlacement = ref<DropdownMenuPlacement>(props.placement ?? defaultPlacement);
    const isOpen = computed(() => (sub ? sub.isOpen.value : root.isOpen.value));
    const reference = computed<ElementReference | null>(() =>
        sub ? sub.trigger.value : root.reference.value,
    );
    const teleportTo = useTeleportTarget(() => undefined);
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
            events.escapeKeyDown(customEvent);
            if (customEvent.defaultPrevented) return;
            if (sub) sub.close(true);
            else root.close({ returnFocus: true });
        },
    });
    const floating = useFloatingPosition<DropdownMenuPlacement>({
        reference,
        floating: element,
        arrow: arrowElement,
        open: isOpen,
        placement: () => props.placement ?? defaultPlacement,
        strategy: () => props.strategy ?? 'absolute',
        offset: () => props.offset,
        flip: () => props.avoidCollisions !== false && props.flip !== false,
        shift: () => props.avoidCollisions !== false && props.shift !== false,
        collisionPadding: () => props.collisionPadding ?? 8,
        arrowEnabled: () => !submenu && props.arrow === true,
        restartKey: () => teleportTo.value,
    });
    watch(
        floating.actualPlacement,
        (value) => {
            actualPlacement.value = value;
        },
        { immediate: true },
    );
    const shouldRender = computed(() => props.forceMount === true || isOpen.value);

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
        if (type === 'pointer') events.pointerDownOutside(outsideEvent);
        else events.focusOutside(outsideEvent);
        events.interactOutside(outsideEvent);
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
        if (isOpen.value) {
            menu.focus((sub ? sub.pendingFocus.value : root.pendingFocus.value) || 'first');
        }
    });
    onBeforeUnmount(() => {
        setDocumentListeners(false);
        if (element.value) root.unregisterInside(element.value);
        if (sub) sub.menu = null;
        else if (root.contentId.value === id.value) root.contentId.value = undefined;
    });

    const placementSide = computed(() => floating.actualPlacement.value.split('-')[0]);
    const placementAlign = computed(() => floating.actualPlacement.value.split('-')[1] ?? 'center');
    const rootAttrs = computed(() =>
        mergeProps(attrs, {
            id: id.value,
            role: 'menu',
            tabindex: -1,
            hidden: optionalAttr(!isOpen.value),
            class: submenu
                ? bem('rp-dropdown-menu__submenu', { compound: true, open: isOpen.value })
                : bem('rp-dropdown-menu__content', { compound: true, open: isOpen.value }),
            style: [floating.floatingStyle.value, !isOpen.value ? { display: 'none' } : undefined],
            'aria-label': props.ariaLabel,
            'aria-labelledby': props.ariaLabelledby ?? (submenu ? undefined : root.triggerId.value),
            'aria-describedby': props.ariaDescribedby,
            'aria-activedescendant': menu.activeId.value ?? undefined,
            'data-state': isOpen.value ? 'open' : 'closed',
            'data-placement': floating.actualPlacement.value,
            'data-side': placementSide.value,
            'data-align': placementAlign.value,
            onKeydown: menu.onKeydown,
        }),
    );

    function close() {
        if (sub) sub.close(true);
        else root.close({ returnFocus: true });
    }

    return {
        id,
        element,
        arrowElement,
        actualPlacement,
        isOpen,
        shouldRender,
        placementSide,
        rootAttrs,
        floating,
        setElement,
        close,
    };
}
