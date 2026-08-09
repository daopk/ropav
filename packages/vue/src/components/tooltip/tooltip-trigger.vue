<script setup lang="ts" vapor>
import type {TooltipTriggerProps} from "./tooltip.types";

import {computed} from "vue";

import {composeFocusResponder, useFocusResponder} from "../../composables/focus-responder";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {useTooltipContext} from "./tooltip.context";

const props = defineProps<TooltipTriggerProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTooltipContext();

// Supplied by the tooltip root, which is what makes this a trigger rather than a plain box.
const responder = useFocusResponder();

const styles = computed(() => slots.value.trigger({class: props.class}));

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

// The stylesheet keys the focus ring on the attribute, and a `div` has no pseudo-class branch it
// could fall back to.
const states = useInteractionStates();

// A `div` is not focusable on its own, and this one has to be: the tooltip opens on keyboard focus
// as well as on hover.
//
// Listeners are attached here rather than spread with `v-bind`, which in vapor re-attaches them on
// every render — and hovering this element is itself a render.
const focus = composeFocusResponder(responder, {
  onBlur: states.onBlur,
  onFocus: states.onFocus,
  onPointerenter: states.onPointerenter,
  onPointerleave: () => states.onPointerleave(),
});
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-focus-visible="dataAttr(states.isFocusVisible.value)"
    :data-hovered="dataAttr(states.isHovered.value)"
    data-slot="tooltip-trigger"
    role="button"
    tabindex="0"
    v-bind="responder?.attrs.value"
    @blur="focus.onBlur"
    @focus="focus.onFocus"
    @keydown="focus.onKeydown"
    @pointerdown="focus.onPointerdown"
    @pointerenter="focus.onPointerenter"
    @pointerleave="focus.onPointerleave"
  >
    <slot />
  </div>
</template>
