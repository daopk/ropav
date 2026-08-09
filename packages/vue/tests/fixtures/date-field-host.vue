<script setup lang="ts" vapor>
import type {DateFieldHostProps} from "./date-field.types";

import {createCalendar} from "@internationalized/date";
import {shallowRef} from "vue";

import {Description} from "@/components/description";
import {Label} from "@/components/label";
import {useDateField} from "@/composables/use-date-field";
import {useDateFieldState} from "@/composables/use-date-field-state";
import {provideFieldIdsContext} from "@/composables/use-field-ids";

import DateSegmentPart from "./date-segment-part.vue";

const props = withDefaults(defineProps<DateFieldHostProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isRequired: undefined,
});

const element = shallowRef<HTMLElement | null>(null);
const inputElement = shallowRef<HTMLInputElement | null>(null);

const state = useDateFieldState({
  createCalendar,
  defaultValue: () => props.defaultValue,
  granularity: () => props.granularity,
  isDisabled: () => props.isDisabled,
  isRequired: () => props.isRequired,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  name: () => props.name,
  onChange: props.onChange,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

const field = useDateField({
  ariaLabel: () => props.ariaLabel,
  autoFocus: () => props.autoFocus,
  element,
  inputElement,
  isDisabled: () => props.isDisabled,
  isRequired: () => props.isRequired,
  name: () => props.name,
  onFocusChange: props.onFocusChange,
  role: () => props.role,
  state,
});

provideFieldIdsContext(field.fieldIds);

props.onReady?.({field, state});
</script>

<template>
  <div data-slot="wrapper">
    <Label v-if="props.label" data-slot="label" @click="field.onLabelClick">{{
      props.label
    }}</Label>
    <div
      ref="element"
      v-bind="field.attrs.value"
      :data-focus-within="field.isFocusWithin.value ? 'true' : undefined"
      data-slot="group"
      :style="field.style.value"
      @click="field.handlers.onClick"
      @focusin="field.onFocusin"
      @focusout="field.onFocusout"
      @keydown="field.onKeydown"
      @pointerdown="field.handlers.onPointerdown"
      @pointerup="field.handlers.onPointerup"
    >
      <DateSegmentPart
        v-for="(segment, index) in state.segments.value"
        :key="index"
        :aria-described-by="field.segment.ariaDescribedBy.value"
        :aria-label="field.segment.ariaLabel.value"
        :aria-labelled-by="field.segment.ariaLabelledBy.value"
        :focus-manager="field.segment.focusManager"
        :segment="segment"
        :state="state"
      />
    </div>
    <input ref="inputElement" v-bind="field.inputAttrs.value" data-slot="input" />
    <Description v-if="props.description" data-slot="description">
      {{ props.description }}
    </Description>
  </div>
</template>
