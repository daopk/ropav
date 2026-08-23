<script setup lang="ts" vapor>
import type { NumberFieldFixtureProps } from "./fixtures.types";

import { Description } from "@/components/description";
import { FieldError } from "@/components/field-error";
import { Label } from "@/components/label";
import {
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot,
} from "@/components/number-field";

// The three-state booleans need explicit `undefined` here too: forwarding a cast `false` would
// turn the field controlled, or claim it valid, without any test asking for it.
const props = withDefaults(defineProps<NumberFieldFixtureProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isWheelDisabled: undefined,
  variant: undefined,
  withDecrement: true,
  withIncrement: true,
  withLabel: true,
});
</script>

<template>
  <NumberFieldRoot
    v-if="props.attributeForm"
    aria-label="Quantity"
    :default-value="props.defaultValue"
    full-width
    :locale="props.locale"
  >
    <NumberFieldGroup>
      <NumberFieldDecrementButton v-if="props.withDecrement" />
      <NumberFieldInput />
      <NumberFieldIncrementButton v-if="props.withIncrement" />
    </NumberFieldGroup>
  </NumberFieldRoot>
  <NumberFieldRoot
    v-else
    :aria-label="props.withLabel ? undefined : 'Quantity'"
    :class="props.class"
    :commit-behavior="props.commitBehavior"
    :decrement-aria-label="props.decrementAriaLabel"
    :default-value="props.defaultValue"
    :format-options="props.formatOptions"
    :full-width="props.fullWidth"
    :increment-aria-label="props.incrementAriaLabel"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-read-only="props.isReadOnly"
    :is-required="props.isRequired"
    :is-wheel-disabled="props.isWheelDisabled"
    :locale="props.locale"
    :max-value="props.maxValue"
    :min-value="props.minValue"
    :name="props.name"
    :step="props.step"
    :validate="props.validate"
    :validation-behavior="props.validationBehavior"
    :value="props.value"
    :variant="props.variant"
    @change="props.onChange"
  >
    <Label v-if="props.withLabel">Quantity</Label>
    <NumberFieldGroup>
      <NumberFieldDecrementButton v-if="props.withDecrement && props.customIcons">
        <span data-testid="custom-decrement">less</span>
      </NumberFieldDecrementButton>
      <NumberFieldDecrementButton v-else-if="props.withDecrement" />
      <NumberFieldInput />
      <NumberFieldIncrementButton v-if="props.withIncrement && props.customIcons">
        <span data-testid="custom-increment">more</span>
      </NumberFieldIncrementButton>
      <NumberFieldIncrementButton v-else-if="props.withIncrement" />
    </NumberFieldGroup>
    <Description v-if="props.withDescription">How many you want</Description>
    <FieldError v-if="props.withFieldError" />
  </NumberFieldRoot>
</template>
