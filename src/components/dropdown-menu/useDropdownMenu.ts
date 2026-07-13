import { computed, ref, useId } from 'vue';
import { bem } from '@/utils/bem';
import type {
    DropdownMenuContentProps,
    DropdownMenuItem,
    DropdownMenuProps,
    DropdownMenuSlotProps,
    DropdownMenuTriggerProps,
} from './types';
import { DEFAULT_PLACEMENT, hasNestedItems } from './dropdown-menu-utils';
import { useDropdownMenuDisclosure } from './useDropdownMenuDisclosure';
import { useDropdownMenuDom } from './useDropdownMenuDom';
import { useDropdownMenuHoverIntent } from './useDropdownMenuHoverIntent';
import { useDropdownMenuInteractions } from './useDropdownMenuInteractions';
import { useDropdownMenuNavigation } from './useDropdownMenuNavigation';
import { useDropdownMenuRenderItems } from './useDropdownMenuRenderItems';
import { useDropdownSubmenus } from './useDropdownSubmenus';

export function useDropdownMenu(
    props: Readonly<DropdownMenuProps>,
    emit: {
        openChange?: (open: boolean) => void;
        select?: (item: DropdownMenuItem) => void;
    } = {},
) {
    const rootRef = ref<HTMLElement | null>(null);
    const menuRef = ref<HTMLElement | null>(null);
    const uncontrolledOpen = ref(false);

    const generatedId = useId();
    const menuId = computed(() => props.id ?? `${generatedId}-menu`);
    const placement = computed(() => props.placement ?? DEFAULT_PLACEMENT);
    const visibleItems = computed(() => props.items ?? []);
    const isDisabled = computed(() => Boolean(props.disabled));
    const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
    const isVisible = computed(() => isOpen.value && !isDisabled.value);
    const contentHasSubmenu = computed(() => hasNestedItems(visibleItems.value));
    const isEmpty = computed(() => visibleItems.value.length === 0);

    const {
        focusedPath,
        focusedIndex,
        getItemAtPath,
        focusItem,
        resetFocus,
        isItemFocused,
        moveFocus,
    } = useDropdownMenuNavigation(visibleItems);

    const submenus = useDropdownSubmenus({
        focusedPath,
        getItemAtPath,
        focusItem,
    });
    const { openSubmenuPath, isSubmenuOpen } = submenus;

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
        placement,
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
        submenus,
        hoverIntent,
        disclosure,
        isSubmenuOpeningLeft,
    });

    const rootClass = computed(() =>
        bem('rp-dropdown-menu', {
            [`placement-${placement.value}`]: true,
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
            items: visibleItems,
            getItemId,
            getSubmenuId,
            getMenuActiveDescendant,
            isItemFocused,
            isSubmenuOpen,
            activateItem,
            focusHoveredItem,
            selectItem,
            openSubmenu,
            closeSubmenu,
            close,
        });

    return {
        rootRef,
        menuRef,
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
