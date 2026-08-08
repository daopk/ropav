<script setup lang="ts" vapor>
import type {InputGroupFixtureProps} from "./fixtures.types";

import {
  InputGroupInput,
  InputGroupPrefix,
  InputGroupRoot,
  InputGroupSuffix,
  InputGroupTextArea,
} from "@/components/input-group";
import {Label} from "@/components/label";
import {TextField} from "@/components/textfield";

// The three-state booleans need explicit `undefined` here too: forwarding a cast `false` would
// claim the state on the caller's behalf and stop the group falling back to the field.
const props = withDefaults(defineProps<InputGroupFixtureProps>(), {
  fieldIsDisabled: undefined,
  fieldIsInvalid: undefined,
  fieldVariant: undefined,
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  variant: undefined,
});
</script>

<template>
  <TextField
    v-if="props.withField"
    aria-label="Website"
    :default-value="props.fieldDefaultValue"
    :is-disabled="props.fieldIsDisabled"
    :is-invalid="props.fieldIsInvalid"
    :variant="props.fieldVariant"
  >
    <Label>Website</Label>
    <InputGroupRoot
      v-if="props.attributeForm"
      :class="props.class"
      full-width
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :is-read-only="props.isReadOnly"
      :variant="props.variant"
    >
      <InputGroupPrefix v-if="props.withPrefix">https://</InputGroupPrefix>
      <InputGroupTextArea v-if="props.withTextArea" :placeholder="props.controlPlaceholder" />
      <InputGroupInput v-else :placeholder="props.controlPlaceholder" />
      <InputGroupSuffix v-if="props.withSuffix">.com</InputGroupSuffix>
    </InputGroupRoot>
    <InputGroupRoot
      v-else
      :class="props.class"
      :full-width="props.fullWidth"
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :is-read-only="props.isReadOnly"
      :variant="props.variant"
    >
      <InputGroupPrefix v-if="props.withPrefix">https://</InputGroupPrefix>
      <InputGroupTextArea
        v-if="props.withTextArea"
        :placeholder="props.controlPlaceholder"
        :value="props.controlValue"
        @change="props.onControlChange"
      />
      <InputGroupInput
        v-else
        :placeholder="props.controlPlaceholder"
        :value="props.controlValue"
        @change="props.onControlChange"
      />
      <InputGroupSuffix v-if="props.withSuffix || props.withSuffixButton">
        <button v-if="props.withSuffixButton" data-testid="suffix-button" type="button">
          Copy
        </button>
        <template v-else>.com</template>
      </InputGroupSuffix>
    </InputGroupRoot>
  </TextField>
  <InputGroupRoot
    v-else
    :class="props.class"
    :full-width="props.fullWidth"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-read-only="props.isReadOnly"
    :variant="props.variant"
  >
    <InputGroupPrefix v-if="props.withPrefix">https://</InputGroupPrefix>
    <InputGroupTextArea
      v-if="props.withTextArea"
      aria-label="Website"
      :placeholder="props.controlPlaceholder"
      :value="props.controlValue"
      @change="props.onControlChange"
    />
    <InputGroupInput
      v-else
      aria-label="Website"
      :placeholder="props.controlPlaceholder"
      :value="props.controlValue"
      @change="props.onControlChange"
    />
    <InputGroupSuffix v-if="props.withSuffix">.com</InputGroupSuffix>
  </InputGroupRoot>
</template>
