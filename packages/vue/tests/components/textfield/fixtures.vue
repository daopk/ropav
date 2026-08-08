<script setup lang="ts" vapor>
import type {TextFieldFixtureProps} from "./fixtures.types";

import {Description} from "@/components/description";
import {FieldError} from "@/components/field-error";
import {Input} from "@/components/input";
import {Label} from "@/components/label";
import {TextArea} from "@/components/textarea";
import {TextField} from "@/components/textfield";

// The three-state booleans need explicit `undefined` here too: forwarding a cast `false`
// would turn the field controlled, or claim it valid, without any test asking for it.
const props = withDefaults(defineProps<TextFieldFixtureProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  variant: undefined,
  withLabel: true,
});
</script>

<template>
  <TextField
    :id="props.id"
    :aria-label="props.ariaLabel"
    :class="props.class"
    :default-value="props.defaultValue"
    :full-width="props.fullWidth"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-read-only="props.isReadOnly"
    :is-required="props.isRequired"
    :name="props.name"
    :placeholder="props.placeholder"
    :type="props.type"
    :validate="props.validate"
    :validation-behavior="props.validationBehavior"
    :value="props.value"
    :variant="props.variant"
    @change="props.onChange"
  >
    <Label v-if="props.withLabel">Email</Label>
    <TextArea
      v-if="props.withTextArea"
      :placeholder="props.controlPlaceholder"
      :variant="props.controlVariant"
    />
    <Input v-else :placeholder="props.controlPlaceholder" :variant="props.controlVariant" />
    <Description v-if="props.withDescription">We will not share it</Description>
    <FieldError v-if="props.withFieldError" />
  </TextField>
</template>
