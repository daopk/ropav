<template>
    <component :is="as" v-bind="rootAttrs">
        <slot :value="value" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, provide, useAttrs } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { menuKey, radioGroupKey } from './dropdownMenuContext';
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
const controllable = useControllableValue<DropdownMenuItemValue | null>({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange: (value) => {
        if (value !== null) emit('update:modelValue', value);
    },
});
const value = controllable.value;

function select(nextValue: DropdownMenuItemValue) {
    if (value.value === nextValue) return;
    controllable.setValue(nextValue);
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
