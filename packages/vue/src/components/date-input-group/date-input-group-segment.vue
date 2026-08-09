<script setup lang="ts" vapor>
import type {DateInputGroupSegmentProps} from "./date-input-group.types";

import {computed, shallowRef} from "vue";

import {useDateSegment} from "../../composables/use-date-segment";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {useDateFieldControlContext, useDateInputGroupContext} from "./date-input-group.context";

const props = defineProps<DateInputGroupSegmentProps>();

const group = useDateInputGroupContext();
const {field, state} = useDateFieldControlContext();

const element = shallowRef<HTMLElement | null>(null);

const segment = useDateSegment({
  ariaDescribedBy: field.segment.ariaDescribedBy,
  ariaLabel: field.segment.ariaLabel,
  ariaLabelledBy: field.segment.ariaLabelledBy,
  element,
  focusManager: field.segment.focusManager,
  segment: () => props.segment,
  state,
});

const styles = computed(() => group?.slots.value.segment({class: props.class}) ?? props.class);

/*
 * Punctuation between segments is not interactive, so it reports no hover — matching React, which
 * disables hover tracking outright for a literal.
 */
const interaction = useInteractionStates({
  isDisabled: () => state.isDisabled.value || props.segment.type === "literal",
});

const onFocus = () => {
  interaction.onFocus();
  segment.onFocus();
};

const onBlur = () => {
  interaction.onBlur();
  segment.onBlur();
};

const setElement = (next: unknown) => {
  element.value = next instanceof HTMLElement ? next : null;
};
</script>

<template>
  <span
    :ref="setElement"
    v-bind="segment.attrs.value"
    :class="styles"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(state.isInvalid.value)"
    :data-readonly="dataAttr(state.isReadOnly.value)"
    data-slot="date-input-group-segment"
    :data-type="props.segment.type"
    :style="segment.style.value"
    @beforeinput="segment.onBeforeinput"
    @blur="onBlur"
    @focus="onFocus"
    @input="segment.onInput"
    @keydown="segment.onKeydown"
    @mousedown="segment.onMousedown"
    @pointerdown="segment.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
    ><slot>{{ props.segment.text }}</slot></span
  >
</template>
