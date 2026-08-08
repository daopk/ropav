<script setup lang="ts" vapor>
import type {TextFieldFormFixtureProps} from "./fixtures.types";

import {Form} from "@/components/form";

import TextFieldFixture from "./fixtures.vue";

withDefaults(defineProps<TextFieldFormFixtureProps>(), {
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
});
</script>

<template>
  <Form
    :validation-behavior="$props.validationBehavior"
    :validation-errors="$props.validationErrors"
  >
    <TextFieldFixture
      :default-value="$props.defaultValue"
      :is-invalid="$props.isInvalid"
      :is-required="$props.isRequired"
      :name="$props.name"
      :type="$props.type"
      :validate="$props.validate"
      :with-field-error="$props.withFieldError"
      :with-text-area="$props.withTextArea"
    />
    <button data-testid="submit" type="submit">Submit</button>
  </Form>
</template>
