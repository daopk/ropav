<script setup lang="ts" vapor>
import type {CheckboxFixtureProps} from "./fixtures.types";
import type {FormRootProps} from "@/components/form";

import {Form} from "@/components/form";

import CheckboxFixture from "./fixtures.vue";

withDefaults(defineProps<CheckboxFixtureProps & FormRootProps>(), {
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isSelected: undefined,
});
</script>

<template>
  <Form
    :validation-behavior="$props.validationBehavior"
    :validation-errors="$props.validationErrors"
  >
    <CheckboxFixture
      :default-selected="$props.defaultSelected"
      :is-invalid="$props.isInvalid"
      :is-required="$props.isRequired"
      :name="$props.name"
      :validate="$props.validate"
      :value="$props.value"
      :with-custom-error="$props.withCustomError"
      :with-field-error="$props.withFieldError"
    />
    <button data-testid="submit" type="submit">Submit</button>
  </Form>
</template>
