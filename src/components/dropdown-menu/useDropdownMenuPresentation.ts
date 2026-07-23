import { computed, type Ref } from 'vue';
import { bem } from '@/utils/bem';
import type { DropdownMenuInteractionRuntime } from './dropdownMenuInteraction';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuContentProps,
    DropdownMenuFocusTarget,
    DropdownMenuOpenOptions,
    DropdownMenuPlacement,
    DropdownMenuProps,
    DropdownMenuSlotProps,
    DropdownMenuTriggerProps,
} from './types';

interface UseDropdownMenuPresentationOptions {
    props: Readonly<DropdownMenuProps>;
    rootMenuId: string;
    menuId: Readonly<Ref<string>>;
    isDisabled: Readonly<Ref<boolean>>;
    isVisible: Readonly<Ref<boolean>>;
    isExplicitTarget: Readonly<Ref<boolean>>;
    actualPlacement: Readonly<Ref<DropdownMenuPlacement>>;
    contentHasSubmenu: Readonly<Ref<boolean>>;
    activeDescendantId: Readonly<Ref<string | undefined>>;
    interaction: DropdownMenuInteractionRuntime;
    resetHoverIntent: () => void;
    onMenuMousemove: (event: MouseEvent) => void;
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions) => void;
    toggle: () => void;
}

export function useDropdownMenuPresentation({
    props,
    rootMenuId,
    menuId,
    isDisabled,
    isVisible,
    isExplicitTarget,
    actualPlacement,
    contentHasSubmenu,
    activeDescendantId,
    interaction,
    resetHoverIntent,
    onMenuMousemove,
    open,
    close,
    toggle,
}: UseDropdownMenuPresentationOptions) {
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
        onClick: () => interaction.onTriggerClick(),
        onKeydown: (event) => interaction.onTriggerKeydown(event),
    }));

    function getKeyboardMenuId(event: KeyboardEvent) {
        const activeItem = interaction.activeItemId.value
            ? interaction.getItem(interaction.activeItemId.value)
            : undefined;
        const openSubmenuId = activeItem?.submenuId?.();
        if (openSubmenuId && interaction.isMenuOpen(openSubmenuId)) {
            if (event.key === 'Escape') return openSubmenuId;

            const opensLeft =
                activeItem?.submenuDirection?.() === 'left' ||
                interaction.getMenu(openSubmenuId)?.placement().startsWith('left');
            if (event.key === (opensLeft ? 'ArrowRight' : 'ArrowLeft')) return openSubmenuId;
        }

        if (
            ['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key) &&
            interaction.activeMenuId.value !== rootMenuId
        ) {
            return interaction.activeMenuId.value;
        }
        return activeItem?.menuId ?? interaction.activeMenuId.value;
    }

    function onMenuKeydown(event: KeyboardEvent) {
        resetHoverIntent();
        interaction.onMenuKeydown(getKeyboardMenuId(event), event);
    }

    const contentProps = computed<DropdownMenuContentProps>(() => ({
        id: menuId.value,
        role: 'menu',
        tabindex: -1,
        'aria-label': props.ariaLabel || undefined,
        'aria-activedescendant': activeDescendantId.value,
        onKeydown: onMenuKeydown,
        onMousemove: onMenuMousemove,
        onMouseleave: resetHoverIntent,
    }));
    const slotProps = computed<DropdownMenuSlotProps>(() => ({
        triggerProps: triggerProps.value,
        isOpen: isVisible.value,
        open,
        close,
        toggle,
    }));

    return {
        rootClass,
        contentClass,
        triggerProps,
        contentProps,
        slotProps,
        onMenuKeydown,
    };
}
