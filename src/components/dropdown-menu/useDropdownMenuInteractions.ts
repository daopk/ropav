import type { Ref } from 'vue';
import { getClientPoint, type Point } from '@/utils/geometry';
import { arePathsEqual, getParentPath, normalizePath } from '@/utils/indexPath';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuItem,
    DropdownMenuOpenOptions,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
} from './types';
import {
    DEFAULT_FOCUS_TARGET,
    hasItemSubmenu,
    type ItemPath,
    type SubmenuFocusTarget,
} from './dropdown-menu-model';

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
    trackSubmenuOpen: (path: ItemPath, point?: Point) => void;
    handleItemHover: (
        item: DropdownMenuItem,
        path: ItemPath,
        event: MouseEvent | undefined,
        commit: (item: DropdownMenuItem, path: ItemPath, point?: Point) => void,
    ) => void;
    handleMenuMousemove: (
        event: MouseEvent,
        commit: (item: DropdownMenuItem, path: ItemPath, point?: Point) => void,
    ) => void;
};

type UseDropdownMenuInteractionsOptions = {
    props: Readonly<DropdownMenuProps>;
    emit: {
        select?: (item: DropdownMenuItem, event: DropdownMenuSelectEvent) => void;
    };
    isDisabled: BooleanSource;
    focusedPath: Ref<ItemPath>;
    openSubmenuPath: Ref<ItemPath>;
    getItemAtPath: (path: ItemPath) => DropdownMenuItem | undefined;
    focusItem: (target: DropdownMenuFocusTarget, menuPath?: ItemPath) => boolean;
    moveFocus: (direction: 1 | -1) => ItemPath | undefined;
    handleTypeahead: (event: KeyboardEvent) => boolean;
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
    handleTypeahead,
    submenus,
    hoverIntent,
    disclosure,
    isSubmenuOpeningLeft,
}: UseDropdownMenuInteractionsOptions) {
    function activateItem(
        item: DropdownMenuItem,
        path: ItemPath,
        event?: MouseEvent | KeyboardEvent,
    ) {
        if (item.disabled) return;

        if (hasItemSubmenu(item)) {
            openSubmenu(
                path,
                DEFAULT_FOCUS_TARGET,
                event instanceof MouseEvent ? getClientPoint(event) : undefined,
            );
            return;
        }

        selectItem(item, event);
    }

    function selectItem(item: DropdownMenuItem, originalEvent: Event = new Event('select')) {
        if (item.disabled) return;

        const event = new CustomEvent('dropdown-menu-select', {
            cancelable: true,
            detail: {
                originalEvent,
                value: item.value,
            },
        }) as DropdownMenuSelectEvent;
        emit.select?.(item, event);
        if (!event.defaultPrevented && props.closeOnSelect !== false) {
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
        point?: Point,
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

    function commitHoveredItem(item: DropdownMenuItem, path: ItemPath, point?: Point) {
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

    function selectFocusedItem(event: KeyboardEvent) {
        const item = getItemAtPath(focusedPath.value);
        if (!item) return;
        activateItem(item, focusedPath.value, event);
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
        if (handleTypeahead(event)) return;

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
                selectFocusedItem(event);
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
