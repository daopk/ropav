<script setup lang="ts" vapor>
import type {DatePickerHostProps} from "./date-picker-host.types";

import {shallowRef} from "vue";

import {useDatePicker} from "@/composables/use-date-picker";
import {useDatePickerState} from "@/composables/use-date-picker-state";
import {provideFieldIdsContext} from "@/composables/use-field-ids";

import DatePickerLabel from "./date-picker-label.vue";

const props = withDefaults(defineProps<DatePickerHostProps>(), {
  isDisabled: undefined,
  isReadOnly: undefined,
});

const element = shallowRef<HTMLElement | null>(null);

const state = useDatePickerState({
  defaultValue: () => props.defaultValue,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  validationBehavior: () => "native",
  value: () => props.value,
});

const picker = useDatePicker(
  {
    ariaDescribedby: () => props.ariaDescribedby,
    ariaLabel: () => props.ariaLabel,
    ariaLabelledby: () => props.ariaLabelledby,
    element,
    id: () => props.id,
    isDisabled: () => props.isDisabled,
    isReadOnly: () => props.isReadOnly,
  },
  state,
);

provideFieldIdsContext(picker.fieldIds);

props.onReady?.({picker, state});
</script>

<template>
  <div data-slot="date-picker-host">
    <DatePickerLabel v-if="props.withLabel" />
    <div ref="element" v-bind="picker.groupAttrs.value" data-slot="date-picker-group">
      <div data-slot="date-picker-segment" tabindex="0" />
    </div>
    <button
      data-slot="date-picker-trigger"
      type="button"
      v-bind="picker.triggerAttrs.value"
      @click="picker.onTriggerPress"
    />
    <div
      v-if="state.isOpen.value"
      data-slot="date-picker-dialog"
      v-bind="picker.dialogAttrs.value"
    />
  </div>
</template>
