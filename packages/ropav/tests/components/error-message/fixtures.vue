<script setup lang="ts" vapor>
import type { ErrorMessageProps } from "@/components/error-message";

import { Description } from "@/components/description";
import { ErrorMessage } from "@/components/error-message";
import { provideFieldIdsContext, useFieldIds } from "@/composables/use-field-ids";

/** `withDescription` is there to pin the order the field lists the two ids in. */
const props = defineProps<
  ErrorMessageProps & { text?: string; withDescription?: boolean; withFieldIds?: boolean }
>();

const fieldIds = useFieldIds();

if (props.withFieldIds) provideFieldIdsContext(fieldIds.context);
</script>

<template>
  <div :data-described-by="fieldIds.describedBy.value">
    <ErrorMessage :class="props.class">
      {{ props.text ?? "Enter a valid email" }}
    </ErrorMessage>
    <Description v-if="props.withDescription">We never share your address</Description>
  </div>
</template>
