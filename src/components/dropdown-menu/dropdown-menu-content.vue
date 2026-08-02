<template>
    <component v-if="shouldRender" :is="as" :ref="setElement" v-bind="rootAttrs">
        <span
            v-if="arrow"
            :ref="templateRefs.arrow"
            class="rp-dropdown-menu__arrow"
            :data-side="placementSide"
            :style="floating.arrowStyle.value"
            aria-hidden="true"
        />
        <slot :is-open="isOpen" :placement="actualPlacement" :close="close" />
    </component>
</template>

<script lang="ts" setup vapor>
import { useAttrs } from 'vue';
import type {
    DropdownMenuContentPrimitiveProps,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuPlacement,
} from './types';
import { useDropdownMenuPrimitiveContent } from './useDropdownMenuPrimitiveContent';

defineOptions({ name: 'RpDropdownMenuContent', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuContentPrimitiveProps>(), {
    as: 'div',
    placement: 'bottom-start',
    strategy: 'absolute',
    flip: true,
    shift: true,
    collisionPadding: 8,
    arrow: false,
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
const {
    arrowElement,
    actualPlacement,
    isOpen,
    shouldRender,
    placementSide,
    rootAttrs,
    floating,
    setElement,
    close,
} = useDropdownMenuPrimitiveContent(
    props,
    attrs,
    {
        escapeKeyDown: (event) => emit('escapeKeyDown', event),
        pointerDownOutside: (event) => emit('pointerDownOutside', event),
        focusOutside: (event) => emit('focusOutside', event),
        interactOutside: (event) => emit('interactOutside', event),
    },
    false,
);
const templateRefs = { arrow: arrowElement };
</script>
