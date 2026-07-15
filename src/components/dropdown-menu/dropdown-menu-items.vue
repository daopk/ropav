<template>
    <DropdownMenuItemRow
        v-for="(item, index) in items"
        :key="getItemKey(index, item)"
        :context="context"
        :index="index"
        :item="item"
        :parent-path="parentPath"
    >
        <template #item="slotProps">
            <slot name="item" v-bind="slotProps" />
        </template>
    </DropdownMenuItemRow>
</template>

<script lang="ts" setup vapor>
import DropdownMenuItemRow from './dropdown-menu-item-row.vue';
import { getPathKey, type ItemPath } from './dropdown-menu-utils';
import type { DropdownMenuItem, DropdownMenuItemSlotProps } from './types';
import type { DropdownMenuRenderContext } from './useDropdownMenuRenderItems';

defineOptions({ name: 'RpDropdownMenuItems' });

const props = withDefaults(
    defineProps<{
        context: DropdownMenuRenderContext;
        items: DropdownMenuItem[];
        parentPath?: ItemPath;
    }>(),
    {
        parentPath: () => [],
    },
);

defineSlots<{
    item?(props: DropdownMenuItemSlotProps): unknown;
}>();

function getItemKey(index: number, item: DropdownMenuItem) {
    return `${getPathKey([...props.parentPath, index])}:${String(item.value)}`;
}
</script>
