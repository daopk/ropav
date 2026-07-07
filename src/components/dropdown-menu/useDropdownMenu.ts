import { computed, nextTick, ref, useId, watch } from 'vue';
import { useClickOutside } from '@/composables/useClickOutside';
import { bem } from '@/utils/bem';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuContentProps,
    DropdownMenuFocusTarget,
    DropdownMenuItem,
    DropdownMenuItemProps,
    DropdownMenuItemSlotProps,
    DropdownMenuOpenOptions,
    DropdownMenuPlacement,
    DropdownMenuProps,
    DropdownMenuRenderedItem,
    DropdownMenuSlotProps,
    DropdownMenuTriggerProps,
} from './types';

const DEFAULT_PLACEMENT: DropdownMenuPlacement = 'bottom-start';
const DEFAULT_FOCUS_TARGET: DropdownMenuFocusTarget = 'first';

type ItemPath = number[];
type SubmenuFocusTarget = DropdownMenuFocusTarget | false;

function getOpenFocusTarget(
    options: DropdownMenuOpenOptions | DropdownMenuFocusTarget | undefined,
) {
    if (typeof options === 'string') return options;
    return options?.focus ?? DEFAULT_FOCUS_TARGET;
}

function getItemClass(
    item: DropdownMenuItem,
    focused: boolean,
    disabled: boolean,
    hasSubmenu: boolean,
    submenuOpen: boolean,
) {
    return bem('rp-dropdown-menu__item', {
        focused,
        disabled,
        destructive: item.destructive,
        submenu: hasSubmenu,
        open: submenuOpen,
    });
}

function hasItemSubmenu(item: DropdownMenuItem) {
    return (item.children?.length ?? 0) > 0;
}

function hasNestedItems(items: DropdownMenuItem[]): boolean {
    return items.some((item) => hasItemSubmenu(item) || hasNestedItems(item.children ?? []));
}

function getPathKey(path: ItemPath) {
    return path.length === 0 ? 'root' : path.join('-');
}

function getParentPath(path: ItemPath) {
    return path.slice(0, -1);
}

function arePathsEqual(a: ItemPath, b: ItemPath) {
    return a.length === b.length && a.every((part, index) => part === b[index]);
}

function isPathPrefix(prefix: ItemPath, path: ItemPath) {
    return prefix.length <= path.length && prefix.every((part, index) => part === path[index]);
}

function normalizePath(indexOrPath: number | ItemPath): ItemPath {
    return Array.isArray(indexOrPath) ? indexOrPath : [indexOrPath];
}

function getEnabledIndexes(items: DropdownMenuItem[]) {
    return items.map((item, index) => (item.disabled ? -1 : index)).filter((index) => index >= 0);
}

