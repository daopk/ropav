<script setup lang="ts" vapor>
import type { FieldErrorFixtureProps } from "./fixtures.types";

import { computed } from "vue";

import { FieldError, provideFieldErrorContext } from "@/components/field-error";
import { provideFieldIdsContext, useFieldIds } from "@/composables/use-field-ids";
import {
  CUSTOM_VALIDITY_STATE,
  VALID_VALIDITY_STATE,
} from "@/composables/use-form-validation-state";

const props = defineProps<FieldErrorFixtureProps>();

const { context: fieldIds, describedBy } = useFieldIds({ slots: ["description", "errorMessage"] });

provideFieldIdsContext(fieldIds);

if (!props.withoutField) {
  provideFieldErrorContext({
    validation: computed(() => ({
      isInvalid: Boolean(props.isInvalid),
      validationDetails:
        props.validationDetails ?? (props.isInvalid ? CUSTOM_VALIDITY_STATE : VALID_VALIDITY_STATE),
      validationErrors: props.validationErrors ?? [],
    })),
  });
}
</script>

<template>
  <div :aria-describedby="describedBy" data-testid="field">
    <FieldError v-if="props.withCustomMessage" :class="props.class">
      <template #default="{ validationErrors, validationDetails }">
        <span data-testid="custom"
          >{{ validationErrors.length }} / {{ String(validationDetails.valueMissing) }}</span
        >
      </template>
    </FieldError>
    <FieldError v-else :class="props.class" />
  </div>
</template>
