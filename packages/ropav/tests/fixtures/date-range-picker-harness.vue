<script setup lang="ts" vapor>
import type {DateRangePickerHostProps} from "./date-range-picker-host.types";

import {shallowRef} from "vue";

import {useDateRangePicker} from "@/composables/use-date-range-picker";
import {useDateRangePickerState} from "@/composables/use-date-range-picker-state";
import {provideFieldIdsContext} from "@/composables/use-field-ids";

import DatePickerLabel from "./date-picker-label.vue";

const props = withDefaults(defineProps<DateRangePickerHostProps>(), {
  isDisabled: undefined,
  isReadOnly: undefined,
});

const element = shallowRef<HTMLElement | null>(null);

const state = useDateRangePickerState({
  defaultValue: () => props.defaultValue,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  validationBehavior: () => "native",
  value: () => props.value,
});

const picker = useDateRangePicker(
  {
    ariaDescribedby: () => props.ariaDescribedby,
    ariaLabel: () => props.ariaLabel,
    ariaLabelledby: () => props.ariaLabelledby,
    element,
    id: () => props.id,
    isDisabled: () => props.isDisabled,
    isReadOnly: () => props.isReadOnly,
    maxValue: () => props.maxValue,
    minValue: () => props.minValue,
    onFocusChange: props.onFocusChange,
  },
  state,
);

provideFieldIdsContext(picker.fieldIds);

props.onReady?.({picker, state});
</script>

<template>
  <div data-slot="date-range-picker-host">
    <DatePickerLabel v-if="props.withLabel" />
    <!-- The trigger sits inside the group, as it does in real markup: that is what makes the -->
    <!-- focus manager's exclusion of it observable. -->
    <div
      ref="element"
      v-bind="picker.groupAttrs.value"
      data-slot="date-range-picker-group"
      @focusin="picker.groupHandlers.onFocusin"
      @focusout="picker.groupHandlers.onFocusout"
      @keydown="picker.groupHandlers.onKeydown"
    >
      <div data-slot="date-range-picker-segment-start" tabindex="0" />
      <button
        data-slot="date-range-picker-trigger"
        type="button"
        v-bind="picker.triggerAttrs.value"
        @click="picker.onTriggerPress"
      />
      <div data-slot="date-range-picker-segment-end" tabindex="0" />
    </div>
    <div
      v-if="state.isOpen.value"
      data-slot="date-range-picker-dialog"
      v-bind="picker.dialogAttrs.value"
    />
  </div>
</template>
