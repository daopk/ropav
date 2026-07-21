<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :focused="focused" :disabled="isDisabled" :select="select" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, provide, useAttrs } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import {
    checkedKey,
    optionalAttr,
    radioGroupKey,
    usePrimitiveItem,
} from './dropdown-menu-primitive-core';
import type {
    DropdownMenuItemPrimitiveSlotProps,
    DropdownMenuRadioItemPrimitiveProps,
    DropdownMenuSelectEvent,
} from './types';

defineOptions({ name: 'RpDropdownMenuRadioItem', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuRadioItemPrimitiveProps>(), {
    as: 'button',
    disabled: false,
    destructive: false,
    closeOnSelect: false,
});

const emit = defineEmits<{
    select: [event: DropdownMenuSelectEvent];
}>();

defineSlots<{
    default?(props: DropdownMenuItemPrimitiveSlotProps): unknown;
}>();

const attrs = useAttrs();
const group = useRequiredInject(radioGroupKey, 'RpDropdownMenuRadioItem');
const isChecked = computed(() => group.value.value === props.value);
const checked = computed<boolean | 'mixed'>(() => isChecked.value);
const state = computed<'checked' | 'unchecked'>(() => (isChecked.value ? 'checked' : 'unchecked'));

provide(checkedKey, { state, checked: isChecked });
const { id, isDisabled, focused, activate, select, setElement, onPointerenter } = usePrimitiveItem(
    'RpDropdownMenuRadioItem',
    props,
    (event) => emit('select', event),
    {
        checked,
        defaultCloseOnSelect: false,
        afterSelect: () => group.select(props.value),
    },
);

function onClick(event: MouseEvent) {
    if (!event.defaultPrevented) activate(event);
}

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: id.value,
        type: props.as === 'button' ? 'button' : undefined,
        role: 'menuitemradio',
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
