<script setup lang="ts" vapor>
import type {DateSegmentHostProps} from "./date-segment.types";

import {createCalendar} from "@internationalized/date";
import {shallowRef} from "vue";

import {useDateFieldState} from "@/composables/use-date-field-state";
import {useDatePickerGroup} from "@/composables/use-date-picker-group";

import DateSegmentPart from "./date-segment-part.vue";

const props = withDefaults(defineProps<DateSegmentHostProps>(), {
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
});

const element = shallowRef<HTMLElement | null>(null);

const state = useDateFieldState({
  createCalendar,
  defaultValue: () => props.defaultValue,
  granularity: () => props.granularity,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  maxGranularity: () => props.maxGranularity,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  onChange: props.onChange,
  validationBehavior: "aria",
  value: () => props.value,
});

const group = useDatePickerGroup({element});

props.onReady?.({group, state});
</script>

<template>
  <div
    ref="element"
    data-slot="group"
    @click="group.handlers.onClick"
    @keydown="group.onKeydown"
    @pointerdown="group.handlers.onPointerdown"
    @pointerup="group.handlers.onPointerup"
  >
    <DateSegmentPart
      v-for="(segment, index) in state.segments.value"
      :key="index"
      :aria-described-by="props.ariaDescribedBy"
      :aria-label="props.ariaLabel"
      :aria-labelled-by="props.ariaLabelledBy"
      :focus-manager="group.focusManager"
      :segment="segment"
      :state="state"
    />
  </div>
</template>
