<script setup lang="ts" vapor>
import type {FieldErrorRootProps, FieldErrorSlotProps} from "./field-error.types";

import {computed} from "vue";

import {DEFAULT_VALIDATION_RESULT} from "../../composables/use-form-validation-state";

import FieldErrorContent from "./field-error-content.vue";
import {useFieldErrorContext} from "./field-error.context";

const props = defineProps<FieldErrorRootProps>();

defineSlots<{default?: (props: FieldErrorSlotProps) => unknown}>();

const fieldError = useFieldErrorContext();

const validation = computed(() => fieldError?.validation.value ?? DEFAULT_VALIDATION_RESULT);

const isInvalid = computed(() => validation.value.isInvalid);

// Joined rather than listed: the field points `aria-describedby` at this one element, so
// every message it holds has to be readable as a single description.
const message = computed(() => validation.value.validationErrors.join(" "));
</script>

<template>
  <FieldErrorContent v-if="isInvalid" :class="props.class">
    <slot
      :validation-details="validation.validationDetails"
      :validation-errors="validation.validationErrors"
    >
      {{ message }}
    </slot>
  </FieldErrorContent>
</template>
