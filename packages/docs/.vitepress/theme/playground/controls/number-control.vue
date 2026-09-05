<script setup lang="ts">
import type { ControlSpec } from "../../../playgrounds/types";

import {
  Label,
  NumberField,
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
} from "ropav";

defineProps<{ control: ControlSpec }>();

const value = defineModel<number | undefined>({ required: true });
</script>

<template>
  <NumberField v-model:value="value" full-width size="sm">
    <Label>{{ control.name }}</Label>
    <NumberFieldGroup>
      <NumberFieldDecrementButton />
      <NumberFieldInput />
      <NumberFieldIncrementButton />
    </NumberFieldGroup>
  </NumberField>
</template>
