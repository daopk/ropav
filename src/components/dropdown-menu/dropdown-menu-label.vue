<template>
    <component :is="as" v-bind="rootAttrs">
        <slot />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, useAttrs } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { menuKey } from './dropdownMenuContext';
import type { DropdownMenuLabelPrimitiveProps } from './types';

defineOptions({ name: 'RpDropdownMenuLabel', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuLabelPrimitiveProps>(), {
    as: 'div',
});

const attrs = useAttrs();
useRequiredInject(menuKey, 'RpDropdownMenuLabel');
const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: props.id,
        role: 'presentation',
        class: 'rp-dropdown-menu__group-label',
    }),
);
</script>
