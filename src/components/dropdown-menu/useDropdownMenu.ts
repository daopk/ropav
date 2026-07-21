import { computed, ref, useId, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useOverlayLayer } from '@/internal/composables/useOverlayLayer';
import { useTypeahead } from '@/internal/composables/useTypeahead';
import { bem } from '@/utils/bem';
import { isElementReference, useFloatingTarget } from '../floating/useFloatingPosition';
import {
    useTeleportPositioningKey,
    useTeleportTarget,
} from '../teleport-provider/useTeleportTarget';
import { useOverlayZIndex } from '../overlay/useOverlayZIndex';
import type {
    DropdownMenuContentProps,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuItem,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
    DropdownMenuSlotProps,
    DropdownMenuTriggerProps,
} from './types';
import { DEFAULT_PLACEMENT, getParentPath, hasNestedItems } from './dropdown-menu-utils';
import { useDropdownMenuDisclosure } from './useDropdownMenuDisclosure';
import { useDropdownMenuDom } from './useDropdownMenuDom';
import { useDropdownMenuHoverIntent } from './useDropdownMenuHoverIntent';
import { useDropdownMenuInteractions } from './useDropdownMenuInteractions';
import { useDropdownMenuNavigation } from './useDropdownMenuNavigation';
import { useDropdownMenuPortalPosition } from './useDropdownMenuPortalPosition';
import { useDropdownMenuRenderItems } from './useDropdownMenuRenderItems';
import { useDropdownSubmenus } from './useDropdownSubmenus';

