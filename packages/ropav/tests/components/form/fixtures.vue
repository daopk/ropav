<script setup lang="ts" vapor>
import type { FormFixtureProps } from "./fixtures.types";

import { Form } from "@/components/form";

import FormValidationHost from "../../fixtures/form-validation-host.vue";

const props = defineProps<FormFixtureProps>();
</script>

<template>
  <Form
    :class="props.class"
    :validation-behavior="props.validationBehavior"
    :validation-errors="props.validationErrors"
  >
    <FormValidationHost
      :is-invalid="props.field?.isInvalid"
      :name="props.field?.name"
      :on-ready="props.field?.onReady"
      :validate="props.field?.validate"
      :value="props.field?.value"
    />
    <button data-testid="submit" type="submit">Submit</button>
  </Form>
</template>
