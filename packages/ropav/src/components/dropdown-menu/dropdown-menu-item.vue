<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :focused="focused" :disabled="isDisabled" :select="select" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, useAttrs } from 'vue';
import { toOptionalAttribute } from '@/utils/attributes';
import { bem } from '@/utils/bem';
import { usePrimitiveItem } from './dropdownMenuContext';
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
        disabled: props.as === 'button' ? toOptionalAttribute(isDisabled.value) : undefined,
        'aria-disabled': toOptionalAttribute(isDisabled.value),
        'data-disabled': toOptionalAttribute(isDisabled.value),
        'data-focused': toOptionalAttribute(focused.value),
        'data-highlighted': toOptionalAttribute(focused.value),
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
