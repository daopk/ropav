import { computed, nextTick, onBeforeUnmount, ref, useId, type CSSProperties } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useOverlayLayer } from '@/internal/composables/useOverlayLayer';
import { isElement } from '@/utils/dom/query';
import { useFloatingTarget } from '../floating/useFloatingPosition';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
import { useOverlayZIndex } from '../overlay/useOverlayZIndex';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuItem,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
} from './types';
import { DEFAULT_PLACEMENT, hasNestedItems } from './dropdown-menu-model';
import { useDropdownMenuInteraction } from './dropdownMenuInteraction';
import { useDropdownMenuDataController } from './useDropdownMenuDataController';
import { useDropdownMenuPortalPosition } from './useDropdownMenuPortalPosition';
import { useDropdownMenuPresentation } from './useDropdownMenuPresentation';
import { useDropdownMenuRenderItems } from './useDropdownMenuRenderItems';
import { useDropdownMenuTargetBindings } from './useDropdownMenuTargetBindings';

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
    const generatedId = useId();
    const interactionRootMenuId = `${generatedId}-interaction-root`;
    const controllableOpen = useControllableValue({
        modelValue: () => props.open,
        defaultValue: () => false,
        onChange: (open) => emit.openChange?.(open),
    });

    const menuId = computed(() => props.id ?? `${generatedId}-menu`);
    const placement = computed(() => props.placement ?? DEFAULT_PLACEMENT);
    const teleportTo = useTeleportTarget(() => props.teleportTo);
    const shouldTeleport = computed(() => props.teleport !== false);
    const { isExplicitTarget, reference, resolvedTarget } = useFloatingTarget(
        () => props.target,
        rootRef,
    );
    const targetElement = computed(() =>
        isElement(resolvedTarget.value) ? resolvedTarget.value : null,
    );
    const visibleItems = computed(() => props.items ?? []);
    const isDisabled = computed(() => Boolean(props.disabled));
    const modal = computed(() => Boolean(props.modal));
    const isOpen = controllableOpen.value;
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
    });
    const placementSide = computed(() => actualPlacement.value.split('-')[0]);

    function focusTrigger() {
        void nextTick(() => {
            if (targetElement.value instanceof HTMLElement) {
                targetElement.value.focus();
                return;
            }
            rootRef.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus();
        });
    }

    function setOpen(nextOpen: boolean) {
        if (nextOpen && isDisabled.value) return;
        if (isOpen.value !== nextOpen) controllableOpen.setValue(nextOpen);
    }

    let resetHoverIntent!: () => void;
    const interaction = useDropdownMenuInteraction({
        rootMenuId: interactionRootMenuId,
        isOpen: isVisible,
        disabled: isDisabled,
        modal,
        setOpen,
        isTopLayer: layer.isTopLayer,
        focusTrigger,
        beforeOpen: () => resetHoverIntent(),
        beforeClose: () => resetHoverIntent(),
    });
    const open = interaction.open;
    const close = (options: DropdownMenuCloseOptions = {}) => interaction.close(options);
    const toggle = interaction.toggle;

    const cleanupRootMenu = interaction.registerMenu({
        id: interactionRootMenuId,
        element: () => menuRef.value,
        placement: () => actualPlacement.value,
        isOpen: () => isVisible.value,
    });

    const dataController = useDropdownMenuDataController({
        props,
        items: visibleItems,
        rootMenuId: interactionRootMenuId,
        menuId,
        menuRef,
        actualPlacement,
        interaction,
        onSelect: (item, event) => emit.select?.(item, event),
    });
    resetHoverIntent = dataController.resetHoverIntent;

    const { renderedItems, renderContext, getItemProps, getItemSlotProps } =
        useDropdownMenuRenderItems({
            props,
            actualPlacement,
            items: visibleItems,
            getItemId: dataController.getItemId,
            getSubmenuId: dataController.getSubmenuId,
            getMenuActiveDescendant: dataController.getMenuActiveDescendant,
            getItemElement: dataController.getItemElement,
            isItemFocused: dataController.isItemFocused,
            isSubmenuOpen: dataController.isSubmenuOpen,
            activateItem: dataController.activateItem,
            focusHoveredItem: dataController.focusHoveredItem,
            selectItem: dataController.selectItem,
            openSubmenu: dataController.openSubmenu,
            closeSubmenu: dataController.closeSubmenu,
            close,
        });

    const presentation = useDropdownMenuPresentation({
        props,
        rootMenuId: interactionRootMenuId,
        menuId,
        isDisabled,
        isVisible,
        isExplicitTarget,
        actualPlacement,
        contentHasSubmenu,
        activeDescendantId: dataController.activeDescendantId,
        interaction,
        resetHoverIntent,
        onMenuMousemove: dataController.onMenuMousemove,
        open,
        close,
        toggle,
    });

    useDropdownMenuTargetBindings({
        interaction,
        rootRef,
        menuRef,
        targetElement,
        isExplicitTarget,
        menuId,
        isVisible,
        isDisabled,
        ignoredTargets: () => props.ignore ?? [],
        pointerDownOutside: emit.pointerDownOutside,
        focusOutside: emit.focusOutside,
        interactOutside: emit.interactOutside,
    });

    const layeredContentStyle = computed<CSSProperties>(() => ({
        ...contentStyle.value,
        zIndex: layer.zIndex.value,
    }));

    onBeforeUnmount(cleanupRootMenu);

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
        focusedIndex: dataController.focusedIndex,
        focusedPath: dataController.focusedPath,
        activeDescendantId: dataController.activeDescendantId,
        rootClass: presentation.rootClass,
        contentClass: presentation.contentClass,
        contentStyle: layeredContentStyle,
        arrowStyle,
        actualPlacement,
        placementSide,
        isTargetMode: isExplicitTarget,
        teleportTo,
        shouldTeleport,
        triggerProps: presentation.triggerProps,
        contentProps: presentation.contentProps,
        slotProps: presentation.slotProps,
        open,
        close,
        toggle,
        selectItem: dataController.selectItem,
        openSubmenu: dataController.openSubmenu,
        closeSubmenu: dataController.closeSubmenu,
        onItemMouseenter: dataController.focusHoveredItem,
        onTriggerKeydown: (event: KeyboardEvent) => interaction.onTriggerKeydown(event),
        onMenuKeydown: presentation.onMenuKeydown,
        getItemProps,
        getItemSlotProps,
    };
}
