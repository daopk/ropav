<script setup lang="ts" vapor>
import type {SearchFieldRootProps, SearchFieldRootSlotProps} from "./search-field.types";

import {searchFieldVariants} from "@heroui/styles";
import {computed} from "vue";

import {providePressResponder} from "../../composables/press-responder";
import {provideFieldIdsContext} from "../../composables/use-field-ids";
import {useSearchField} from "../../composables/use-search-field";
import {provideTextFieldControlContext} from "../../composables/use-text-field";
import {dataAttr} from "../../utils/assertion";
import {provideFieldErrorContext} from "../field-error";

import {provideSearchFieldContext} from "./search-field.context";

// Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean
// to `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` in
// particular it would pin the field valid and turn the whole validation layer into dead code.
//
// `spellCheck` needs it for the same reason even though it is not a boolean prop. Its type
// merely *includes* `boolean`, which is enough for Vue to cast an absent value to `false` — and
// that reaches the control as `spellcheck="false"`, turning spell checking off on every field
// that never asked.
const props = withDefaults(defineProps<SearchFieldRootProps>(), {
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
  clear: [];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{default?: (props: SearchFieldRootSlotProps) => unknown}>();

const field = useSearchField({
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
  onClear: () => emit("clear"),
  onFocusChange: (isFocused) => emit("focusChange", isFocused),
  onSubmit: () => props.onSubmit,
  placeholder: () => props.placeholder,
  spellCheck: () => props.spellCheck,
  type: () => props.type,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

const slots = computed(() =>
  searchFieldVariants({fullWidth: props.fullWidth, variant: props.variant}),
);

provideFieldIdsContext(field.fieldIds);
provideTextFieldControlContext(field);
provideSearchFieldContext({isEmpty: field.isEmpty, slots});
provideFieldErrorContext({validation: field.validation.displayValidation});
// The clear button takes its whole behaviour from here, which keeps it an ordinary close
// button. React hands the same props down through the button context a `CloseButton` reads.
providePressResponder(field.clearButtonResponder);

const styles = computed(() => slots.value.base({class: props.class}));

// `data-required` has to sit here rather than on the control: the stylesheet draws the asterisk
// through `[data-required="true"] > .label`, so it reads the field, not the input. `data-empty`
// likewise, because it is what hides the clear button further down the tree.
const displayValidation = computed(() => field.validation.displayValidation.value);
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(field.isDisabled.value)"
    :data-empty="dataAttr(field.isEmpty.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    :data-readonly="dataAttr(field.isReadOnly.value)"
    :data-required="dataAttr(field.isRequired.value)"
    data-slot="search-field"
  >
    <slot
      :is-disabled="field.isDisabled.value"
      :is-empty="field.isEmpty.value"
      :is-invalid="field.isInvalid.value"
      :is-read-only="field.isReadOnly.value"
      :is-required="field.isRequired.value"
      :validation-details="displayValidation.validationDetails"
      :validation-errors="displayValidation.validationErrors"
    />
  </div>
</template>
