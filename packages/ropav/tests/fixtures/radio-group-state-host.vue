<script setup lang="ts" vapor>
import type {RadioGroupStateHostProps} from "./radio-group-state.types";

import {computed} from "vue";

import {useRadioGroupState} from "@/composables/use-radio-group-state";

const props = withDefaults(defineProps<RadioGroupStateHostProps>(), {isInvalid: undefined});

const state = useRadioGroupState({
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

const isNative = computed(() => state.validation.validationBehavior.value === "native");

const onChange = (itemValue: string) => {
  state.setSelectedValue(itemValue);
};
</script>

<template>
  <form data-testid="form">
    <input
      v-for="itemValue in items"
      :key="itemValue"
      :checked="state.selectedValue.value === itemValue"
      :data-testid="`input-${itemValue}`"
      :name="state.name.value"
      :required="(state.isRequired.value && isNative) || undefined"
      type="radio"
      :value="itemValue"
      @change="onChange(itemValue)"
    />
    <button data-testid="submit" type="submit">Submit</button>
  </form>
</template>
