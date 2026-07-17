<template>
    <div class="rp-dropdown-menu__item-wrap" role="none">
        <button ref="itemElement" v-bind="publicItemProps">
            <slot name="item" v-bind="slotProps" />
        </button>

        <div
            v-if="hasSubmenu && submenuOpen"
            ref="submenuElement"
            v-bind="publicSubmenuProps"
            data-state="open"
            :data-placement="actualPlacement"
            :data-side="placementSide"
        >
            <DropdownMenuItemRow
                v-for="(child, childIndex) in item.children ?? []"
                :key="getChildKey(childIndex, child)"
                :context="context"
                :index="childIndex"
                :item="child"
                :parent-path="path"
            >
                <template #item="childSlotProps">
                    <slot name="item" v-bind="childSlotProps" />
                </template>
            </DropdownMenuItemRow>
        </div>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref } from 'vue';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import { getPathKey, hasItemSubmenu, type ItemPath } from './dropdown-menu-utils';
import type { DropdownMenuItem, DropdownMenuItemSlotProps } from './types';
import type { DropdownMenuRenderContext } from './useDropdownMenuRenderItems';

defineOptions({ name: 'RpDropdownMenuItemRow' });

const props = defineProps<{
    context: DropdownMenuRenderContext;
    index: number;
    item: DropdownMenuItem;
    parentPath: ItemPath;
}>();

defineSlots<{
    item?(props: DropdownMenuItemSlotProps): unknown;
}>();

const path = computed<ItemPath>(() => [...props.parentPath, props.index]);
const hasSubmenu = computed(() => hasItemSubmenu(props.item));
const focused = computed(() => props.context.isItemFocused(path.value));
const disabled = computed(() => Boolean(props.item.disabled));
const submenuOpen = computed(() => hasSubmenu.value && props.context.isSubmenuOpen(path.value));
const itemProps = computed(() =>
    props.context.getItemProps(
        props.item,
        path.value,
        focused.value,
        disabled.value,
        submenuOpen.value,
    ),
);
const publicItemProps = computed(() => ({
    ...itemProps.value,
    ...props.context.getPublicPartAttrs?.('item', {
        class: itemProps.value.class,
    }),
}));
const slotProps = computed(() =>
    props.context.getItemSlotProps(
        props.item,
        path.value,
        focused.value,
        disabled.value,
        submenuOpen.value,
    ),
);

const itemElement = ref<HTMLElement | null>(null);
const submenuElement = ref<HTMLElement | null>(null);
const { actualPlacement, floatingStyle } = useFloatingPosition({
    reference: itemElement,
    floating: submenuElement,
    open: submenuOpen,
    placement: props.context.getSubmenuPlacement,
    strategy: props.context.getStrategy,
    offset: () => 4,
    flip: props.context.getFlip,
    flipOptions: props.context.getFlipOptions,
    shift: props.context.getShift,
    collisionPadding: props.context.getCollisionPadding,
    autoUpdateOptions: props.context.getAutoUpdateOptions,
});
const submenuProps = computed(() => props.context.getSubmenuProps(props.item, path.value, true));
const publicSubmenuProps = computed(() => ({
    ...submenuProps.value,
    ...props.context.getPublicPartAttrs?.('submenu', {
        class: submenuProps.value.class,
        style: floatingStyle.value,
    }),
}));
const placementSide = computed(() => actualPlacement.value.split('-')[0]);

function getChildKey(index: number, child: DropdownMenuItem) {
    return `${getPathKey([...path.value, index])}:${String(child.value)}`;
}

void itemElement;
void submenuElement;
</script>
