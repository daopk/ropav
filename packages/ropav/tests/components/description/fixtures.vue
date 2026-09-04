<script setup lang="ts" vapor>
import type { DescriptionProps } from "@/components/description";

import { Description } from "@/components/description";
import { provideFieldIdsContext, useFieldIds } from "@/composables/use-field-ids";

/** `withFieldIds` stands in for a container that describes itself by its help text. */
const props = defineProps<DescriptionProps & { text?: string; withFieldIds?: boolean }>();

const fieldIds = useFieldIds();

if (props.withFieldIds) provideFieldIdsContext(fieldIds.context);
</script>

<template>
  <div :data-described-by="fieldIds.describedBy.value">
    <Description :class="props.class">
      {{ props.text ?? "We never share your address" }}
    </Description>
  </div>
</template>
