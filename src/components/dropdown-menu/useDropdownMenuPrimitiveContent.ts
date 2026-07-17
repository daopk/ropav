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
} from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import { useTeleportPositioningKey } from '../teleport-provider/useTeleportTarget';
import { isEventWithinTargets } from './dropdown-menu-outside';
import {
    blockNextDocumentClick,
    createCustomEvent,
    createMenuContext,
    createOutsideEvent,
    menuKey,
    optionalAttr,
    resolveHTMLElementRef,
    rootKey,
    subKey,
    type ComponentRefValue,
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
    const teleportPositioningKey = useTeleportPositioningKey();
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
    const floating = useFloatingPosition({
        reference,
        floating: element,
        arrow: arrowElement,
        open: isOpen,
        placement: () => props.placement ?? defaultPlacement,
        strategy: () => props.strategy ?? 'absolute',
        offset: () => props.offset,
        flip: () => props.avoidCollisions !== false && props.flip !== false,
        flipOptions: () => props.flipOptions,
        shift: () => props.avoidCollisions !== false && props.shift !== false,
        collisionPadding: () => props.collisionPadding ?? 8,
        autoUpdateOptions: () => props.autoUpdateOptions,
        restartKey: teleportPositioningKey,
    });
    watch(
        floating.actualPlacement,
        (value) => {
            actualPlacement.value = value;
        },
        { immediate: true },
    );
    const shouldRender = computed(() => props.forceMount === true || isOpen.value);
    let layerBranchCleanup: (() => void) | undefined;

    provide(menuKey, menu);
    if (sub) sub.menu = menu;

    function setElement(value: ComponentRefValue) {
        resolveHTMLElementRef(value, id.value, (resolved) => {
            const previous = element.value;
            if (previous) root.unregisterInside(previous);
            layerBranchCleanup?.();
            layerBranchCleanup = undefined;
            element.value = resolved;
            if (resolved) root.registerInside(resolved);
            if (!sub) root.layer.element.value = resolved;
            else if (resolved) layerBranchCleanup = root.layer.registerBranch(resolved);
        });
    }

    function emitOutside(type: 'pointer' | 'focus', originalEvent: Event) {
        const outsideEvent = createOutsideEvent(originalEvent);
        if (type === 'pointer') events.pointerDownOutside(outsideEvent);
        else events.focusOutside(outsideEvent);
        events.interactOutside(outsideEvent);
        return outsideEvent;
    }

    function onDocumentPointer(event: Event) {
        if (
            !root.layer.isTopLayer() ||
            root.isInside(event) ||
            isEventWithinTargets(event, props.ignore ?? [])
        ) {
            return;
        }
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
        if (
            !root.layer.isTopLayer() ||
            root.isInside(event) ||
            isEventWithinTargets(event, props.ignore ?? [])
        ) {
            return;
        }
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
        layerBranchCleanup?.();
        if (element.value) root.unregisterInside(element.value);
        if (!sub && root.layer.element.value === element.value) root.layer.element.value = null;
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
            style: [
                floating.floatingStyle.value,
                { zIndex: root.layer.zIndex.value },
                !isOpen.value ? { display: 'none' } : undefined,
            ],
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
