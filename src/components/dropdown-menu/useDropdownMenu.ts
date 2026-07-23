import {
    computed,
    nextTick,
    onBeforeUnmount,
    ref,
    shallowRef,
    useId,
    watch,
    type CSSProperties,
    type Ref,
} from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useOverlayLayer } from '@/internal/composables/useOverlayLayer';
import { bem } from '@/utils/bem';
import { isElement } from '@/utils/dom/query';
import { hasMeasuredRect, type Point } from '@/utils/geometry';
import { getPathKey, normalizePath } from '@/utils/indexPath';
import { useFloatingTarget } from '../floating/useFloatingPosition';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
import { useOverlayZIndex } from '../overlay/useOverlayZIndex';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuContentProps,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuItem,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
    DropdownMenuSlotProps,
    DropdownMenuTriggerProps,
} from './types';
import {
    DEFAULT_FOCUS_TARGET,
    DEFAULT_PLACEMENT,
    hasItemSubmenu,
    hasNestedItems,
    type ItemPath,
    type SubmenuFocusTarget,
} from './dropdown-menu-model';
import { useDropdownMenuHoverIntent } from './useDropdownMenuHoverIntent';
import { useDropdownMenuInteraction } from './dropdownMenuInteraction';
import { useDropdownMenuPortalPosition } from './useDropdownMenuPortalPosition';
import { useDropdownMenuRenderItems } from './useDropdownMenuRenderItems';