export function useDropdownMenu(
    props: Readonly<DropdownMenuProps>,
    emit: {
        openChange?: (open: boolean) => void;
        select?: (item: DropdownMenuItem, event: DropdownMenuSelectEvent) => void;
        pointerDownOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
        focusOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
        interactOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
    } = {},
) {
    const rootRef = ref<HTMLElement | null>(null);
    const menuRef = ref<HTMLElement | null>(null);
    const arrowRef = ref<HTMLElement | null>(null);
    const uncontrolledOpen = ref(false);

    const generatedId = useId();
    const menuId = computed(() => props.id ?? `${generatedId}-menu`);
    const placement = computed(() => props.placement ?? DEFAULT_PLACEMENT);
    const teleportTo = useTeleportTarget(() => props.teleportTo);
    const teleportPositioningKey = useTeleportPositioningKey();
    const shouldTeleport = computed(() => props.teleport !== false);
    const { isExplicitTarget, reference, resolvedTarget } = useFloatingTarget(
        () => props.target,
        rootRef,
    );
    const targetElement = computed(() =>
        isElementReference(resolvedTarget.value) ? resolvedTarget.value : null,
    );
    const visibleItems = computed(() => props.items ?? []);
    const isDisabled = computed(() => Boolean(props.disabled));
    const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
    const isVisible = computed(() => isOpen.value && !isDisabled.value);
    const baseZIndex = useOverlayZIndex({
        baseZIndex: () => props.baseZIndex,
        defaultBaseZIndex: 100,
        aboveParent: false,
    });
    const layer = useOverlayLayer({
        active: isVisible,
        element: menuRef,
        baseZIndex,
    });
    const contentHasSubmenu = computed(() => hasNestedItems(visibleItems.value));
    const isEmpty = computed(() => visibleItems.value.length === 0);

    const { actualPlacement, arrowStyle, contentStyle } = useDropdownMenuPortalPosition({
        props,
        reference,
        menuRef,
        arrowRef,
        isVisible,
        placement,
        restartKey: () => [shouldTeleport.value, teleportTo.value, teleportPositioningKey.value],
    });
    const placementSide = computed(() => actualPlacement.value.split('-')[0]);

    const {
        focusedPath,
        focusedIndex,
        getItemsAtPath,
        getItemAtPath,
        focusItem,
        resetFocus,
        setFocusedIndex,
        isItemFocused,
        moveFocus,
    } = useDropdownMenuNavigation(visibleItems);

    const submenus = useDropdownSubmenus({
        focusedPath,
        getItemAtPath,
        focusItem,
    });
    const { openSubmenuPath, isSubmenuOpen } = submenus;

    const activeMenuPath = computed(() => getParentPath(focusedPath.value));
    const typeahead = useTypeahead<DropdownMenuItem>({
        items: () => getItemsAtPath(activeMenuPath.value),
        activeIndex: () => focusedPath.value.at(-1) ?? -1,
        getKey: (item) => item.value,
        getTextValue: (item) => item.label,
        isDisabled: (item) => Boolean(item.disabled),
        scopeKey: () => activeMenuPath.value.join('/'),
        onMatch(_item, index) {
            const menuPath = activeMenuPath.value;
            if (setFocusedIndex(index, menuPath)) submenus.closeSubmenusAfter(menuPath);
        },
    });

    const {
        activeDescendantId,
        focusMenu,
        focusTrigger,
        getItemId,
        getSubmenuId,
        getItemElement,
        getSubmenuElement,
        isSubmenuOpeningLeft,
        getMenuActiveDescendant,
    } = useDropdownMenuDom({
        menuId,
        rootRef,
        menuRef,
        targetRef: targetElement,
        placement: actualPlacement,
        focusedPath,
    });

    const hoverIntent = useDropdownMenuHoverIntent({
        openSubmenuPath,
        getItemElement,
        getSubmenuElement,
    });

    const disclosure = useDropdownMenuDisclosure({
        props,
        emit,
        rootRef,
        menuRef,
        targetRef: targetElement,
        uncontrolledOpen,
        isDisabled,
        isOpen,
        isVisible,
        focusedPath,
        resetFocus,
        resetSubmenus: submenus.resetSubmenus,
        resetHoverIntent: hoverIntent.resetHoverIntent,
        focusItem,
        focusMenu,
        focusTrigger,
        layer,
    });
    const { open, close, toggle } = disclosure;

    const {
        activateItem,
        selectItem,
        openSubmenu,
        closeSubmenu,
        focusHoveredItem,
        onTriggerClick,
        onTriggerKeydown,
        onMenuKeydown,
        onMenuMousemove,
        onMenuMouseleave,
    } = useDropdownMenuInteractions({
        props,
        emit,
        isDisabled,
        focusedPath,
        openSubmenuPath,
        getItemAtPath,
        focusItem,
        moveFocus,
        handleTypeahead: typeahead.handleKey,
        submenus,
        hoverIntent,
        disclosure,
        isSubmenuOpeningLeft,
    });

    const rootClass = computed(() =>
        bem('rp-dropdown-menu', {
            [`placement-${actualPlacement.value}`]: true,
            target: isExplicitTarget.value,
            open: isVisible.value,
            disabled: isDisabled.value,
        }),
    );

    const contentClass = computed(() =>
        bem('rp-dropdown-menu__content', {
            'has-submenu': contentHasSubmenu.value,
        }),
    );

    const triggerProps = computed<DropdownMenuTriggerProps>(() => ({
        'aria-controls': isDisabled.value ? undefined : menuId.value,
        'aria-expanded': isDisabled.value ? undefined : isVisible.value,
        'aria-haspopup': 'menu',
        disabled: isDisabled.value || undefined,
        onClick: onTriggerClick,
        onKeydown: onTriggerKeydown,
    }));

    const contentProps = computed<DropdownMenuContentProps>(() => ({
        id: menuId.value,
        role: 'menu',
        tabindex: -1,
        'aria-label': props.ariaLabel || undefined,
        'aria-activedescendant': activeDescendantId.value,
        onKeydown: onMenuKeydown,
        onMousemove: onMenuMousemove,
        onMouseleave: onMenuMouseleave,
    }));

    const slotProps = computed<DropdownMenuSlotProps>(() => ({
        triggerProps: triggerProps.value,
        isOpen: isVisible.value,
        open,
        close,
        toggle,
    }));

    const { renderedItems, renderContext, getItemProps, getItemSlotProps } =
        useDropdownMenuRenderItems({
            props,
            actualPlacement,
            items: visibleItems,
            getItemId,
            getSubmenuId,
            getMenuActiveDescendant,
            getItemElement,
            isItemFocused,
            isSubmenuOpen,
            activateItem,
            focusHoveredItem,
            selectItem,
            openSubmenu,
            closeSubmenu,
            close,
        });

    watch(
        [isExplicitTarget, targetElement],
        ([explicit, target], _previous, onCleanup) => {
            if (!explicit || !target) return;
            target.addEventListener('click', onTriggerClick);
            target.addEventListener('keydown', onTriggerKeydown as EventListener);
            onCleanup(() => {
                target.removeEventListener('click', onTriggerClick);
                target.removeEventListener('keydown', onTriggerKeydown as EventListener);
            });
        },
        { flush: 'sync' },
    );

    watch(
        isVisible,
        (visible) => {
            if (!visible) typeahead.reset();
        },
        { flush: 'sync' },
    );

    watch(
        [isExplicitTarget, targetElement, menuId, isVisible, isDisabled],
        ([explicit, target, id, visible, disabled], _previous, onCleanup) => {
            if (!explicit || !target) return;
            const attributes = ['aria-controls', 'aria-expanded', 'aria-haspopup', 'aria-disabled'];
            const snapshot = new Map(
                attributes.map((attribute) => [attribute, target.getAttribute(attribute)]),
            );
            if (disabled) {
                target.removeAttribute('aria-controls');
                target.removeAttribute('aria-expanded');
                target.removeAttribute('aria-haspopup');
                target.setAttribute('aria-disabled', 'true');
            } else {
                target.setAttribute('aria-controls', id);
                target.setAttribute('aria-expanded', String(visible));
                target.setAttribute('aria-haspopup', 'menu');
                target.removeAttribute('aria-disabled');
            }
            onCleanup(() => {
                for (const [attribute, value] of snapshot) {
                    if (value == null) target.removeAttribute(attribute);
                    else target.setAttribute(attribute, value);
                }
            });
        },
        { flush: 'sync' },
    );

    const layeredContentStyle = computed<CSSProperties>(() => ({
        ...contentStyle.value,
        zIndex: layer.zIndex.value,
    }));

    return {
        rootRef,
        menuRef,
        arrowRef,
        menuId,
        isVisible,
        isEmpty,
        visibleItems,
        renderedItems,
        renderContext,
        focusedIndex,
        focusedPath,
        activeDescendantId,
        rootClass,
        contentClass,
        contentStyle: layeredContentStyle,
        arrowStyle,
        actualPlacement,
        placementSide,
        isTargetMode: isExplicitTarget,
        teleportTo,
        shouldTeleport,
        triggerProps,
        contentProps,
        slotProps,
        open,
        close,
        toggle,
        selectItem,
        openSubmenu,
        closeSubmenu,
        onItemMouseenter: focusHoveredItem,
        onTriggerKeydown,
        onMenuKeydown,
        getItemProps,
        getItemSlotProps,
    };
}
