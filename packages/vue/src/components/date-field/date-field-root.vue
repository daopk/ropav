<script setup lang="ts" vapor>
import type {DateFieldRootProps, DateFieldRootSlotProps} from "./date-field.types";
import type {DateFieldControl} from "../date-input-group";
import type {DateValue} from "@internationalized/date";

import {dateFieldVariants} from "@heroui/styles";
import {createCalendar as defaultCreateCalendar} from "@internationalized/date";
import {computed, shallowRef} from "vue";

import {useDateField} from "../../composables/use-date-field";
import {useDateFieldState} from "../../composables/use-date-field-state";
import {provideFieldIdsContext} from "../../composables/use-field-ids";
import {dataAttr} from "../../utils/assertion";
import {provideDateFieldControlContext} from "../date-input-group";
import DateInputGroupHiddenInput from "../date-input-group/date-input-group-hidden-input.vue";
import {provideFieldErrorContext} from "../field-error";

/*
 * Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
 * `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` in
 * particular it would pin the field valid and turn the whole validation layer into dead code.
 */
const props = withDefaults(defineProps<DateFieldRootProps>(), {
  autoFocus: undefined,
  fullWidth: undefined,
  hideTimeZone: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  shouldForceLeadingZeros: undefined,
});

const emit = defineEmits<{
  change: [value: DateValue | null];
  "update:value": [value: DateValue | null];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{default?: (props: DateFieldRootSlotProps) => unknown}>();

const element = shallowRef<HTMLElement | null>(null);
const inputElement = shallowRef<HTMLInputElement | null>(null);

const state = useDateFieldState({
  createCalendar: (identifier) => (props.createCalendar ?? defaultCreateCalendar)(identifier),
  defaultValue: () => props.defaultValue,
  granularity: () => props.granularity,
  hideTimeZone: () => props.hideTimeZone,
  hourCycle: () => props.hourCycle,
  isDateUnavailable: props.isDateUnavailable,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  locale: () => props.locale,
  maxGranularity: () => props.maxGranularity,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  name: () => props.name,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  placeholderValue: () => props.placeholderValue,
  shouldForceLeadingZeros: () => props.shouldForceLeadingZeros,
  validate: props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

const field = useDateField({
  ariaDescribedBy: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledBy: () => props.ariaLabelledby,
  autoFocus: () => props.autoFocus,
  element,
  form: () => props.form,
  id: () => props.id,
  inputElement,
  isDisabled: () => props.isDisabled,
  isRequired: () => props.isRequired,
  name: () => props.name,
  onFocusChange: (isFocused) => emit("focusChange", isFocused),
  state,
});

provideFieldIdsContext(field.fieldIds);

/*
 * Wrapped in a `resolve` that ignores the slot: a field owns one value, so every part
 * inside it edits the same one however it asks.
 */
const control: DateFieldControl = {
  field,
  setElement: (next) => {
    element.value = next;
  },
  setInputElement: (next) => {
    inputElement.value = next;
  },
  state,
};

provideDateFieldControlContext({resolve: () => control});
provideFieldErrorContext({validation: state.displayValidation});

const styles = computed(() => dateFieldVariants({class: props.class, fullWidth: props.fullWidth}));
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    :data-readonly="dataAttr(state.isReadOnly.value)"
    :data-required="dataAttr(state.isRequired.value)"
    data-slot="date-field"
  >
    <slot
      :is-disabled="state.isDisabled.value"
      :is-invalid="field.isInvalid.value"
      :is-read-only="state.isReadOnly.value"
      :is-required="state.isRequired.value"
    />
  </div>
  <DateInputGroupHiddenInput :autocomplete="props.autoComplete" :name="props.name" />
</template>
