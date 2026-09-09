<script setup lang="ts" vapor>
import type { TextAreaFixtureProps } from "./fixtures.types";

import { computed } from "vue";

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

// Only the native attrs that were actually set. Binding `:rows="undefined"` fallthrough
// would pin the UA default of two and overwrite `minRows` written onto the element.
const native = computed(() => {
  const next: Record<string, unknown> = {};

  if (props.disabled !== undefined) next["disabled"] = props.disabled;
  if (props.required !== undefined) next["required"] = props.required;
  if (props.rows !== undefined) next["rows"] = props.rows;

  return next;
});
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
        v-bind="native"
        :autosize="props.autosize"
        :class="props.class"
        :full-width="props.fullWidth"
        :max-rows="props.maxRows"
        :min-rows="props.minRows"
        :placeholder="props.placeholder"
        :resize="props.resize"
        :value="props.value"
        :variant="props.variant"
        @change="$emit('change', $event)"
        @update:value="$emit('update:value', $event)"
      />
    </TextField>
    <TextArea
      v-else
      v-bind="native"
      :autosize="props.autosize"
      :class="props.class"
      :full-width="props.fullWidth"
      :max-rows="props.maxRows"
      :min-rows="props.minRows"
      :placeholder="props.placeholder"
      :resize="props.resize"
      :value="props.value"
      :variant="props.variant"
      @change="$emit('change', $event)"
      @update:value="$emit('update:value', $event)"
    />
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
  </component>
</template>
