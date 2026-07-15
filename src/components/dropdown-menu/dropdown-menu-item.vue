<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :focused="focused" :disabled="isDisabled" :select="select" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, useAttrs } from 'vue';
import { bem } from '@/utils/bem';
import { optionalAttr, usePrimitiveItem } from './dropdown-menu-primitive-core';
import type {
    DropdownMenuItemPrimitiveProps,
    DropdownMenuItemPrimitiveSlotProps,
    DropdownMenuSelectEvent,
} from './types';

defineOptions({ name: 'RpDropdownMenuItem', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuItemPrimitiveProps>(), {
    as: 'button',
    disabled: false,
    destructive: false,
    closeOnSelect: true,
});

const emit = defineEmits<{
    select: [event: DropdownMenuSelectEvent];
}>();

defineSlots<{
    default?(props: DropdownMenuItemPrimitiveSlotProps): unknown;
}>();

const attrs = useAttrs();
const { id, isDisabled, focused, activate, select, setElement, onPointerenter } = usePrimitiveItem(
    'RpDropdownMenuItem',
    props,
    (event) => emit('select', event),
    {
        defaultCloseOnSelect: true,
    },
);

function onClick(event: MouseEvent) {
    if (!event.defaultPrevented) activate(event);
}

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: id.value,
        type: props.as === 'button' ? 'button' : undefined,
        role: 'menuitem',
        tabindex: -1,
        disabled: props.as === 'button' ? optionalAttr(isDisabled.value) : undefined,
        'aria-disabled': optionalAttr(isDisabled.value),
        'data-disabled': optionalAttr(isDisabled.value),
        'data-focused': optionalAttr(focused.value),
        'data-highlighted': optionalAttr(focused.value),
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
