<script setup lang="ts" vapor>
import type {LabelRootProps} from "@/components/label";

import {LabelRoot} from "@/components/label";
import {provideFieldIdsContext, useFieldIds} from "@/composables/use-field-ids";

/**
 * `withFieldIds` stands in for a container that names itself after its label — a collection
 * item or a field root — so the id-claiming path is exercised without depending on one.
 */
const props = defineProps<
  LabelRootProps & {
    labelElementType?: "label" | "span";
    labelFor?: string;
    slots?: ("label" | "description" | "errorMessage" | "heading")[];
    text?: string;
    withFieldIds?: boolean;
  }
>();

const fieldIds = useFieldIds({labelElementType: props.labelElementType, slots: props.slots});

if (props.withFieldIds) provideFieldIdsContext(fieldIds.context);
</script>

<template>
  <div :data-labelled-by="fieldIds.labelId.value">
    <LabelRoot
      :class="props.class"
      :for="props.labelFor"
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :is-required="props.isRequired"
    >
      {{ props.text ?? "Email" }}
    </LabelRoot>
  </div>
</template>
