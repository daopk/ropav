<template>
    <component :is="as" v-bind="rootAttrs">
        <slot :value="value" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, provide, ref, useAttrs } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { menuKey, radioGroupKey } from './dropdown-menu-primitive-core';
import type { DropdownMenuItemValue, DropdownMenuRadioGroupPrimitiveProps } from './types';

defineOptions({ name: 'RpDropdownMenuRadioGroup', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuRadioGroupPrimitiveProps>(), {
    as: 'div',
    modelValue: undefined,
    defaultValue: null,
});

const emit = defineEmits<{
    'update:modelValue': [value: DropdownMenuItemValue];
}>();

defineSlots<{
    default?(props: { value: DropdownMenuItemValue | null }): unknown;
}>();

const attrs = useAttrs();
useRequiredInject(menuKey, 'RpDropdownMenuRadioGroup');
const uncontrolled = ref<DropdownMenuItemValue | null>(props.defaultValue);
const value = computed(() =>
    props.modelValue === undefined ? uncontrolled.value : props.modelValue,
);

function select(nextValue: DropdownMenuItemValue) {
    if (value.value === nextValue) return;
    if (props.modelValue === undefined) uncontrolled.value = nextValue;
    emit('update:modelValue', nextValue);
}

provide(radioGroupKey, { value, select });

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: props.id,
        role: 'group',
        class: 'rp-dropdown-menu__radio-group',
        'aria-label': props.ariaLabel,
        'aria-labelledby': props.ariaLabelledby,
    }),
);
</script>
