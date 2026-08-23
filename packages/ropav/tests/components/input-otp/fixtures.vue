<script setup lang="ts" vapor>
import type {InputOTPFixtureProps} from "./fixtures.types";

import {Description} from "@/components/description";
import {FieldError} from "@/components/field-error";
import {InputOTPGroup, InputOTPRoot, InputOTPSeparator, InputOTPSlot} from "@/components/input-otp";
import {Label} from "@/components/label";

// `isDisabled` and `isInvalid` are left to cast, as the component does: nothing sits above the
// field to inherit them from, so a cast `false` says exactly what an absent prop says.
// The field error goes *inside* the field, which is where the verdict is published — the same as
// React, whose provider wraps the engine rather than sitting above it.
const passThrough = (pasted: string) => pasted;

const props = withDefaults(defineProps<InputOTPFixtureProps>(), {
  maxLength: 6,
  variant: undefined,
  withSeparator: true,
});
</script>

<template>
  <component :is="props.withForm ? 'form' : 'div'">
    <Label v-if="props.withLabel">Verify account</Label>
    <InputOTPRoot
      :id="props.id"
      :aria-describedby="props.ariaDescribedby"
      :aria-label="props.ariaLabel"
      :class="props.class"
      :default-value="props.defaultValue"
      :input-class="props.inputClass"
      :input-mode="props.inputMode"
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :max-length="props.maxLength"
      :name="props.name"
      :paste-transformer="props.withPasteTransformer ? passThrough : props.pasteTransformer"
      :pattern="props.pattern"
      :placeholder="props.placeholder"
      :text-align="props.textAlign"
      :validation-details="props.validationDetails"
      :validation-errors="props.validationErrors"
      :value="props.value"
      :variant="props.variant"
      @change="props.onChange"
      @complete="props.onComplete"
    >
      <InputOTPGroup>
        <InputOTPSlot :index="0" />
        <InputOTPSlot :index="1" />
        <InputOTPSlot :index="2" />
      </InputOTPGroup>
      <InputOTPSeparator v-if="props.withSeparator" />
      <InputOTPGroup>
        <InputOTPSlot :index="3" />
        <InputOTPSlot :index="4" />
        <InputOTPSlot :index="5" />
        <InputOTPSlot v-if="props.withExtraSlot" :index="6" />
      </InputOTPGroup>
      <FieldError v-if="props.withFieldError" />
    </InputOTPRoot>
    <Description v-if="props.withDescription">Enter the code we sent you</Description>
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
    <button v-if="props.withForm" data-testid="submit" type="submit">Submit</button>
  </component>
</template>
