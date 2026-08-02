import { ref } from 'vue';
import { useTypeahead } from '@/internal/composables/useTypeahead';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuOpenOptions,
    DropdownMenuPlacement,
} from './types';
import type { DropdownMenuInteractionNavigation } from './dropdownMenuInteractionNavigation';
import type { DropdownMenuInteractionRegistry } from './dropdownMenuInteractionRegistry';
import type {
    DropdownMenuInteractionHost,
    DropdownMenuInteractionItemRegistration,
} from './dropdownMenuInteractionTypes';

interface UseDropdownMenuInteractionKeyboardOptions {
    host: DropdownMenuInteractionHost;
    registry: DropdownMenuInteractionRegistry;
    navigation: DropdownMenuInteractionNavigation;
    openRoot: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    closeRoot: (options?: DropdownMenuCloseOptions & { returnFocus?: boolean }) => void;
}

function getPlacementSide(placement: DropdownMenuPlacement) {
    return placement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left';
}

export function useDropdownMenuInteractionKeyboard({
    host,
    registry,
    navigation,
    openRoot,
    closeRoot,
}: UseDropdownMenuInteractionKeyboardOptions) {
    const state = registry.state;
    const typeaheadMenuId = ref(host.rootMenuId);
    const typeahead = useTypeahead<DropdownMenuInteractionItemRegistration>({
        items: () => state.getItems(typeaheadMenuId.value),
        activeIndex: () =>
            state
                .getItems(typeaheadMenuId.value)
                .findIndex((item) => item.id === state.getActiveIdValue(typeaheadMenuId.value)),
        getKey: (item) => item.id,
        getTextValue: (item) => item.textValue(),
        isDisabled: (item) => item.disabled(),
        scopeKey: () => typeaheadMenuId.value,
        onMatch(item) {
            registry.setActive(item.id);
            navigation.closeSubmenus(item.menuId);
        },
    });

    function move(menuId: string, direction: 1 | -1) {
        const enabledItems = state.getEnabledItems(menuId);
        if (enabledItems.length === 0) {
            state.clearMenuState(menuId);
            return;
        }

        const currentIndex = enabledItems.findIndex(
            (item) => item.id === state.getActiveIdValue(menuId),
        );
        const start = currentIndex < 0 ? (direction === 1 ? -1 : 0) : currentIndex;
        const nextIndex = (start + direction + enabledItems.length) % enabledItems.length;
        const item = enabledItems[nextIndex];
        if (item) {
            registry.setActive(item.id);
            navigation.closeSubmenus(menuId);
        }
    }

    function handleHorizontalKey(
        menuId: string,
        event: KeyboardEvent,
        activeItem: DropdownMenuInteractionItemRegistration | undefined,
    ) {
        const menu = registry.getMenu(menuId);
        const isRight = event.key === 'ArrowRight';
        if (menuId !== host.rootMenuId && menu) {
            const closesWithRight = getPlacementSide(menu.placement()) === 'left';
            if (isRight === closesWithRight) {
                event.preventDefault();
                if (menu.stopKeyPropagation) event.stopPropagation();
                navigation.closeMenu(menuId, true);
                return;
            }
        }

        const submenuId = activeItem?.submenuId?.();
        if (!activeItem || activeItem.disabled() || !submenuId) return;
        const submenu = registry.getMenu(submenuId);
        const opensRight =
            activeItem.submenuDirection?.() !== 'left' &&
            (!submenu || getPlacementSide(submenu.placement()) !== 'left');
        if (isRight !== opensRight) return;

        event.preventDefault();
        if (menu?.stopKeyPropagation) event.stopPropagation();
        navigation.openMenu(submenuId, 'first');
    }

    function onMenuKeydown(menuId: string, event: KeyboardEvent) {
        const menu = registry.getMenu(menuId);
        typeaheadMenuId.value = menuId;
        if (typeahead.handleKey(event)) {
            if (menu?.stopKeyPropagation) event.stopPropagation();
            return;
        }

        const activeId = state.getActiveIdValue(menuId);
        const activeItem = activeId ? registry.getItem(activeId) : undefined;
        const stop = () => {
            if (menu?.stopKeyPropagation) event.stopPropagation();
        };

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                stop();
                move(menuId, 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                stop();
                move(menuId, -1);
                break;
            case 'Home':
                event.preventDefault();
                stop();
                navigation.focusMenu(menuId, 'first');
                navigation.closeSubmenus(menuId);
                break;
            case 'End':
                event.preventDefault();
                stop();
                navigation.focusMenu(menuId, 'last');
                navigation.closeSubmenus(menuId);
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
                handleHorizontalKey(menuId, event, activeItem);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                stop();
                if (activeItem) navigation.activateItem(activeItem.id, event);
                break;
            case 'Escape':
                event.preventDefault();
                stop();
                if (menu?.onEscape && !menu.onEscape(event)) return;
                if (!navigation.closeMenu(menuId, true)) closeRoot({ focusTrigger: true });
                break;
            case 'Tab':
                closeRoot();
                break;
        }
    }

    function onTriggerKeydown(event: KeyboardEvent, beforeOpen?: () => void) {
        if (host.disabled.value) return;
        switch (event.key) {
            case 'Enter':
            case ' ':
            case 'ArrowDown':
                event.preventDefault();
                beforeOpen?.();
                openRoot('first');
                break;
            case 'ArrowUp':
                event.preventDefault();
                beforeOpen?.();
                openRoot('last');
                break;
            case 'Escape':
                closeRoot({ focusTrigger: true });
                break;
        }
    }

    return {
        onMenuKeydown,
        onTriggerKeydown,
        resetTypeahead: typeahead.reset,
    };
}
