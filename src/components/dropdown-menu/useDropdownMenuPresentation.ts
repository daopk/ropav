import { computed, type Ref } from 'vue';
import { bem } from '@/utils/bem';
import type { DropdownMenuInteraction } from './dropdownMenuInteraction';
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
    menuId: Readonly<Ref<string>>;
    isDisabled: Readonly<Ref<boolean>>;
    isVisible: Readonly<Ref<boolean>>;
    isExplicitTarget: Readonly<Ref<boolean>>;
    actualPlacement: Readonly<Ref<DropdownMenuPlacement>>;
    contentHasSubmenu: Readonly<Ref<boolean>>;
    activeDescendantId: Readonly<Ref<string | undefined>>;
    interaction: DropdownMenuInteraction;
    resetHoverIntent: () => void;
    onMenuMousemove: (event: MouseEvent) => void;
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions) => void;
    toggle: () => void;
}

export function useDropdownMenuPresentation({
    props,
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

    function onMenuKeydown(event: KeyboardEvent) {
        resetHoverIntent();
        interaction.onMenuKeydown(event);
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
