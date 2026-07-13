<template>
    <span ref="rootRef" :class="rootClass">
        <slot v-bind="slotProps" />

        <Transition name="rp-dropdown-menu-content">
            <div v-if="isVisible" ref="menuRef" :class="contentClass" v-bind="contentProps">
                <div v-if="isEmpty" class="rp-dropdown-menu__empty">
                    <slot name="empty">No actions</slot>
                </div>

                <DropdownMenuItems :items="visibleItems" :context="renderContext">
                    <template #item="itemSlotProps">
                        <slot name="item" v-bind="itemSlotProps">
                            <span class="rp-dropdown-menu__label">{{
                                itemSlotProps.item.label
                            }}</span>
                            <kbd
                                v-if="itemSlotProps.item.shortcut"
                                class="rp-dropdown-menu__shortcut"
                            >
                                {{ itemSlotProps.item.shortcut }}
                            </kbd>
                        </slot>
                        <span
                            v-if="itemSlotProps.hasSubmenu"
                            class="rp-dropdown-menu__submenu-icon"
                            aria-hidden="true"
                        >
                            <IconChevronRight />
                        </span>
                    </template>
                </DropdownMenuItems>
            </div>
        </Transition>
    </span>
</template>

<script lang="ts" setup vapor>
import IconChevronRight from '~icons/lucide/chevron-right';
import DropdownMenuItems from './dropdown-menu-items';
import { useDropdownMenu } from './useDropdownMenu';
import type {
    DropdownMenuItem,
    DropdownMenuItemSlotProps,
    DropdownMenuProps,
    DropdownMenuSlotProps,
} from './types';

defineOptions({ name: 'RpDropdownMenu' });

const props = withDefaults(defineProps<DropdownMenuProps>(), {
    items: () => [],
    placement: 'bottom-start',
    open: undefined,
    disabled: false,
    closeOnSelect: true,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
    select: [item: DropdownMenuItem];
}>();

defineSlots<{
    default(props: DropdownMenuSlotProps): unknown;
    item?(props: DropdownMenuItemSlotProps): unknown;
    empty?(): unknown;
}>();

const {
    rootRef,
    menuRef,
    isVisible,
    isEmpty,
    visibleItems,
    renderContext,
    rootClass,
    contentClass,
    contentProps,
    slotProps,
} = useDropdownMenu(props, {
    openChange: (open) => emit('update:open', open),
    select: (item) => emit('select', item),
});

void rootRef;
void menuRef;
</script>

<style src="./dropdown-menu.scss" lang="scss"></style>
