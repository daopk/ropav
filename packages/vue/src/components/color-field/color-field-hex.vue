<script setup lang="ts" vapor>
import type {ColorFieldRootProps, ColorFieldRootSlotProps} from "./color-field.types";
import type {Color} from "../../utils/color-types";

import {colorFieldVariants} from "@heroui/styles";
import {computed} from "vue";

import {useColorField} from "../../composables/use-color-field";
import {provideFieldIdsContext} from "../../composables/use-field-ids";
import {dataAttr} from "../../utils/assertion";
import {provideColorInputGroupControlContext} from "../color-input-group";
import {provideFieldErrorContext} from "../field-error";

// Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
// `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` in
// particular it would pin the field valid and turn the whole validation layer into dead code.
const props = withDefaults(defineProps<Omit<ColorFieldRootProps, "channel" | "colorSpace">>(), {
  autoFocus: undefined,
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isWheelDisabled: undefined,
});

const emit = defineEmits<{
  change: [value: Color | null];
  "update:value": [value: Color | null];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{default?: (props: ColorFieldRootSlotProps) => unknown}>();

const field = useColorField({
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  autoFocus: () => props.autoFocus,
  defaultValue: () => props.defaultValue,
  form: () => props.form,
  id: () => props.id,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  isWheelDisabled: () => props.isWheelDisabled,
  name: () => props.name,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  onFocusChange: (isFocused) => emit("focusChange", isFocused),
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

provideFieldIdsContext(field.fieldIds);
provideColorInputGroupControlContext({
  attrs: field.attrs,
  handlers: field.handlers,
  isDisabled: field.isDisabled,
  isInvalid: field.isInvalid,
  registerElement: field.registerElement,
});
provideFieldErrorContext({validation: field.state.displayValidation});

const styles = computed(() => colorFieldVariants({class: props.class, fullWidth: props.fullWidth}));

// `data-required` has to sit here rather than on the control: the stylesheet reads the field for
// the label's asterisk, not the input.
const displayValidation = computed(() => field.state.displayValidation.value);
</script>

<template>
  <div
    :class="styles"
    data-channel="hex"
    :data-disabled="dataAttr(field.isDisabled.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    :data-readonly="dataAttr(field.isReadOnly.value)"
    :data-required="dataAttr(field.isRequired.value)"
    data-slot="color-field"
  >
    <slot
      channel="hex"
      :color-value="field.state.colorValue.value"
      :is-disabled="field.isDisabled.value"
      :is-invalid="field.isInvalid.value"
      :is-read-only="field.isReadOnly.value"
      :is-required="field.isRequired.value"
      :validation-details="displayValidation.validationDetails"
      :validation-errors="displayValidation.validationErrors"
    />
  </div>
</template>
