<script setup lang="ts" vapor>
import type {FormValidationInputProps} from "./form-validation-input.types";

import {shallowRef} from "vue";

import {useFormValidation} from "@/composables/use-form-validation";
import {useFormValidationState} from "@/composables/use-form-validation-state";

const props = withDefaults(defineProps<FormValidationInputProps>(), {isInvalid: undefined});

const inputEl = shallowRef<HTMLInputElement | null>(null);

const setInputEl = (element: unknown) => {
  inputEl.value = element instanceof HTMLInputElement ? element : null;
  if (inputEl.value) props.onInputElement?.(inputEl.value);
};

const isSelected = shallowRef(false);

const state = useFormValidationState<boolean>({
  isInvalid: () => props.isInvalid,
  name: () => props.name,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => isSelected.value,
});

useFormValidation(inputEl, state, {
  commitOnBlur: () => props.commitOnBlur,
  focus: props.onFocusField,
});

props.onReady?.(state);

const onChange = (event: Event) => {
  isSelected.value = (event.target as HTMLInputElement).checked;
};

// Declared in the template rather than added by the test, so it is attached while the form
// element is created — ahead of the listener `useFormValidation` adds after the flush.
const onReset = (event: Event) => {
  if (props.preventReset) event.preventDefault();
};
</script>

<template>
  <div>
    <form data-testid="form" @reset="onReset">
      <input
        v-if="props.withLeadingInput"
        data-testid="leading"
        name="leading"
        required
        type="text"
      />
      <input
        :ref="setInputEl"
        data-testid="input"
        :disabled="props.isDisabled || undefined"
        :name="props.name"
        :required="props.isRequired || undefined"
        :title="props.title"
        type="checkbox"
        @change="onChange"
      />
      <button data-testid="submit" type="submit">Submit</button>
    </form>
    <span data-testid="display-invalid">{{ String(state.displayValidation.value.isInvalid) }}</span>
  </div>
</template>
