import { computed, nextTick, ref, useId, watch } from 'vue';
import { useClickOutside } from '@/composables/useClickOutside';
import { useListNavigation } from '@/composables/useListNavigation';
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

function getOpenFocusTarget(
    options: DropdownMenuOpenOptions | DropdownMenuFocusTarget | undefined,
) {
    if (typeof options === 'string') return options;
    return options?.focus ?? DEFAULT_FOCUS_TARGET;
}

function getItemClass(item: DropdownMenuItem, focused: boolean, disabled: boolean) {
    return bem('rp-dropdown-menu__item', {
        focused,
        disabled,
        destructive: item.destructive,
    });
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

    const generatedId = useId();
    const menuId = computed(() => props.id ?? `${generatedId}-menu`);
    const placement = computed(() => props.placement ?? DEFAULT_PLACEMENT);
    const visibleItems = computed(() => props.items ?? []);
    const isDisabled = computed(() => Boolean(props.disabled));
    const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
    const isVisible = computed(() => isOpen.value && !isDisabled.value);

    const navigation = useListNavigation<DropdownMenuItem>({
        items: () => visibleItems.value,
    });

    const focusedIndex = navigation.focusedIndex;
    const activeDescendantId = computed(() =>
        focusedIndex.value < 0 ? undefined : `${menuId.value}-item-${focusedIndex.value}`,
    );

    const isEmpty = computed(() => visibleItems.value.length === 0);

    const rootClass = computed(() =>
        bem('rp-dropdown-menu', {
            [`placement-${placement.value}`]: true,
            open: isVisible.value,
            disabled: isDisabled.value,
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
        visibleItems.value.map((item, index) => {
            const focused = isItemFocused(index);
            const disabled = Boolean(item.disabled);

            return {
                item,
                index,
                key: item.value,
                focused,
                disabled,
                props: getItemProps(item, index, focused, disabled),
                slotProps: getItemSlotProps(item, index, focused, disabled),
            };
        }),
    );

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

    function focusItem(target: DropdownMenuFocusTarget) {
        if (target === 'last') navigation.focusLast();
        else navigation.focusFirst();
    }

    function open(options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) {
        if (isDisabled.value) return;

        setOpen(true);
        focusItem(getOpenFocusTarget(options));
        focusMenu();
    }

    function close(options: DropdownMenuCloseOptions = {}) {
        setOpen(false);
        navigation.resetFocus();
        if (options.focusTrigger) focusTrigger();
    }

    function toggle() {
        if (isVisible.value) {
            close({ focusTrigger: true });
        } else {
            open();
        }
    }

    function selectItem(item: DropdownMenuItem) {
        if (item.disabled) return;

        emit.select?.(item);
        if (props.closeOnSelect !== false) {
            close({ focusTrigger: true });
        }
    }

    function isItemFocused(index: number) {
        return index === focusedIndex.value;
    }

    function getItemId(index: number) {
        return `${menuId.value}-item-${index}`;
    }

    function focusHoveredItem(item: DropdownMenuItem, index: number) {
        if (!item.disabled) focusedIndex.value = index;
    }

    function selectFocusedItem() {
        const item = visibleItems.value[focusedIndex.value];
        if (!item) return;
        selectItem(item);
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
                navigation.moveFocus(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                navigation.moveFocus(-1);
                break;
            case 'Home':
                event.preventDefault();
                navigation.focusFirst();
                break;
            case 'End':
                event.preventDefault();
                navigation.focusLast();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                selectFocusedItem();
                break;
            case 'Escape':
                event.preventDefault();
                close({ focusTrigger: true });
                break;
            case 'Tab':
                close();
                break;
        }
    }

    function getItemProps(
        item: DropdownMenuItem,
        index: number,
        focused = isItemFocused(index),
        disabled = Boolean(item.disabled),
    ): DropdownMenuItemProps {
        return {
            id: getItemId(index),
            type: 'button',
            role: 'menuitem',
            class: getItemClass(item, focused, disabled),
            'aria-disabled': disabled || undefined,
            'data-disabled': disabled || undefined,
            'data-focused': focused || undefined,
            onClick: () => selectItem(item),
            onMouseenter: () => focusHoveredItem(item, index),
        };
    }

    function getItemSlotProps(
        item: DropdownMenuItem,
        index: number,
        focused = isItemFocused(index),
        disabled = Boolean(item.disabled),
    ): DropdownMenuItemSlotProps {
        return {
            item,
            index,
            focused,
            disabled,
            select: () => selectItem(item),
            close,
        };
    }

    watch(isDisabled, (disabled) => {
        if (disabled) close();
    });

    watch(isVisible, (visible) => {
        if (visible) {
            if (focusedIndex.value < 0) navigation.focusFirst();
            focusMenu();
        } else {
            navigation.resetFocus();
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
        activeDescendantId,
        rootClass,
        triggerProps,
        contentProps,
        slotProps,
        open,
        close,
        toggle,
        selectItem,
        onItemMouseenter: focusHoveredItem,
        onTriggerKeydown,
        onMenuKeydown,
        getItemProps,
        getItemSlotProps,
    };
}
