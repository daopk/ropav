<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :focused="focused" :disabled="isDisabled" :select="select" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, provide, useAttrs } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { toOptionalAttribute } from '@/utils/attributes';
import { bem } from '@/utils/bem';
import { checkedKey, usePrimitiveItem } from './dropdownMenuContext';
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
const controllable = useControllableValue<DropdownMenuCheckedState>({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange: (value) => emit('update:modelValue', value),
});
const value = controllable.value;
const checked = computed<boolean | 'mixed'>(() =>
    value.value === 'indeterminate' ? 'mixed' : value.value,
);
const state = computed<'checked' | 'unchecked' | 'indeterminate'>(() =>
    value.value === 'indeterminate' ? 'indeterminate' : value.value ? 'checked' : 'unchecked',
);

function toggleChecked() {
    const nextValue = value.value === 'indeterminate' ? true : !value.value;
    controllable.setValue(nextValue);
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
        disabled: props.as === 'button' ? toOptionalAttribute(isDisabled.value) : undefined,
        'aria-disabled': toOptionalAttribute(isDisabled.value),
        'aria-checked': checked.value,
        'data-disabled': toOptionalAttribute(isDisabled.value),
        'data-focused': toOptionalAttribute(focused.value),
        'data-highlighted': toOptionalAttribute(focused.value),
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
