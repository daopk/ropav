<script setup lang="ts" vapor>
import type {DescriptionRootProps} from "@/components/description";

import {DescriptionRoot} from "@/components/description";
import {provideFieldIdsContext, useFieldIds} from "@/composables/use-field-ids";

/** `withFieldIds` stands in for a container that describes itself by its help text. */
const props = defineProps<DescriptionRootProps & {text?: string; withFieldIds?: boolean}>();

const fieldIds = useFieldIds();

if (props.withFieldIds) provideFieldIdsContext(fieldIds.context);
</script>

<template>
  <div :data-described-by="fieldIds.describedBy.value">
    <DescriptionRoot :class="props.class">
      {{ props.text ?? "We never share your address" }}
    </DescriptionRoot>
  </div>
</template>
