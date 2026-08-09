<script setup lang="ts" vapor>
import type {
  DateInputGroupInputProps,
  DateInputGroupInputSlotProps,
} from "./date-input-group.types";

import {computed} from "vue";

import {useFocusWithin, useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {useDateFieldControlContext, useDateInputGroupContext} from "./date-input-group.context";

const props = defineProps<DateInputGroupInputProps>();

defineSlots<{default?: (props: DateInputGroupInputSlotProps) => unknown}>();

const group = useDateInputGroupContext();
const {field, setElement, setInputElement, state} = useDateFieldControlContext();

const styles = computed(() => group?.slots.value.input({class: props.class}) ?? props.class);

const interaction = useInteractionStates({isDisabled: state.isDisabled});
const focusWithin = useFocusWithin();

/*
 * Two things watch the pointer here and both need every event: the press machine, which decides
 * which segment a click lands on, and the hover state the stylesheet reads.
 */
const onPointerenter = (event: PointerEvent) => {
  interaction.onPointerenter(event);
  field.handlers.onPointerenter(event);
};

const onPointerleave = (event: PointerEvent) => {
  interaction.onPointerleave();
  field.handlers.onPointerleave(event);
};

const onFocusin = (event: FocusEvent) => {
  focusWithin.onFocusin();
  field.onFocusin(event);
};

const onFocusout = (event: FocusEvent) => {
  focusWithin.onFocusout(event);
  field.onFocusout(event);
};

const setGroupElement = (next: unknown) => setElement(next instanceof HTMLElement ? next : null);
const setHiddenInput = (next: unknown) =>
  setInputElement(next instanceof HTMLInputElement ? next : null);
</script>

<template>
  <div
    :ref="setGroupElement"
    v-bind="field.attrs.value"
    :class="styles"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-focus-visible="dataAttr(focusWithin.isFocusVisible.value)"
    :data-focus-within="dataAttr(focusWithin.isFocusWithin.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(state.isInvalid.value)"
    :data-readonly="dataAttr(state.isReadOnly.value)"
    data-slot="date-input-group-input"
    :style="field.style.value"
    @click="field.handlers.onClick"
    @dragstart="field.handlers.onDragstart"
    @focusin="onFocusin"
    @focusout="onFocusout"
    @keydown="field.onKeydown"
    @mousedown="field.handlers.onMousedown"
    @pointerdown="field.handlers.onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
    @pointerup="field.handlers.onPointerup"
  >
    <template v-for="(segment, index) in state.segments.value" :key="index">
      <slot :segment="segment" />
    </template>
  </div>
  <input :ref="setHiddenInput" v-bind="field.inputAttrs.value" />
</template>
