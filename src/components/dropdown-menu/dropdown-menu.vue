<template>
    <span ref="rootRef" :class="rootClass">
        <slot v-bind="slotProps" />

        <Teleport :to="portalTo" :disabled="!portal">
            <Transition name="rp-dropdown-menu-content">
                <div
                    v-if="isVisible"
                    ref="menuRef"
                    :class="contentClass"
                    :style="contentStyle"
                    v-bind="contentProps"
                >
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
        </Teleport>
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
    DropdownMenuSelectEvent,
    DropdownMenuSlotProps,
} from './types';

defineOptions({ name: 'RpDropdownMenu' });

const props = withDefaults(defineProps<DropdownMenuProps>(), {
    items: () => [],
    placement: 'bottom-start',
    open: undefined,
    disabled: false,
    closeOnSelect: true,
    modal: false,
    portal: false,
    portalTo: 'body',
});

const emit = defineEmits<{
    'update:open': [value: boolean];
    select: [item: DropdownMenuItem, event: DropdownMenuSelectEvent];
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
    contentStyle,
    contentProps,
    slotProps,
} = useDropdownMenu(props, {
    openChange: (open) => emit('update:open', open),
    select: (item, event) => emit('select', item, event),
});

void rootRef;
void menuRef;
</script>

<style src="./dropdown-menu.scss" lang="scss"></style>
