<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :focused="focused" :disabled="isDisabled" :select="select" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, provide, ref, useAttrs } from 'vue';
import { bem } from '@/utils/bem';
import { checkedKey, optionalAttr, usePrimitiveItem } from './dropdown-menu-primitive-core';
import type {
    DropdownMenuCheckedState,
    DropdownMenuCheckboxItemPrimitiveProps,
    DropdownMenuItemPrimitiveSlotProps,
    DropdownMenuSelectEvent,
} from './types';

defineOptions({ name: 'RpDropdownMenuCheckboxItem', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuCheckboxItemPrimitiveProps>(), {
    as: 'button',
    modelValue: undefined,
    defaultValue: false,
    disabled: false,
    destructive: false,
    closeOnSelect: false,
});

const emit = defineEmits<{
    select: [event: DropdownMenuSelectEvent];
    'update:modelValue': [value: DropdownMenuCheckedState];
}>();

defineSlots<{
    default?(props: DropdownMenuItemPrimitiveSlotProps): unknown;
}>();

const attrs = useAttrs();
const uncontrolled = ref<DropdownMenuCheckedState>(props.defaultValue);
const value = computed(() => props.modelValue ?? uncontrolled.value);
const checked = computed<boolean | 'mixed'>(() =>
    value.value === 'indeterminate' ? 'mixed' : value.value,
);
const state = computed<'checked' | 'unchecked' | 'indeterminate'>(() =>
    value.value === 'indeterminate' ? 'indeterminate' : value.value ? 'checked' : 'unchecked',
);

function toggleChecked() {
    const nextValue = value.value === 'indeterminate' ? true : !value.value;
    if (props.modelValue === undefined) uncontrolled.value = nextValue;
    emit('update:modelValue', nextValue);
}

provide(checkedKey, {
    state,
    checked: computed(() => value.value !== false),
});

const { id, isDisabled, focused, activate, select, setElement, onPointerenter } = usePrimitiveItem(
    'RpDropdownMenuCheckboxItem',
    props,
    (event) => emit('select', event),
    {
        checked,
        defaultCloseOnSelect: false,
        afterSelect: toggleChecked,
    },
);

function onClick(event: MouseEvent) {
    if (!event.defaultPrevented) activate(event);
}

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: id.value,
        type: props.as === 'button' ? 'button' : undefined,
        role: 'menuitemcheckbox',
        tabindex: -1,
        disabled: props.as === 'button' ? optionalAttr(isDisabled.value) : undefined,
        'aria-disabled': optionalAttr(isDisabled.value),
        'aria-checked': checked.value,
        'data-disabled': optionalAttr(isDisabled.value),
        'data-focused': optionalAttr(focused.value),
        'data-highlighted': optionalAttr(focused.value),
        'data-state': state.value,
        class: bem('rp-dropdown-menu__item', {
            focused: focused.value,
            disabled: isDisabled.value,
            destructive: props.destructive,
        }),
        onClick,
        onMouseenter: onPointerenter,
    }),
);
</script>
