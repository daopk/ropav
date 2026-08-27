<script setup lang="ts" vapor>
import type { TextAreaFixtureProps } from "./fixtures.types";

import { TextArea } from "@/components/textarea";
import { TextField } from "@/components/textfield";

const props = withDefaults(defineProps<TextAreaFixtureProps>(), {
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
      <TextArea
        :class="props.class"
        :disabled="props.disabled"
        :full-width="props.fullWidth"
        :placeholder="props.placeholder"
        :required="props.required"
        :rows="props.rows"
        :value="props.value"
        :variant="props.variant"
        @change="$emit('change', $event)"
        @update:value="$emit('update:value', $event)"
      />
    </TextField>
    <TextArea
      v-else
      :class="props.class"
      :disabled="props.disabled"
      :full-width="props.fullWidth"
      :placeholder="props.placeholder"
      :required="props.required"
      :rows="props.rows"
      :value="props.value"
      :variant="props.variant"
      @change="$emit('change', $event)"
      @update:value="$emit('update:value', $event)"
    />
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
  </component>
</template>
