import type { Ref } from 'vue';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuItem,
    DropdownMenuOpenOptions,
    DropdownMenuProps,
} from './types';
import {
    arePathsEqual,
    DEFAULT_FOCUS_TARGET,
    getEventPoint,
    getParentPath,
    hasItemSubmenu,
    normalizePath,
    type ItemPath,
    type PointerPoint,
    type SubmenuFocusTarget,
} from './dropdown-menu-utils';

type BooleanSource = Readonly<Ref<boolean>>;

type DisclosureControls = {
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions) => void;
    toggle: () => void;
};

type SubmenuControls = {
    closeSubmenusAfter: (menuPath: ItemPath) => void;
    openSubmenu: (path: ItemPath, focus?: SubmenuFocusTarget) => boolean;
    closeSubmenu: (path: ItemPath) => boolean;
    closeCurrentSubmenu: () => boolean;
};

type HoverIntentControls = {
    clearPendingHover: () => void;
    resetHoverIntent: () => void;
    trackSubmenuOpen: (path: ItemPath, point?: PointerPoint) => void;
    handleItemHover: (
        item: DropdownMenuItem,
        path: ItemPath,
        event: MouseEvent | undefined,
        commit: (item: DropdownMenuItem, path: ItemPath, point?: PointerPoint) => void,
    ) => void;
    handleMenuMousemove: (
        event: MouseEvent,
        commit: (item: DropdownMenuItem, path: ItemPath, point?: PointerPoint) => void,
    ) => void;
};

type UseDropdownMenuInteractionsOptions = {
    props: Readonly<DropdownMenuProps>;
    emit: {
        select?: (item: DropdownMenuItem) => void;
    };
    isDisabled: BooleanSource;
    focusedPath: Ref<ItemPath>;
    openSubmenuPath: Ref<ItemPath>;
    getItemAtPath: (path: ItemPath) => DropdownMenuItem | undefined;
    focusItem: (target: DropdownMenuFocusTarget, menuPath?: ItemPath) => boolean;
    moveFocus: (direction: 1 | -1) => ItemPath | undefined;
    submenus: SubmenuControls;
    hoverIntent: HoverIntentControls;
    disclosure: DisclosureControls;
    isSubmenuOpeningLeft: (path: ItemPath) => boolean;
};

export function useDropdownMenuInteractions({
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
}: UseDropdownMenuInteractionsOptions) {
    function activateItem(item: DropdownMenuItem, path: ItemPath, event?: MouseEvent) {
        if (item.disabled) return;

        if (hasItemSubmenu(item)) {
            openSubmenu(path, DEFAULT_FOCUS_TARGET, event ? getEventPoint(event) : undefined);
            return;
        }

        selectItem(item);
    }

    function selectItem(item: DropdownMenuItem) {
        if (item.disabled) return;

        emit.select?.(item);
        if (props.closeOnSelect !== false) {
            disclosure.close({ focusTrigger: true });
        }
    }

    function closeSubmenusAfter(menuPath: ItemPath) {
        submenus.closeSubmenusAfter(menuPath);
        hoverIntent.resetHoverIntent();
    }

    function openSubmenu(
        path: ItemPath,
        focus: SubmenuFocusTarget = DEFAULT_FOCUS_TARGET,
        point?: PointerPoint,
    ) {
        const opened = submenus.openSubmenu(path, focus);
        if (opened) hoverIntent.trackSubmenuOpen(path, point);
        return opened;
    }

    function closeSubmenu(path: ItemPath) {
        const closed = submenus.closeSubmenu(path);
        if (closed) hoverIntent.resetHoverIntent();
        return closed;
    }

    function closeCurrentSubmenu() {
        const closed = submenus.closeCurrentSubmenu();
        if (closed) hoverIntent.resetHoverIntent();
        return closed;
    }

    function commitHoveredItem(item: DropdownMenuItem, path: ItemPath, point?: PointerPoint) {
        hoverIntent.clearPendingHover();
        focusedPath.value = [...path];

        if (hasItemSubmenu(item)) {
            openSubmenu(path, false, point);
        } else {
            closeSubmenusAfter(getParentPath(path));
        }
    }

    function focusHoveredItem(
        item: DropdownMenuItem,
        indexOrPath: number | ItemPath,
        event?: MouseEvent,
    ) {
        if (item.disabled) return;

        const path = normalizePath(indexOrPath);
        hoverIntent.handleItemHover(item, path, event, commitHoveredItem);
    }

    function selectFocusedItem() {
        const item = getItemAtPath(focusedPath.value);
        if (!item) return;
        activateItem(item, focusedPath.value);
    }

    function moveFocusedItem(direction: 1 | -1) {
        const menuPath = moveFocus(direction);
        if (menuPath) closeSubmenusAfter(menuPath);
    }

    function onTriggerClick() {
        disclosure.toggle();
    }

    function onTriggerKeydown(event: KeyboardEvent) {
        if (isDisabled.value) return;

        switch (event.key) {
            case 'Enter':
            case ' ':
            case 'ArrowDown':
                event.preventDefault();
                disclosure.open();
                break;
            case 'ArrowUp':
                event.preventDefault();
                disclosure.open({ focus: 'last' });
                break;
            case 'Escape':
                disclosure.close({ focusTrigger: true });
                break;
        }
    }

    function onMenuKeydown(event: KeyboardEvent) {
        hoverIntent.resetHoverIntent();

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                moveFocusedItem(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                moveFocusedItem(-1);
                break;
            case 'Home':
                event.preventDefault();
                focusItem('first', getParentPath(focusedPath.value));
                break;
            case 'End':
                event.preventDefault();
                focusItem('last', getParentPath(focusedPath.value));
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
                onMenuHorizontalKeydown(event);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                selectFocusedItem();
                break;
            case 'Escape':
                event.preventDefault();
                if (!closeCurrentSubmenu()) disclosure.close({ focusTrigger: true });
                break;
            case 'Tab':
                disclosure.close();
                break;
        }
    }

    function onMenuHorizontalKeydown(event: KeyboardEvent) {
        const isRight = event.key === 'ArrowRight';
        const currentMenuPath = getParentPath(focusedPath.value);
        const closePath =
            focusedPath.value.length > 1
                ? currentMenuPath
                : arePathsEqual(focusedPath.value, openSubmenuPath.value)
                  ? focusedPath.value
                  : undefined;

        if (closePath && isRight === isSubmenuOpeningLeft(closePath)) {
            event.preventDefault();
            closeSubmenu(closePath);
            return;
        }

        const item = getItemAtPath(focusedPath.value);
        if (!item || item.disabled || !hasItemSubmenu(item)) return;

        const nextSubmenuOpensLeft = isSubmenuOpeningLeft(focusedPath.value);
        if (isRight === nextSubmenuOpensLeft) return;

        event.preventDefault();
        openSubmenu(focusedPath.value);
    }

    function onMenuMousemove(event: MouseEvent) {
        hoverIntent.handleMenuMousemove(event, commitHoveredItem);
    }

    function onMenuMouseleave() {
        hoverIntent.resetHoverIntent();
    }

    return {
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
    };
}
