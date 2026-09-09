<script setup lang="ts" vapor>
import type { TextAreaFixtureProps } from "./fixtures.types";

import { TextArea } from "@/components/textarea";
import { TextField } from "@/components/textfield";

const props = withDefaults(defineProps<TextAreaFixtureProps>(), {
  autosize: undefined,
  fullWidth: undefined,
  isFieldDisabled: undefined,
  isFieldInvalid: undefined,
  maxRows: undefined,
  minRows: undefined,
  resize: undefined,
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
        :autosize="props.autosize"
        :class="props.class"
        :disabled="props.disabled"
        :full-width="props.fullWidth"
        :max-rows="props.maxRows"
        :min-rows="props.minRows"
        :placeholder="props.placeholder"
        :required="props.required"
        :resize="props.resize"
        :rows="props.rows"
        :value="props.value"
        :variant="props.variant"
        @change="$emit('change', $event)"
        @update:value="$emit('update:value', $event)"
      />
    </TextField>
    <TextArea
      v-else
      :autosize="props.autosize"
      :class="props.class"
      :disabled="props.disabled"
      :full-width="props.fullWidth"
      :max-rows="props.maxRows"
      :min-rows="props.minRows"
      :placeholder="props.placeholder"
      :required="props.required"
      :resize="props.resize"
      :rows="props.rows"
      :value="props.value"
      :variant="props.variant"
      @change="$emit('change', $event)"
      @update:value="$emit('update:value', $event)"
    />
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
  </component>
</template>
