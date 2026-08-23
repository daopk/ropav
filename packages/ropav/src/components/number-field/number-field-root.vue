<script setup lang="ts" vapor>
import type {NumberFieldRootProps, NumberFieldRootSlotProps} from "./number-field.types";

import {numberFieldVariants} from "@ropav/styles";
import {computed} from "vue";

import {provideFieldIdsContext} from "../../composables/use-field-ids";
import {useNumberField} from "../../composables/use-number-field";
import {dataAttr} from "../../utils/assertion";
import {provideFieldErrorContext} from "../field-error";

import {provideNumberFieldContext} from "./number-field.context";

// Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
// `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` in
// particular it would pin the field valid and turn the whole validation layer into dead code.
const props = withDefaults(defineProps<NumberFieldRootProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isWheelDisabled: undefined,
  variant: undefined,
});

const emit = defineEmits<{
  change: [value: number];
  "update:value": [value: number];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{default?: (props: NumberFieldRootSlotProps) => unknown}>();

const field = useNumberField({
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  autoFocus: () => props.autoFocus,
  commitBehavior: () => props.commitBehavior,
  decrementAriaLabel: () => props.decrementAriaLabel,
  defaultValue: () => props.defaultValue,
  form: () => props.form,
  formatOptions: () => props.formatOptions,
  id: () => props.id,
  incrementAriaLabel: () => props.incrementAriaLabel,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  isWheelDisabled: () => props.isWheelDisabled,
  locale: () => props.locale,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  name: () => props.name,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  onFocusChange: (isFocused) => emit("focusChange", isFocused),
  step: () => props.step,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

const slots = computed(() =>
  numberFieldVariants({fullWidth: props.fullWidth, variant: props.variant}),
);

provideFieldIdsContext(field.fieldIds);
provideNumberFieldContext({
  decrement: field.decrement,
  field,
  increment: field.increment,
  slots,
});
provideFieldErrorContext({validation: field.state.displayValidation});

const styles = computed(() => slots.value.base({class: props.class}));

// `data-required` has to sit here rather than on the control: the stylesheet draws the asterisk
// through `[data-required="true"] > .label`, so it reads the field, not the input.
const displayValidation = computed(() => field.state.displayValidation.value);

/**
 * The number the field submits.
 *
 * A hidden input rather than the visible one, because the visible one carries formatted text — a
 * currency symbol and grouping separators are not something a server wants to parse. React does
 * the same, which is why `name` and `form` are kept off the text input.
 */
const submittedValue = computed(() =>
  Number.isNaN(field.state.numberValue.value) ? "" : String(field.state.numberValue.value),
);
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(field.isDisabled.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    :data-readonly="dataAttr(field.isReadOnly.value)"
    :data-required="dataAttr(field.isRequired.value)"
    data-slot="number-field"
  >
    <slot
      :is-disabled="field.isDisabled.value"
      :is-invalid="field.isInvalid.value"
      :is-read-only="field.isReadOnly.value"
      :is-required="field.isRequired.value"
      :number-value="field.state.numberValue.value"
      :validation-details="displayValidation.validationDetails"
      :validation-errors="displayValidation.validationErrors"
    />
    <input
      v-if="props.name"
      :disabled="field.isDisabled.value || undefined"
      :form="props.form"
      :name="props.name"
      type="hidden"
      :value="submittedValue"
    />
  </div>
</template>
