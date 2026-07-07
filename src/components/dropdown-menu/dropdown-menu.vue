<template>
    <span ref="rootRef" :class="rootClass">
        <slot v-bind="slotProps" />

        <Transition name="rp-dropdown-menu-content">
            <div
                v-if="isVisible"
                ref="menuRef"
                class="rp-dropdown-menu__content"
                v-bind="contentProps"
            >
                <div v-if="isEmpty" class="rp-dropdown-menu__empty">
                    <slot name="empty">No actions</slot>
                </div>

                <button
                    v-for="renderedItem in renderedItems"
                    :key="renderedItem.key"
                    v-bind="renderedItem.props"
                >
                    <slot name="item" v-bind="renderedItem.slotProps">
                        <span class="rp-dropdown-menu__label">{{ renderedItem.item.label }}</span>
                        <kbd v-if="renderedItem.item.shortcut" class="rp-dropdown-menu__shortcut">
                            {{ renderedItem.item.shortcut }}
                        </kbd>
                    </slot>
                </button>
            </div>
        </Transition>
    </span>
</template>

<script lang="ts" setup vapor>
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

const { rootRef, menuRef, isVisible, isEmpty, renderedItems, rootClass, contentProps, slotProps } =
    useDropdownMenu(props, {
        openChange: (open) => emit('update:open', open),
        select: (item) => emit('select', item),
    });

void rootRef;
void menuRef;
</script>

<style src="./dropdown-menu.scss" lang="scss" scoped></style>
