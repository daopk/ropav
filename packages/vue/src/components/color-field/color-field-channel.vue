<script setup lang="ts" vapor>
import type {ColorFieldRootProps, ColorFieldRootSlotProps} from "./color-field.types";
import type {Color, ColorChannel} from "../../utils/color-types";

import {colorFieldVariants} from "@heroui/styles";
import {computed} from "vue";

import {useColorChannelField} from "../../composables/use-color-channel-field";
import {provideFieldIdsContext} from "../../composables/use-field-ids";
import {dataAttr} from "../../utils/assertion";
import {provideColorInputGroupControlContext} from "../color-input-group";
import {provideFieldErrorContext} from "../field-error";

// `isInvalid` and `validate` are deliberately absent from the props this branch reads. React drops
// both here — the channel field's validation state is the number field's, built without either —
// and mirroring that keeps the DOM identical rather than growing a `data-invalid` React never has.
const props = withDefaults(
  defineProps<Omit<ColorFieldRootProps, "isInvalid" | "validate"> & {channel: ColorChannel}>(),
  {
    autoFocus: undefined,
    fullWidth: undefined,
    isDisabled: undefined,
    isReadOnly: undefined,
    isRequired: undefined,
    isWheelDisabled: undefined,
  },
);

const emit = defineEmits<{
  change: [value: Color | null];
  "update:value": [value: Color | null];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{default?: (props: ColorFieldRootSlotProps) => unknown}>();

const field = useColorChannelField({
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  autoFocus: () => props.autoFocus,
  channel: () => props.channel,
  colorSpace: () => props.colorSpace,
  defaultValue: () => props.defaultValue,
  isDisabled: () => props.isDisabled,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  isWheelDisabled: () => props.isWheelDisabled,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  onFocusChange: (isFocused) => emit("focusChange", isFocused),
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

provideFieldIdsContext(field.fieldIds);
provideColorInputGroupControlContext({
  attrs: field.attrs,
  handlers: {
    onBlur: field.onBlur,
    onFocus: field.onFocus,
    onInput: field.onInput,
    onKeydown: field.onKeydown,
    onKeyup: field.onKeyup,
    onPaste: field.onPaste,
  },
  isDisabled: field.isDisabled,
  isInvalid: field.isInvalid,
  registerElement: field.registerElement,
});
provideFieldErrorContext({validation: field.state.displayValidation});

const styles = computed(() => colorFieldVariants({class: props.class, fullWidth: props.fullWidth}));

const displayValidation = computed(() => field.state.displayValidation.value);

/**
 * The number the field submits.
 *
 * A hidden input rather than the visible one, because the visible one carries formatted text — a
 * degree sign or a percent is not something a server wants to parse. React does the same, which is
 * why `name` and `form` are kept off the text input.
 *
 * It carries the number the *text* parses to, which for a percent channel is the 0–1 value rather
 * than the 0–100 one on screen. That is what React submits too.
 */
const submittedValue = computed(() =>
  Number.isNaN(field.state.numberValue.value) ? "" : String(field.state.numberValue.value),
);
</script>

<template>
  <div
    :class="styles"
    :data-channel="props.channel"
    :data-disabled="dataAttr(field.isDisabled.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    :data-readonly="dataAttr(field.isReadOnly.value)"
    :data-required="dataAttr(field.isRequired.value)"
    data-slot="color-field"
  >
    <slot
      :channel="props.channel"
      :color-value="field.state.colorValue.value"
      :is-disabled="field.isDisabled.value"
      :is-invalid="field.isInvalid.value"
      :is-read-only="field.isReadOnly.value"
      :is-required="field.isRequired.value"
      :validation-details="displayValidation.validationDetails"
      :validation-errors="displayValidation.validationErrors"
    />
    <input
      v-if="props.name"
      :form="props.form"
      :name="props.name"
      type="hidden"
      :value="submittedValue"
    />
  </div>
</template>
