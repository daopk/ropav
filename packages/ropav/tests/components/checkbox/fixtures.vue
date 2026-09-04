<script setup lang="ts" vapor>
import type { CheckboxFixtureProps } from "./fixtures.types";

import {
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
} from "@/components/checkbox";
import { Description } from "@/components/description";
import { FieldError } from "@/components/field-error";

// Every boolean that merges with a group, and both three-state props, have to declare an
// explicit `undefined` default here too: forwarding a `false` that Vue cast from an absent
// prop would hand the checkbox a claim the test never made.
withDefaults(defineProps<CheckboxFixtureProps>(), {
  isDisabled: undefined,
  isIndeterminate: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isSelected: undefined,
  variant: undefined,
});

defineEmits<{ change: [isSelected: boolean] }>();
</script>

<template>
  <Checkbox
    :aria-describedby="$props.ariaDescribedby"
    :aria-label="$props.ariaLabel"
    :class="$props.class"
    :default-selected="$props.defaultSelected"
    :form="$props.form"
    :is-disabled="$props.isDisabled"
    :is-indeterminate="$props.isIndeterminate"
    :is-invalid="$props.isInvalid"
    :is-read-only="$props.isReadOnly"
    :is-required="$props.isRequired"
    :is-selected="$props.isSelected"
    :name="$props.name"
    :validate="$props.validate"
    :validation-behavior="$props.validationBehavior"
    :value="$props.value"
    :variant="$props.variant"
    @change="$emit('change', $event)"
  >
    <CheckboxContent>
      <CheckboxControl>
        <CheckboxIndicator>
          <svg v-if="$props.withCustomIndicator" data-testid="custom-indicator" />
        </CheckboxIndicator>
      </CheckboxControl>
      I agree to the terms
    </CheckboxContent>
    <Description v-if="$props.withDescription">You can change this later</Description>
    <FieldError v-if="$props.withCustomError">
      <template #default="{ validationErrors }">
        <span data-testid="custom-error">{{ validationErrors.length }} problem(s)</span>
      </template>
    </FieldError>
    <FieldError v-else-if="$props.withFieldError" />
  </Checkbox>
</template>
