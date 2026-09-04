<script setup lang="ts" vapor>
import type { LabelProps } from "@/components/label";

import { computed } from "vue";

import { Label } from "@/components/label";
import { provideFieldIdsContext, useFieldIds } from "@/composables/use-field-ids";

/**
 * `withFieldIds` stands in for a container that names itself after its label — a collection
 * item or a field root — so the id-claiming path is exercised without depending on one.
 */
const props = defineProps<
  LabelProps & {
    /** Renders the state props as valueless attributes, the way a caller writes them. */
    attributeForm?: boolean;
    /** Id of the control the container names, standing in for a field root's input. */
    controlId?: string;
    labelElementType?: "label" | "span";
    /** A `for` the caller puts on the label itself, to exercise attribute fallthrough. */
    labelFor?: string;
    slots?: ("label" | "description" | "errorMessage" | "heading")[];
    text?: string;
    withFieldIds?: boolean;
  }
>();

const fieldIds = useFieldIds({
  labelElementType: props.labelElementType,
  labelFor: () => props.controlId,
  slots: props.slots,
});

if (props.withFieldIds) provideFieldIdsContext(fieldIds.context);

// Bound as a whole object rather than as a plain `:for`, because a key present in `$attrs`
// suppresses the component's own binding for that key — even when its value is `undefined`.
// Passing `:for` unconditionally would therefore hide the container's control id in every case.
const callerAttrs = computed(() => (props.labelFor ? { for: props.labelFor } : {}));
</script>

<template>
  <div :data-labelled-by="fieldIds.labelId.value">
    <Label
      v-if="props.attributeForm"
      v-bind="callerAttrs"
      :class="props.class"
      is-disabled
      is-invalid
      is-required
    >
      {{ props.text ?? "Email" }}
    </Label>
    <Label
      v-else
      v-bind="callerAttrs"
      :class="props.class"
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :is-required="props.isRequired"
    >
      {{ props.text ?? "Email" }}
    </Label>
  </div>
</template>
