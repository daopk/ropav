<script setup lang="ts" vapor>
import type { CheckboxGroupStateHostProps } from "./checkbox-group-state.types";

import { computed } from "vue";

import { useCheckboxGroupState } from "@/composables/use-checkbox-group-state";

import CheckboxGroupStateItem from "./checkbox-group-state-item.vue";

const props = withDefaults(defineProps<CheckboxGroupStateHostProps>(), { isInvalid: undefined });

const state = useCheckboxGroupState({
  defaultValue: () => props.defaultValue,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  name: () => props.name,
  onValueChange: (value) => props.onValueChange?.(value),
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

props.onReady?.(state);

const items = computed(() => props.values ?? []);
</script>

<template>
  <form data-testid="form">
    <CheckboxGroupStateItem
      v-for="itemValue in items"
      :key="itemValue"
      :is-disabled="props.disabledValues?.includes(itemValue)"
      :is-required="state.isItemRequired.value"
      :is-selected="state.isSelected(itemValue)"
      :name="props.name"
      :on-toggle="state.toggleValue"
      :register-input="state.registerInput"
      :value="itemValue"
    />
    <button data-testid="submit" type="submit">Submit</button>
  </form>
</template>
