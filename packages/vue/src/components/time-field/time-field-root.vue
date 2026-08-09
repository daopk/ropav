<script setup lang="ts" vapor>
import type {TimeFieldRootProps, TimeFieldRootSlotProps} from "./time-field.types";
import type {TimeValue} from "../../utils/date-format";

import {timeFieldVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {useTimeField} from "../../composables/use-date-field";
import {provideFieldIdsContext} from "../../composables/use-field-ids";
import {useTimeFieldState} from "../../composables/use-time-field-state";
import {dataAttr} from "../../utils/assertion";
import {provideDateFieldControlContext} from "../date-input-group";
import {provideFieldErrorContext} from "../field-error";

/*
 * Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
 * `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` in
 * particular it would pin the field valid and turn the whole validation layer into dead code.
 */
const props = withDefaults(defineProps<TimeFieldRootProps>(), {
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
  change: [value: TimeValue | null];
  "update:value": [value: TimeValue | null];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{default?: (props: TimeFieldRootSlotProps) => unknown}>();

const element = shallowRef<HTMLElement | null>(null);
const inputElement = shallowRef<HTMLInputElement | null>(null);

const state = useTimeFieldState({
  defaultValue: () => props.defaultValue,
  granularity: () => props.granularity,
  hideTimeZone: () => props.hideTimeZone,
  hourCycle: () => props.hourCycle,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  locale: () => props.locale,
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

const field = useTimeField({
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
provideDateFieldControlContext({
  field,
  setElement: (next) => {
    element.value = next;
  },
  setInputElement: (next) => {
    inputElement.value = next;
  },
  state,
});
provideFieldErrorContext({validation: state.displayValidation});

const styles = computed(() => timeFieldVariants({class: props.class, fullWidth: props.fullWidth}));
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    :data-readonly="dataAttr(state.isReadOnly.value)"
    :data-required="dataAttr(state.isRequired.value)"
    data-slot="time-field"
  >
    <slot
      :is-disabled="state.isDisabled.value"
      :is-invalid="field.isInvalid.value"
      :is-read-only="state.isReadOnly.value"
      :is-required="state.isRequired.value"
    />
  </div>
</template>
