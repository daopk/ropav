import { computed, nextTick, onUnmounted, ref, useId, watch } from 'vue';
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
const SAFE_TRIANGLE_PADDING = 8;
const SAFE_TRIANGLE_ORIGIN_OFFSET = 12;
const SAFE_TRIANGLE_TIMEOUT = 500;

type ItemPath = number[];
type SubmenuFocusTarget = DropdownMenuFocusTarget | false;
type PointerPoint = {
    x: number;
    y: number;
};
type SafeTriangle = [PointerPoint, PointerPoint, PointerPoint];
type PendingHover = {
    item: DropdownMenuItem;
    path: ItemPath;
};

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

function getEventPoint(event: MouseEvent): PointerPoint {
    return {
        x: event.clientX,
        y: event.clientY,
    };
}

function getTriangleArea(a: PointerPoint, b: PointerPoint, c: PointerPoint) {
    return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
}

function isPointInTriangle(point: PointerPoint, triangle: SafeTriangle) {
    const [a, b, c] = triangle;
    const area = getTriangleArea(a, b, c);
    const area1 = getTriangleArea(point, b, c);
    const area2 = getTriangleArea(a, point, c);
    const area3 = getTriangleArea(a, b, point);

    return Math.abs(area - (area1 + area2 + area3)) < 0.5;
}

function hasMeasuredRect(rect: DOMRect) {
    return rect.width > 0 || rect.height > 0;
}

