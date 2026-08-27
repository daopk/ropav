<script setup lang="ts" vapor>
import type { InputFixtureProps } from "./fixtures.types";

import { Input } from "@/components/input";
import { TextField } from "@/components/textfield";

const props = withDefaults(defineProps<InputFixtureProps>(), {
  fullWidth: undefined,
  isFieldDisabled: undefined,
  isFieldInvalid: undefined,
  value: undefined,
  variant: undefined,
});

defineEmits<{ change: [value: string]; "update:value": [value: string] }>();
</script>

<template>
  <component :is="props.withForm ? 'form' : 'div'">
    <TextField
      v-if="props.inField"
      :is-disabled="props.isFieldDisabled"
      :is-invalid="props.isFieldInvalid"
      :placeholder="props.fieldPlaceholder"
      :value="props.fieldValue"
      :variant="props.fieldVariant"
    >
      <Input
        :class="props.class"
        :disabled="props.disabled"
        :full-width="props.fullWidth"
        :placeholder="props.placeholder"
        :required="props.required"
        :type="props.type"
        :value="props.value"
        :variant="props.variant"
        @change="$emit('change', $event)"
        @update:value="$emit('update:value', $event)"
      />
    </TextField>
    <Input
      v-else
      :class="props.class"
      :disabled="props.disabled"
      :full-width="props.fullWidth"
      :placeholder="props.placeholder"
      :required="props.required"
      :type="props.type"
      :value="props.value"
      :variant="props.variant"
      @change="$emit('change', $event)"
      @update:value="$emit('update:value', $event)"
    />
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
  </component>
</template>
