<template>
    <component :is="as" v-bind="rootAttrs" />
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, useAttrs } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { menuKey } from './dropdownMenuContext';
import type { DropdownMenuSeparatorPrimitiveProps } from './types';

defineOptions({ name: 'RpDropdownMenuSeparator', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuSeparatorPrimitiveProps>(), {
    as: 'div',
    orientation: 'horizontal',
});

const attrs = useAttrs();
useRequiredInject(menuKey, 'RpDropdownMenuSeparator');
const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: props.id,
        role: 'separator',
        'aria-orientation': props.orientation,
        class: 'rp-dropdown-menu__separator',
        'data-orientation': props.orientation,
    }),
);
</script>
