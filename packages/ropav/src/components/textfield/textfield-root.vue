<script setup lang="ts" vapor>
import type { TextFieldRootProps, TextFieldSlotProps } from "./textfield.types";

import { textFieldVariants } from "@ropav/styles";
import { computed } from "vue";

import { provideFieldIdsContext } from "../../composables/use-field-ids";
import { provideTextFieldControlContext, useTextField } from "../../composables/use-text-field";
import { dataAttr } from "../../utils/assertion";
import { provideFieldErrorContext } from "../field-error";

import { provideTextFieldContext } from "./textfield.context";

// Every three-state prop declares an explicit `undefined` default. Vue casts an absent
// boolean to `false`, and a `false` here reads as the caller claiming that state: for
// `isInvalid` in particular it would pin the field valid and turn the whole validation
// layer into dead code.
//
// `spellCheck` needs it for the same reason even though it is not a boolean prop. Its type
// merely *includes* `boolean`, which is enough for Vue to cast an absent value to `false` —
// and that reaches the control as `spellcheck="false"`, turning spell checking off on every
// field that never asked.
const props = withDefaults(defineProps<TextFieldRootProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  spellCheck: undefined,
  variant: undefined,
});

const emit = defineEmits<{
  change: [value: string];
  "update:value": [value: string];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{ default?: (props: TextFieldSlotProps) => unknown }>();

const field = useTextField({
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  autoCapitalize: () => props.autoCapitalize,
  autoComplete: () => props.autoComplete,
  autoCorrect: () => props.autoCorrect,
  autoFocus: () => props.autoFocus,
  defaultValue: () => props.defaultValue,
  enterKeyHint: () => props.enterKeyHint,
  form: () => props.form,
  id: () => props.id,
  inputMode: () => props.inputMode,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  maxLength: () => props.maxLength,
  minLength: () => props.minLength,
  name: () => props.name,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  onFocusChange: (isFocused) => emit("focusChange", isFocused),
  pattern: () => props.pattern,
  placeholder: () => props.placeholder,
  spellCheck: () => props.spellCheck,
  type: () => props.type,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

provideFieldIdsContext(field.fieldIds);
provideTextFieldControlContext(field);
provideTextFieldContext({
  size: computed(() => props.size),
  variant: computed(() => props.variant),
});
provideFieldErrorContext({ validation: field.validation.displayValidation });

const styles = computed(() =>
  textFieldVariants({ class: props.class, fullWidth: props.fullWidth }),
);

// `data-required` has to sit here rather than on the control: the stylesheet draws the
// asterisk through `[data-required="true"] > .label`, so it reads the field, not the input.
const displayValidation = computed(() => field.validation.displayValidation.value);
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(field.isDisabled.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    :data-readonly="dataAttr(field.isReadOnly.value)"
    :data-required="dataAttr(field.isRequired.value)"
    data-slot="textfield"
  >
    <slot
      :is-disabled="field.isDisabled.value"
      :is-invalid="field.isInvalid.value"
      :is-read-only="field.isReadOnly.value"
      :is-required="field.isRequired.value"
      :validation-details="displayValidation.validationDetails"
      :validation-errors="displayValidation.validationErrors"
    />
  </div>
</template>
