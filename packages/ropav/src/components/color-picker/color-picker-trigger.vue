<script setup lang="ts" vapor>
import type { ColorPickerTriggerProps } from "./color-picker.types";

import { computed } from "vue";

import { composePressResponder, usePressResponder } from "../../composables/press-responder";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

import { useColorPickerContext } from "./color-picker.context";

const props = withDefaults(defineProps<ColorPickerTriggerProps>(), { type: "button" });

defineSlots<{ default?: () => unknown }>();

const { slots } = useColorPickerContext();

// Supplied by the picker root, which is what makes this a dialog trigger rather than a button.
const responder = usePressResponder();

const styles = computed(() => slots.value.trigger({ class: props.class }));

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

// The stylesheet keys the focus ring on the attribute as well as on `:focus-visible`, so the
// state is tracked rather than left to the pseudo-class alone.
const { isFocusVisible, onBlur, onFocus } = useInteractionStates();

/**
 * A tab index is written even though a native button is already tabbable: Safari does not focus
 * one unless an explicit index says so, which is why react-aria always sets it.
 *
 * Listeners are attached here rather than spread with `v-bind`, which in vapor re-attaches them
 * on every render — see `composePressResponder`.
 */
const press = composePressResponder(responder);
</script>

<template>
  <button
    :ref="setElement"
    :class="styles"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-pressed="dataAttr(responder?.isPressed.value)"
    data-slot="color-picker-trigger"
    tabindex="0"
    :type="props.type"
    v-bind="responder?.attrs.value"
    @blur="onBlur"
    @click="press.onClick"
    @dragstart="press.onDragstart"
    @focus="onFocus"
    @keydown="press.onKeydown"
    @mousedown="press.onMousedown"
    @pointerdown="press.onPointerdown"
    @pointerenter="press.onPointerenter"
    @pointerleave="press.onPointerleave"
    @pointerup="press.onPointerup"
  >
    <slot />
  </button>
</template>
