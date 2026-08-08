<script setup lang="ts" vapor>
import type {SwitchFixtureProps} from "./fixtures.types";
import type {FormRootProps} from "@/components/form";

import {Form} from "@/components/form";

import SwitchFixture from "./fixtures.vue";

withDefaults(defineProps<SwitchFixtureProps & FormRootProps>(), {
  isInvalid: undefined,
  isSelected: undefined,
});
</script>

<template>
  <Form
    :validation-behavior="$props.validationBehavior"
    :validation-errors="$props.validationErrors"
  >
    <SwitchFixture
      :is-invalid="$props.isInvalid"
      :is-required="$props.isRequired"
      :is-selected="$props.isSelected"
      :name="$props.name"
      :validate="$props.validate"
      :with-custom-error="$props.withCustomError"
      :with-field-error="$props.withFieldError"
    />
    <button data-testid="submit" type="submit">Submit</button>
  </Form>
</template>
