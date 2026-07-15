<template>
    <component v-if="forceMount || context.checked.value" :is="as" v-bind="rootAttrs">
        <slot :state="context.state.value" :checked="context.checked.value" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, useAttrs } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { checkedKey } from './dropdown-menu-primitive-core';
import type { DropdownMenuItemIndicatorPrimitiveProps } from './types';

defineOptions({ name: 'RpDropdownMenuItemIndicator', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuItemIndicatorPrimitiveProps>(), {
    as: 'span',
    forceMount: false,
});

defineSlots<{
    default?(props: {
        state: 'checked' | 'unchecked' | 'indeterminate';
        checked: boolean;
    }): unknown;
}>();

const attrs = useAttrs();
const context = useRequiredInject(checkedKey, 'RpDropdownMenuItemIndicator');
const rootAttrs = computed(() =>
    mergeProps(attrs, {
        class: 'rp-dropdown-menu__indicator',
        'data-state': context.state.value,
        'aria-hidden': true,
    }),
);
</script>
