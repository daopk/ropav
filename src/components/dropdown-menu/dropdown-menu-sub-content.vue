<template>
    <component v-if="shouldRender" :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :is-open="isOpen" :placement="actualPlacement" :close="close" />
    </component>
</template>

<script lang="ts" setup vapor>
import { useAttrs } from 'vue';
import type {
    DropdownMenuInteractOutsideEvent,
    DropdownMenuPlacement,
    DropdownMenuSubContentPrimitiveProps,
} from './types';
import { useDropdownMenuPrimitiveContent } from './useDropdownMenuPrimitiveContent';

defineOptions({ name: 'RpDropdownMenuSubContent', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuSubContentPrimitiveProps>(), {
    as: 'div',
    placement: 'right-start',
    strategy: 'absolute',
    flip: true,
    shift: true,
    collisionPadding: 8,
    forceMount: false,
});

const emit = defineEmits<{
    escapeKeyDown: [event: CustomEvent<{ originalEvent: KeyboardEvent }>];
    pointerDownOutside: [event: DropdownMenuInteractOutsideEvent];
    focusOutside: [event: DropdownMenuInteractOutsideEvent];
    interactOutside: [event: DropdownMenuInteractOutsideEvent];
}>();

defineSlots<{
    default?(props: {
        isOpen: boolean;
        placement: DropdownMenuPlacement;
        close: () => void;
    }): unknown;
}>();

const attrs = useAttrs();
const { actualPlacement, isOpen, shouldRender, rootAttrs, setElement, close } =
    useDropdownMenuPrimitiveContent(
        props,
        attrs,
        {
            escapeKeyDown: (event) => emit('escapeKeyDown', event),
            pointerDownOutside: (event) => emit('pointerDownOutside', event),
            focusOutside: (event) => emit('focusOutside', event),
            interactOutside: (event) => emit('interactOutside', event),
        },
        true,
    );
</script>
