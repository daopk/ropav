<script setup lang="ts" vapor>
import type { ErrorMessageRootProps } from "@/components/error-message";

import { DescriptionRoot } from "@/components/description";
import { ErrorMessageRoot } from "@/components/error-message";
import { provideFieldIdsContext, useFieldIds } from "@/composables/use-field-ids";

/** `withDescription` is there to pin the order the field lists the two ids in. */
const props = defineProps<
  ErrorMessageRootProps & { text?: string; withDescription?: boolean; withFieldIds?: boolean }
>();

const fieldIds = useFieldIds();

if (props.withFieldIds) provideFieldIdsContext(fieldIds.context);
</script>

<template>
  <div :data-described-by="fieldIds.describedBy.value">
    <ErrorMessageRoot :class="props.class">
      {{ props.text ?? "Enter a valid email" }}
    </ErrorMessageRoot>
    <DescriptionRoot v-if="props.withDescription">We never share your address</DescriptionRoot>
  </div>
</template>
