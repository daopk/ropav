<script setup lang="ts">
import {
  Label,
  NumberField,
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
} from "ropav";
</script>

<template>
  <div class="flex flex-col gap-4">
    <NumberField class="w-48" :default-value="1024" :min-value="0" name="width">
      <Label>Width</Label>
      <NumberFieldGroup>
        <NumberFieldDecrementButton />
        <NumberFieldInput />
        <NumberFieldIncrementButton />
      </NumberFieldGroup>
    </NumberField>

    <NumberField
      class="w-48"
      :default-value="0.15"
      :format-options="{ style: 'percent' }"
      name="rate"
      :step="0.01"
    >
      <Label>Rate</Label>
      <NumberFieldGroup>
        <NumberFieldDecrementButton />
        <NumberFieldInput />
        <NumberFieldIncrementButton />
      </NumberFieldGroup>
    </NumberField>
  </div>
</template>