function isPointInRect(point: PointerPoint, rect: DOMRect, padding = 0) {
    return (
        point.x >= rect.left - padding &&
        point.x <= rect.right + padding &&
        point.y >= rect.top - padding &&
        point.y <= rect.bottom + padding
    );
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
    const safeTriangleOrigin = ref<PointerPoint | null>(null);
    let latestPointerPoint: PointerPoint | null = null;
    let pendingHover: PendingHover | null = null;
    let pendingHoverTimer: number | undefined;

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

        if (index === undefined) {
            if (menuPath.length === 0) focusedPath.value = [];
            return false;
        }

        focusedPath.value = [...menuPath, index];
        return true;
    }

    function resetFocus() {
        focusedPath.value = [];
        openSubmenuPath.value = [];
        safeTriangleOrigin.value = null;
        latestPointerPoint = null;
        clearPendingHover();
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

    function getItemElement(path: ItemPath) {
        return document.getElementById(getItemId(path));
    }

    function getSubmenuElement(path: ItemPath) {
        return document.getElementById(getSubmenuId(path));
    }

    function isSubmenuOpeningLeft(path: ItemPath) {
        const submenuRect = getSubmenuElement(path)?.getBoundingClientRect();
        const itemRect = getItemElement(path)?.getBoundingClientRect();

        if (submenuRect && itemRect && hasMeasuredRect(submenuRect) && hasMeasuredRect(itemRect)) {
            return submenuRect.right <= itemRect.left;
        }

        return placement.value.endsWith('end');
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
        safeTriangleOrigin.value = null;
        latestPointerPoint = null;
        clearPendingHover();
    }

    function isPointInCurrentSubmenu(point: PointerPoint) {
        if (openSubmenuPath.value.length === 0) return false;

        const submenuRect = getSubmenuElement(openSubmenuPath.value)?.getBoundingClientRect();
        return submenuRect ? isPointInRect(point, submenuRect, SAFE_TRIANGLE_PADDING) : false;
    }

    function getFallbackTriangleOrigin(path: ItemPath): PointerPoint | null {
        const itemRect = getItemElement(path)?.getBoundingClientRect();
        if (!itemRect) return null;

        const submenuRect = getSubmenuElement(path)?.getBoundingClientRect();
        const opensRight = !submenuRect || submenuRect.left >= itemRect.right;
        return {
            x: opensRight ? itemRect.right : itemRect.left,
            y: itemRect.top + itemRect.height / 2,
        };
    }

    function getSafeTriangle(path: ItemPath): SafeTriangle | null {
        const submenuRect = getSubmenuElement(path)?.getBoundingClientRect();
        const itemRect = getItemElement(path)?.getBoundingClientRect();
        const origin = safeTriangleOrigin.value ?? getFallbackTriangleOrigin(path);

        if (!submenuRect || !origin) return null;

        const opensRight = !itemRect || submenuRect.left >= itemRect.right;
        const edgeX = opensRight ? submenuRect.left : submenuRect.right;
        const expandedOrigin = {
            x: origin.x + (opensRight ? -SAFE_TRIANGLE_ORIGIN_OFFSET : SAFE_TRIANGLE_ORIGIN_OFFSET),
            y: origin.y,
        };

        return [
            expandedOrigin,
            {
                x: edgeX,
                y: submenuRect.top - SAFE_TRIANGLE_PADDING,
            },
            {
                x: edgeX,
                y: submenuRect.bottom + SAFE_TRIANGLE_PADDING,
            },
        ];
    }

    function updateSafeTriangleOrigin(point: PointerPoint) {
        if (openSubmenuPath.value.length === 0) return;

        const itemRect = getItemElement(openSubmenuPath.value)?.getBoundingClientRect();
        if (itemRect && isPointInRect(point, itemRect)) {
            safeTriangleOrigin.value = point;
        }
    }

    function shouldDelayHover(path: ItemPath, point: PointerPoint) {
        if (openSubmenuPath.value.length === 0) return false;
        if (arePathsEqual(path, openSubmenuPath.value)) return false;
        if (isPathPrefix(openSubmenuPath.value, path)) return false;
        if (isPointInCurrentSubmenu(point)) return true;

        const triangle = getSafeTriangle(openSubmenuPath.value);
        return triangle ? isPointInTriangle(point, triangle) : false;
    }

    function clearPendingHover() {
        pendingHover = null;
        if (pendingHoverTimer !== undefined) {
            window.clearTimeout(pendingHoverTimer);
            pendingHoverTimer = undefined;
        }
    }

    function commitHoveredItem(item: DropdownMenuItem, path: ItemPath, point?: PointerPoint) {
        clearPendingHover();
        focusedPath.value = path;

        if (hasItemSubmenu(item)) {
            openSubmenu(path, false, point);
        } else {
            closeSubmenusAfter(getParentPath(path));
        }
    }

    function delayHoveredItem(item: DropdownMenuItem, path: ItemPath) {
        pendingHover = {
            item,
            path,
        };

        if (pendingHoverTimer !== undefined) window.clearTimeout(pendingHoverTimer);
        pendingHoverTimer = window.setTimeout(() => {
            if (!pendingHover) return;

            const nextHover = pendingHover;
            if (latestPointerPoint && isPointInCurrentSubmenu(latestPointerPoint)) {
                clearPendingHover();
                return;
            }

            commitHoveredItem(nextHover.item, nextHover.path);
        }, SAFE_TRIANGLE_TIMEOUT);
    }

    function openSubmenu(
        path: ItemPath,
        focus: SubmenuFocusTarget = DEFAULT_FOCUS_TARGET,
        point?: PointerPoint,
    ) {
        const item = getItemAtPath(path);
        if (!item || item.disabled || !hasItemSubmenu(item)) return;

        openSubmenuPath.value = [...path];
        safeTriangleOrigin.value = point ?? getFallbackTriangleOrigin(path);
        clearPendingHover();
        if (focus && !focusItem(focus, path)) focusedPath.value = [...path];
    }

    function closeSubmenu(path: ItemPath) {
        if (!isSubmenuOpen(path)) return;

        openSubmenuPath.value = getParentPath(path);
        safeTriangleOrigin.value = null;
        latestPointerPoint = null;
        clearPendingHover();
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

    function focusHoveredItem(
        item: DropdownMenuItem,
        indexOrPath: number | ItemPath,
        event?: MouseEvent,
    ) {
        if (item.disabled) return;

        const path = normalizePath(indexOrPath);
        const point = event ? getEventPoint(event) : undefined;
        latestPointerPoint = point ?? latestPointerPoint;

        if (point && shouldDelayHover(path, point)) {
            delayHoveredItem(item, path);
            return;
        }

        commitHoveredItem(item, path, point);
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
        clearPendingHover();
        safeTriangleOrigin.value = null;
        latestPointerPoint = null;

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
                if (!closeCurrentSubmenu()) close({ focusTrigger: true });
                break;
            case 'Tab':
                close();
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
        const point = getEventPoint(event);
        latestPointerPoint = point;
        updateSafeTriangleOrigin(point);
        if (!pendingHover) return;

        if (shouldDelayHover(pendingHover.path, point)) return;

        const nextHover = pendingHover;
        commitHoveredItem(nextHover.item, nextHover.path, point);
    }

    function onMenuMouseleave() {
        clearPendingHover();
        safeTriangleOrigin.value = null;
        latestPointerPoint = null;
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
            tabindex: -1,
            class: getItemClass(item, focused, disabled, hasSubmenu, submenuOpen),
            'aria-controls': hasSubmenu ? getSubmenuId(path) : undefined,
            'aria-expanded': hasSubmenu ? submenuOpen : undefined,
            'aria-haspopup': hasSubmenu ? 'menu' : undefined,
            'aria-disabled': disabled || undefined,
            'data-disabled': disabled || undefined,
            'data-focused': focused || undefined,
            'data-submenu': hasSubmenu || undefined,
            onClick: (event) => activateItem(item, path, event),
            onMouseenter: (event) => focusHoveredItem(item, path, event),
        };
    }

    function getSubmenuProps(item: DropdownMenuItem, path: ItemPath) {
        return {
            id: getSubmenuId(path),
            role: 'menu' as const,
            class: bem('rp-dropdown-menu__submenu', {
                open: isSubmenuOpen(path),
                'has-submenu': hasNestedItems(item.children ?? []),
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

    watch(focusedPath, (path) => {
        if (path.length === 0) return;

        const targetPath = [...path];
        nextTick(() => {
            if (!arePathsEqual(targetPath, focusedPath.value)) return;
            getItemElement(targetPath)?.scrollIntoView?.({ block: 'nearest' });
        });
    });

    onUnmounted(clearPendingHover);

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
