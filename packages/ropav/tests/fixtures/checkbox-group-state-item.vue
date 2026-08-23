<script setup lang="ts" vapor>
import {shallowRef} from "vue";

import {useValidationInput} from "@/composables/use-form-validation";

const props = defineProps<{
  value: string;
  name?: string;
  isSelected: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  registerInput: (input: HTMLInputElement) => () => void;
  onToggle: (value: string, isSelected: boolean) => void;
}>();

const inputEl = shallowRef<HTMLInputElement | null>(null);

const setInputEl = (element: unknown) => {
  inputEl.value = element instanceof HTMLInputElement ? element : null;
};

// An item registers exactly the way a real one does, so the registry empties when it goes.
useValidationInput(inputEl, props.registerInput);

const onChange = (event: Event) => {
  props.onToggle(props.value, (event.target as HTMLInputElement).checked);
};
</script>

<template>
  <input
    :ref="setInputEl"
    :checked="props.isSelected"
    :data-testid="`input-${props.value}`"
    :disabled="props.isDisabled || undefined"
    :name="props.name"
    :required="props.isRequired || undefined"
    type="checkbox"
    :value="props.value"
    @change="onChange"
  />
</template>
