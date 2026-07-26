<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :is-open="isOpen" />
    </component>
</template>

<script lang="ts" setup vapor>
import type { DropdownMenuContextTriggerPrimitiveProps } from './types';
import { useDropdownMenuContextTrigger } from './useDropdownMenuContextTrigger';

defineOptions({ name: 'RpDropdownMenuContextTrigger', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuContextTriggerPrimitiveProps>(), {
    as: 'span',
    disabled: false,
    longPressDelay: 700,
    longPressTolerance: 10,
});

defineSlots<{
    default?(props: { isOpen: boolean }): unknown;
}>();

const { isOpen, rootAttrs, setElement } = useDropdownMenuContextTrigger(props);
</script>