interface DropdownMenuDataRegistrationIndex {
    itemIdByPath: ReadonlyMap<string, string>;
    pathByItemId: ReadonlyMap<string, ItemPath>;
    menuIdByPath: ReadonlyMap<string, string>;
    pathByMenuId: ReadonlyMap<string, ItemPath>;
    primaryItemId: WeakMap<DropdownMenuItem, string>;
    registeredItemIds: ReadonlySet<string>;
    registeredMenuIds: ReadonlySet<string>;
}

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

    const interaction = useDropdownMenuInteraction({
        rootMenuId: interactionRootMenuId,
        isOpen: isVisible,
        disabled: isDisabled,
        modal,
        setOpen,
        isTopLayer: layer.isTopLayer,
        focusTrigger,
        beforeOpen: () => hoverIntent.resetHoverIntent(),
        beforeClose: () => hoverIntent.resetHoverIntent(),
    });
    const open = interaction.open;
    const close = (options: DropdownMenuCloseOptions = {}) => interaction.close(options);
    const toggle = interaction.toggle;

    const openMenuIds = ref(new Set<string>());
    const itemIdentity = new WeakMap<DropdownMenuItem, string>();
    let nextItemIdentity = 0;
    const registrationIndex = shallowRef<DropdownMenuDataRegistrationIndex>({
        itemIdByPath: new Map(),
        pathByItemId: new Map(),
        menuIdByPath: new Map([['root', interactionRootMenuId]]),
        pathByMenuId: new Map([[interactionRootMenuId, []]]),
        primaryItemId: new WeakMap(),
        registeredItemIds: new Set(),
        registeredMenuIds: new Set(),
    });

    function getStableItemId(item: DropdownMenuItem) {
        const existing = itemIdentity.get(item);
        if (existing) return existing;
        nextItemIdentity += 1;
        const id = `${interactionRootMenuId}-item-${nextItemIdentity}`;
        itemIdentity.set(item, id);
        return id;
    }

    function getItemId(path: ItemPath) {
        return `${menuId.value}-item-${getPathKey(path)}`;
    }

    function getSubmenuId(path: ItemPath) {
        return `${menuId.value}-submenu-${getPathKey(path)}`;
    }

    function getItemElement(path: ItemPath) {
        return typeof document === 'undefined' ? null : document.getElementById(getItemId(path));
    }

    function getSubmenuElement(path: ItemPath) {
        return typeof document === 'undefined' ? null : document.getElementById(getSubmenuId(path));
    }

    function isSubmenuOpeningLeft(path: ItemPath) {
        const submenuRect = getSubmenuElement(path)?.getBoundingClientRect();
        const itemRect = getItemElement(path)?.getBoundingClientRect();
        if (submenuRect && itemRect && hasMeasuredRect(submenuRect) && hasMeasuredRect(itemRect)) {
            return submenuRect.right <= itemRect.left;
        }
        return actualPlacement.value.endsWith('end');
    }

    function setDataMenuOpen(id: string, openState: boolean) {
        const next = new Set(openMenuIds.value);
        if (openState) next.add(id);
        else next.delete(id);
        openMenuIds.value = next;
    }

    const cleanupRootMenu = interaction.registerMenu({
        id: interactionRootMenuId,
        element: () => menuRef.value,
        placement: () => actualPlacement.value,
        isOpen: () => isVisible.value,
    });

    const collectionState = computed(() => {
        const state: unknown[] = [];
        function collect(items: DropdownMenuItem[]) {
            state.push(items.length);
            for (const item of items) {
                const children = item.children;
                state.push(item, Boolean(item.disabled), children);
                if (children) collect(children);
            }
        }
        collect(visibleItems.value);
        return state;
    });

    watch(
        collectionState,
        () => {
            const nextItemIdByPath = new Map<string, string>();
            const nextPathByItemId = new Map<string, ItemPath>();
            const nextMenuIdByPath = new Map<string, string>([['root', interactionRootMenuId]]);
            const nextPathByMenuId = new Map<string, ItemPath>([[interactionRootMenuId, []]]);
            const nextPrimaryItemId = new WeakMap<DropdownMenuItem, string>();
            const nextRegisteredItems = new Set<string>();
            const nextRegisteredMenus = new Set<string>();
            const seenObjects = new Map<DropdownMenuItem, number>();

            function registerItems(
                items: DropdownMenuItem[],
                menuPath: ItemPath,
                ownerMenuId: string,
            ) {
                for (const [index, item] of items.entries()) {
                    const path = [...menuPath, index];
                    const pathKey = getPathKey(path);
                    const occurrence = seenObjects.get(item) ?? 0;
                    seenObjects.set(item, occurrence + 1);
                    const baseId = getStableItemId(item);
                    const itemId = occurrence === 0 ? baseId : `${baseId}-copy-${occurrence}`;
                    const submenuMenuId = hasItemSubmenu(item) ? `${itemId}-menu` : undefined;

                    nextItemIdByPath.set(pathKey, itemId);
                    nextPathByItemId.set(itemId, path);
                    if (occurrence === 0) nextPrimaryItemId.set(item, itemId);
                    nextRegisteredItems.add(itemId);

                    if (submenuMenuId) {
                        nextMenuIdByPath.set(pathKey, submenuMenuId);
                        nextPathByMenuId.set(submenuMenuId, path);
                        nextRegisteredMenus.add(submenuMenuId);
                        interaction.registerMenu({
                            id: submenuMenuId,
                            parentItemId: () => itemId,
                            element: () => getSubmenuElement(nextPathByItemId.get(itemId) ?? path),
                            focusTarget: () => menuRef.value,
                            placement: () => {
                                const currentPath = nextPathByItemId.get(itemId) ?? path;
                                const value = getSubmenuElement(currentPath)?.dataset.placement;
                                return (value as typeof actualPlacement.value) ?? 'right-start';
                            },
                            isOpen: () => openMenuIds.value.has(submenuMenuId),
                            setOpen: (openState) => setDataMenuOpen(submenuMenuId, openState),
                        });
                    }

                    interaction.registerItem({
                        id: itemId,
                        menuId: ownerMenuId,
                        element: () => getItemElement(nextPathByItemId.get(itemId) ?? path),
                        textValue: () => item.label,
                        disabled: () => Boolean(item.disabled || props.disabled),
                        order: () => index,
                        submenuId: () => submenuMenuId,
                        submenuDirection: () =>
                            isSubmenuOpeningLeft(nextPathByItemId.get(itemId) ?? path)
                                ? 'left'
                                : 'right',
                        select(originalEvent) {
                            const event = new CustomEvent('dropdown-menu-select', {
                                cancelable: true,
                                detail: {
                                    originalEvent,
                                    value: item.value,
                                },
                            }) as DropdownMenuSelectEvent;
                            emit.select?.(item, event);
                            return event;
                        },
                        closeOnSelect: () => props.closeOnSelect !== false,
                    });

                    if (submenuMenuId) {
                        registerItems(item.children ?? [], path, submenuMenuId);
                    }
                }
            }

            registerItems(visibleItems.value, [], interactionRootMenuId);

            for (const id of registrationIndex.value.registeredItemIds) {
                if (!nextRegisteredItems.has(id)) interaction.unregisterItem(id);
            }
            for (const id of registrationIndex.value.registeredMenuIds) {
                if (!nextRegisteredMenus.has(id)) {
                    interaction.unregisterMenu(id);
                    setDataMenuOpen(id, false);
                }
            }

            registrationIndex.value = {
                itemIdByPath: nextItemIdByPath,
                pathByItemId: nextPathByItemId,
                menuIdByPath: nextMenuIdByPath,
                pathByMenuId: nextPathByMenuId,
                primaryItemId: nextPrimaryItemId,
                registeredItemIds: nextRegisteredItems,
                registeredMenuIds: nextRegisteredMenus,
            };
            interaction.reconcile();
        },
        { immediate: true },
    );

    const focusedPath: Ref<ItemPath> = computed<ItemPath>({
        get() {
            const id = interaction.activeItemId.value;
            return id ? [...(registrationIndex.value.pathByItemId.get(id) ?? [])] : [];
        },
        set(path) {
            const itemId = path.length > 0 ? getDataItemId(path) : null;
            interaction.setActive(itemId ?? null);
        },
    });
    const focusedIndex = computed(() => focusedPath.value[0] ?? -1);
    const activeDescendantId = computed(() =>
        focusedPath.value.length === 0 ? undefined : getItemId(focusedPath.value),
    );
    const openSubmenuPath = computed<ItemPath>(() => {
        let deepest: ItemPath = [];
        for (const id of openMenuIds.value) {
            const path = registrationIndex.value.pathByMenuId.get(id);
            if (path && path.length > deepest.length) deepest = path;
        }
        return [...deepest];
    });

    function getMenuId(path: ItemPath) {
        return registrationIndex.value.menuIdByPath.get(getPathKey(path)) ?? interactionRootMenuId;
    }

    function getDataItemId(path: ItemPath) {
        return registrationIndex.value.itemIdByPath.get(getPathKey(path));
    }

    function isItemFocused(indexOrPath: number | ItemPath) {
        const id = getDataItemId(normalizePath(indexOrPath));
        return Boolean(id && interaction.activeItemId.value === id);
    }

    function isSubmenuOpen(path: ItemPath) {
        const itemId = getDataItemId(path);
        const submenuId = itemId ? interaction.getItem(itemId)?.submenuId?.() : undefined;
        return Boolean(submenuId && interaction.isMenuOpen(submenuId));
    }

    function openSubmenu(
        path: ItemPath,
        focus: SubmenuFocusTarget = DEFAULT_FOCUS_TARGET,
        point?: Point,
    ) {
        const itemId = getDataItemId(path);
        const submenuId = itemId ? interaction.getItem(itemId)?.submenuId?.() : undefined;
        if (!submenuId || !interaction.openMenu(submenuId, focus)) return false;
        hoverIntent.trackSubmenuOpen(path, point);
        return true;
    }

    function closeSubmenu(path: ItemPath) {
        const itemId = getDataItemId(path);
        const submenuId = itemId ? interaction.getItem(itemId)?.submenuId?.() : undefined;
        const closed = submenuId ? interaction.closeMenu(submenuId, false) : false;
        if (closed) hoverIntent.resetHoverIntent();
        return closed;
    }

    function commitHoveredItem(item: DropdownMenuItem, path: ItemPath, point?: Point) {
        const itemId = getDataItemId(path);
        const itemRegistration = itemId ? interaction.getItem(itemId) : undefined;
        if (!itemRegistration) return;
        hoverIntent.clearPendingHover();
        interaction.setActive(itemRegistration.id);
        if (hasItemSubmenu(item)) openSubmenu(path, false, point);
        else interaction.closeSubmenus(itemRegistration.menuId);
    }

    const hoverIntent = useDropdownMenuHoverIntent({
        openSubmenuPath,
        getItemElement,
        getSubmenuElement,
    });

    function focusHoveredItem(
        item: DropdownMenuItem,
        indexOrPath: number | ItemPath,
        event?: MouseEvent,
    ) {
        if (item.disabled) return;
        const path = normalizePath(indexOrPath);
        hoverIntent.handleItemHover(item, path, event, commitHoveredItem);
    }

    function onMenuMousemove(event: MouseEvent) {
        hoverIntent.handleMenuMousemove(event, commitHoveredItem);
    }

    function selectItem(item: DropdownMenuItem, originalEvent: Event = new Event('select')) {
        const id = registrationIndex.value.primaryItemId.get(item);
        if (id) interaction.selectItem(id, originalEvent);
    }

    function activateItem(
        _item: DropdownMenuItem,
        path: ItemPath,
        event?: MouseEvent | KeyboardEvent,
    ) {
        const id = getDataItemId(path);
        if (id) interaction.activateItem(id, event);
    }

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

            const submenuOpensLeft =
                activeItem?.submenuDirection?.() === 'left' ||
                interaction.getMenu(openSubmenuId)?.placement().startsWith('left');
            const closeKey = submenuOpensLeft ? 'ArrowRight' : 'ArrowLeft';
            if (event.key === closeKey) return openSubmenuId;
        }

        if (
            ['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key) &&
            interaction.activeMenuId.value !== interactionRootMenuId
        ) {
            return interaction.activeMenuId.value;
        }
        return activeItem?.menuId ?? interaction.activeMenuId.value;
    }
    function onMenuKeydown(event: KeyboardEvent) {
        hoverIntent.resetHoverIntent();
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
        onMouseleave: hoverIntent.resetHoverIntent,
    }));
    const slotProps = computed<DropdownMenuSlotProps>(() => ({
        triggerProps: triggerProps.value,
        isOpen: isVisible.value,
        open,
        close,
        toggle,
    }));

    function getMenuActiveDescendant(path: ItemPath) {
        const activeId = interaction.getActiveId(getMenuId(path)).value;
        const activePath = activeId
            ? registrationIndex.value.pathByItemId.get(activeId)
            : undefined;
        return activePath ? getItemId(activePath) : undefined;
    }

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

    function watchInside<ElementType extends Element>(source: Readonly<Ref<ElementType | null>>) {
        watch(
            source,
            (element, previous) => {
                if (previous) interaction.unregisterInside(previous);
                if (element) interaction.registerInside(element);
            },
            { immediate: true },
        );
    }
    watchInside(rootRef);
    watchInside(menuRef);
    watchInside(targetElement);

    const cleanupDismissal = interaction.registerDismissal({
        ignoredTargets: () => props.ignore ?? [],
        pointerDownOutside: emit.pointerDownOutside,
        focusOutside: emit.focusOutside,
        interactOutside: emit.interactOutside,
    });

    watch(
        [isExplicitTarget, targetElement],
        ([explicit, target], _previous, onCleanup) => {
            if (!explicit || !target) return;
            const onClick = () => interaction.onTriggerClick();
            const onKeydown = (event: KeyboardEvent) => interaction.onTriggerKeydown(event);
            target.addEventListener('click', onClick);
            target.addEventListener('keydown', onKeydown as EventListener);
            onCleanup(() => {
                target.removeEventListener('click', onClick);
                target.removeEventListener('keydown', onKeydown as EventListener);
            });
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

    onBeforeUnmount(() => {
        cleanupDismissal();
        cleanupRootMenu();
    });

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
        onTriggerKeydown: (event: KeyboardEvent) => interaction.onTriggerKeydown(event),
        onMenuKeydown,
        getItemProps,
        getItemSlotProps,
    };
}
