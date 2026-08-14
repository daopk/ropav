<script setup lang="ts" vapor>
import type {
  DateInputGroupInputProps,
  DateInputGroupInputSlotProps,
} from "./date-input-group.types";

import {computed} from "vue";

import {useFocusWithin, useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {
  provideDateFieldControlContext,
  useDateFieldControlContext,
  useDateInputGroupContext,
} from "./date-input-group.context";

const props = defineProps<DateInputGroupInputProps>();

defineSlots<{default?: (props: DateInputGroupInputSlotProps) => unknown}>();

const group = useDateInputGroupContext();

/*
 * Resolved once, at setup: which end of a range this input edits is a fact about the markup, and
 * the segments below capture the field they were built against.
 */
const control = useDateFieldControlContext().resolve(props.slot);
const {field, setElement, setInputElement, state} = control;

/*
 * Republished flat, so the segments below need to know nothing about slots: they read whichever
 * field is nearest above them, which inside this input is always this one.
 */
provideDateFieldControlContext({resolve: () => control});

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

/*
 * `slot` is bound from here rather than written in the template because Vue 2 read a literal `slot`
 * attribute as slot syntax, and the linter still flags either spelling. The vapor compiler passes
 * it straight through — measured in the DOM. React puts it there too, which is why it is kept.
 */
const attrs = computed(() => ({...field.attrs.value, slot: props.slot}));
</script>

<template>
  <div
    :ref="setGroupElement"
    v-bind="attrs"
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