function getNextEnabledIndex(items: DropdownMenuItem[], index: number, direction: 1 | -1) {
    const enabledIndexes = getEnabledIndexes(items);
    if (enabledIndexes.length === 0) return undefined;

    if (direction === 1) {
        return enabledIndexes.find((candidate) => candidate > index) ?? enabledIndexes[0];
    }

    for (let i = enabledIndexes.length - 1; i >= 0; i -= 1) {
        const candidate = enabledIndexes[i]!;
        if (candidate < index) return candidate;
    }

    return enabledIndexes[enabledIndexes.length - 1];
}

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
    const focusedPath = ref<ItemPath>([]);
    const openSubmenuPath = ref<ItemPath>([]);

    const generatedId = useId();
    const menuId = computed(() => props.id ?? `${generatedId}-menu`);
    const placement = computed(() => props.placement ?? DEFAULT_PLACEMENT);
    const visibleItems = computed(() => props.items ?? []);
    const isDisabled = computed(() => Boolean(props.disabled));
    const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
    const isVisible = computed(() => isOpen.value && !isDisabled.value);
    const contentHasSubmenu = computed(() => hasNestedItems(visibleItems.value));
    const focusedIndex = computed(() => focusedPath.value[0] ?? -1);
    const activeDescendantId = computed(() =>
        focusedPath.value.length === 0 ? undefined : getItemId(focusedPath.value),
    );

    const isEmpty = computed(() => visibleItems.value.length === 0);

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
    }));

    const slotProps = computed<DropdownMenuSlotProps>(() => ({
        triggerProps: triggerProps.value,
        isOpen: isVisible.value,
        open,
        close,
        toggle,
    }));

    const renderedItems = computed<DropdownMenuRenderedItem[]>(() =>
        getRenderedItems(visibleItems.value),
    );

    function getRenderedItems(
        items: DropdownMenuItem[],
        parentPath: ItemPath = [],
    ): DropdownMenuRenderedItem[] {
        return items.map((item, index) => {
            const path = [...parentPath, index];
            const level = parentPath.length;
            const focused = isItemFocused(path);
            const disabled = Boolean(item.disabled);
            const hasSubmenu = hasItemSubmenu(item);
            const submenuOpen = hasSubmenu && isSubmenuOpen(path);

            return {
                item,
                index,
                key: `${getPathKey(path)}:${String(item.value)}`,
                path,
                level,
                focused,
                disabled,
                hasSubmenu,
                submenuOpen,
                props: getItemProps(item, path, focused, disabled),
                submenuProps: hasSubmenu ? getSubmenuProps(item, path) : undefined,
                slotProps: getItemSlotProps(item, path, focused, disabled),
                children: hasSubmenu ? getRenderedItems(item.children ?? [], path) : [],
            };
        });
    }

    function setOpen(nextOpen: boolean) {
        if (nextOpen && isDisabled.value) return;

        const previousOpen = isOpen.value;
        if (props.open === undefined) uncontrolledOpen.value = nextOpen;
        if (previousOpen !== nextOpen) emit.openChange?.(nextOpen);
    }

    function focusMenu() {
        nextTick(() => menuRef.value?.focus());
    }

    function focusTrigger() {
        nextTick(() => {
            const trigger = rootRef.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]');
            trigger?.focus();
        });
    }

    function getItemsAtPath(path: ItemPath) {
        let items = visibleItems.value;
        for (const index of path) {
            const item = items[index];
            if (!item) return [];
            items = item.children ?? [];
        }
        return items;
    }

    function getItemAtPath(path: ItemPath) {
        if (path.length === 0) return undefined;
        const items = getItemsAtPath(getParentPath(path));
        return items[path[path.length - 1]];
    }

    function focusItem(target: DropdownMenuFocusTarget, menuPath: ItemPath = []) {
        const enabledIndexes = getEnabledIndexes(getItemsAtPath(menuPath));
        const index =
            target === 'last' ? enabledIndexes[enabledIndexes.length - 1] : enabledIndexes[0];

        focusedPath.value = index === undefined ? [] : [...menuPath, index];
    }

    function resetFocus() {
        focusedPath.value = [];
        openSubmenuPath.value = [];
    }

    function open(options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) {
        if (isDisabled.value) return;

        setOpen(true);
        focusItem(getOpenFocusTarget(options));
        openSubmenuPath.value = [];
        focusMenu();
    }

    function close(options: DropdownMenuCloseOptions = {}) {
        setOpen(false);
        resetFocus();
        if (options.focusTrigger) focusTrigger();
    }

    function toggle() {
        if (isVisible.value) {
            close({ focusTrigger: true });
        } else {
            open();
        }
    }

    function activateItem(item: DropdownMenuItem, path: ItemPath) {
        if (item.disabled) return;

        if (hasItemSubmenu(item)) {
            openSubmenu(path);
            return;
        }

        selectItem(item);
    }

    function selectItem(item: DropdownMenuItem) {
        if (item.disabled) return;

        emit.select?.(item);
        if (props.closeOnSelect !== false) {
            close({ focusTrigger: true });
        }
    }

    function isItemFocused(indexOrPath: number | ItemPath) {
        return arePathsEqual(normalizePath(indexOrPath), focusedPath.value);
    }

    function getItemId(indexOrPath: number | ItemPath) {
        return `${menuId.value}-item-${getPathKey(normalizePath(indexOrPath))}`;
    }

    function getSubmenuId(path: ItemPath) {
        return `${menuId.value}-submenu-${getPathKey(path)}`;
    }

    function getMenuActiveDescendant(menuPath: ItemPath) {
        return arePathsEqual(getParentPath(focusedPath.value), menuPath)
            ? getItemId(focusedPath.value)
            : undefined;
    }

    function isSubmenuOpen(path: ItemPath) {
        return path.length > 0 && isPathPrefix(path, openSubmenuPath.value);
    }

    function closeSubmenusAfter(menuPath: ItemPath) {
        openSubmenuPath.value = [...menuPath];
    }

    function openSubmenu(path: ItemPath, focus: SubmenuFocusTarget = DEFAULT_FOCUS_TARGET) {
        const item = getItemAtPath(path);
        if (!item || item.disabled || !hasItemSubmenu(item)) return;

        openSubmenuPath.value = [...path];
        if (focus) focusItem(focus, path);
    }

    function closeSubmenu(path: ItemPath) {
        if (!isSubmenuOpen(path)) return;

        openSubmenuPath.value = getParentPath(path);
        if (isPathPrefix(path, focusedPath.value) && focusedPath.value.length > path.length) {
            focusedPath.value = [...path];
        }
    }

    function closeCurrentSubmenu() {
        const path =
            focusedPath.value.length > 1 ? getParentPath(focusedPath.value) : focusedPath.value;

        if (path.length === 0 || !isSubmenuOpen(path)) return false;

        closeSubmenu(path);
        return true;
    }

    function focusHoveredItem(item: DropdownMenuItem, indexOrPath: number | ItemPath) {
        if (item.disabled) return;

        const path = normalizePath(indexOrPath);
        focusedPath.value = path;

        if (hasItemSubmenu(item)) {
            openSubmenu(path, false);
        } else {
            closeSubmenusAfter(getParentPath(path));
        }
    }

    function selectFocusedItem() {
        const item = getItemAtPath(focusedPath.value);
        if (!item) return;
        activateItem(item, focusedPath.value);
    }

    function moveFocus(direction: 1 | -1) {
        const menuPath = getParentPath(focusedPath.value);
        const items = getItemsAtPath(menuPath);
        const currentIndex =
            focusedPath.value.length === 0
                ? direction === 1
                    ? -1
                    : items.length
                : focusedPath.value[focusedPath.value.length - 1]!;
        const nextIndex = getNextEnabledIndex(items, currentIndex, direction);

        if (nextIndex === undefined) {
            focusedPath.value = [];
            return;
        }

        focusedPath.value = [...menuPath, nextIndex];
        closeSubmenusAfter(menuPath);
    }

    function onTriggerClick() {
        toggle();
    }

    function onTriggerKeydown(event: KeyboardEvent) {
        if (isDisabled.value) return;

        switch (event.key) {
            case 'Enter':
            case ' ':
            case 'ArrowDown':
                event.preventDefault();
                open();
                break;
            case 'ArrowUp':
                event.preventDefault();
                open({ focus: 'last' });
                break;
            case 'Escape':
                close({ focusTrigger: true });
                break;
        }
    }

    function onMenuKeydown(event: KeyboardEvent) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                moveFocus(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                moveFocus(-1);
                break;
            case 'Home':
                event.preventDefault();
                focusItem('first', getParentPath(focusedPath.value));
                break;
            case 'End':
                event.preventDefault();
                focusItem('last', getParentPath(focusedPath.value));
                break;
            case 'ArrowRight': {
                const item = getItemAtPath(focusedPath.value);
                if (!item || !hasItemSubmenu(item) || item.disabled) break;

                event.preventDefault();
                openSubmenu(focusedPath.value);
                break;
            }
            case 'ArrowLeft':
                if (closeCurrentSubmenu()) event.preventDefault();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                selectFocusedItem();
                break;
            case 'Escape':
                event.preventDefault();
                if (!closeCurrentSubmenu()) close({ focusTrigger: true });
                break;
            case 'Tab':
                close();
                break;
        }
    }

    function getItemProps(
        item: DropdownMenuItem,
        indexOrPath: number | ItemPath,
        focused = isItemFocused(indexOrPath),
        disabled = Boolean(item.disabled),
    ): DropdownMenuItemProps {
        const path = normalizePath(indexOrPath);
        const hasSubmenu = hasItemSubmenu(item);
        const submenuOpen = hasSubmenu && isSubmenuOpen(path);

        return {
            id: getItemId(path),
            type: 'button',
            role: 'menuitem',
            class: getItemClass(item, focused, disabled, hasSubmenu, submenuOpen),
            'aria-controls': hasSubmenu ? getSubmenuId(path) : undefined,
            'aria-expanded': hasSubmenu ? submenuOpen : undefined,
            'aria-haspopup': hasSubmenu ? 'menu' : undefined,
            'aria-disabled': disabled || undefined,
            'data-disabled': disabled || undefined,
            'data-focused': focused || undefined,
            'data-submenu': hasSubmenu || undefined,
            onClick: () => activateItem(item, path),
            onMouseenter: () => focusHoveredItem(item, path),
        };
    }

    function getSubmenuProps(item: DropdownMenuItem, path: ItemPath) {
        return {
            id: getSubmenuId(path),
            role: 'menu' as const,
            class: bem('rp-dropdown-menu__submenu', {
                open: isSubmenuOpen(path),
            }),
            'aria-label': item.label,
            'aria-activedescendant': getMenuActiveDescendant(path),
        };
    }

    function getItemSlotProps(
        item: DropdownMenuItem,
        indexOrPath: number | ItemPath,
        focused = isItemFocused(indexOrPath),
        disabled = Boolean(item.disabled),
    ): DropdownMenuItemSlotProps {
        const path = normalizePath(indexOrPath);
        const hasSubmenu = hasItemSubmenu(item);

        return {
            item,
            index: path[path.length - 1] ?? -1,
            path,
            level: path.length - 1,
            focused,
            disabled,
            hasSubmenu,
            isSubmenuOpen: hasSubmenu && isSubmenuOpen(path),
            select: () => selectItem(item),
            openSubmenu: (focus = DEFAULT_FOCUS_TARGET) => openSubmenu(path, focus),
            closeSubmenu: () => closeSubmenu(path),
            close,
        };
    }

    watch(isDisabled, (disabled) => {
        if (disabled) close();
    });

    watch(isVisible, (visible) => {
        if (visible) {
            if (focusedPath.value.length === 0) focusItem(DEFAULT_FOCUS_TARGET);
            focusMenu();
        } else {
            resetFocus();
        }
    });

    useClickOutside(rootRef, isVisible, () => close());

    return {
        rootRef,
        menuRef,
        menuId,
        isVisible,
        isEmpty,
        visibleItems,
        renderedItems,
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
