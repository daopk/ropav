<script setup lang="ts" vapor>
import type {TimeFieldHostProps} from "./date-field.types";

import {shallowRef} from "vue";

import {useTimeField} from "@/composables/use-date-field";
import {useTimeFieldState} from "@/composables/use-time-field-state";

import DateSegmentPart from "./date-segment-part.vue";

const props = withDefaults(defineProps<TimeFieldHostProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isRequired: undefined,
});

const element = shallowRef<HTMLElement | null>(null);
const inputElement = shallowRef<HTMLInputElement | null>(null);

const state = useTimeFieldState({
  defaultValue: () => props.defaultValue,
  isDisabled: () => props.isDisabled,
  isRequired: () => props.isRequired,
  name: () => props.name,
  onChange: props.onChange,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

const field = useTimeField({
  ariaLabel: () => props.ariaLabel,
  autoFocus: () => props.autoFocus,
  element,
  inputElement,
  isDisabled: () => props.isDisabled,
  isRequired: () => props.isRequired,
  name: () => props.name,
  state,
});

props.onReady?.({field, state});
</script>

<template>
  <div data-slot="wrapper">
    <div
      ref="element"
      v-bind="field.attrs.value"
      data-slot="group"
      :style="field.style.value"
      @focusin="field.onFocusin"
      @focusout="field.onFocusout"
      @keydown="field.onKeydown"
    >
      <DateSegmentPart
        v-for="(segment, index) in state.segments.value"
        :key="index"
        :aria-label="field.segment.ariaLabel.value"
        :focus-manager="field.segment.focusManager"
        :segment="segment"
        :state="state"
      />
    </div>
    <input ref="inputElement" v-bind="field.inputAttrs.value" data-slot="input" />
  </div>
</template>
