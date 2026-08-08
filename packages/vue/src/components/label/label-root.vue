<script setup lang="ts" vapor>
import type {LabelRootProps} from "./label.types";

import {labelVariants} from "@heroui/styles";
import {computed} from "vue";

import {useFieldIdsContext} from "../../composables/use-field-ids";

const props = defineProps<LabelRootProps>();

defineSlots<{default?: () => unknown}>();

const styles = computed(() =>
  labelVariants({
    class: props.class,
    isDisabled: props.isDisabled,
    isInvalid: props.isInvalid,
    isRequired: props.isRequired,
  }),
);

// Inside a container that names itself after its label — a field root, a section — the label
// takes the id the container points `aria-labelledby` at, and renders as whatever element that
// container needs. A container that does not reference a label hands out no id, so the markup
// never grows an attribute nothing points at.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimLabelId();
// `label` implies a labelable form control to point at, which a composite like a tag group has
// none of, so such a field asks for a `span` instead.
const isSpan = computed(() => fieldIds?.labelElementType === "span");
// Only a real `label` can carry `for`, and only a field that lays its control out beside the
// label supplies one — a checkbox keeps its input inside the label, so a click already lands.
const labelFor = computed(() => fieldIds?.labelFor.value);
</script>

<template>
  <span v-if="isSpan" :id="id" :class="styles" data-slot="label">
    <slot />
  </span>
  <label v-else :id="id" :class="styles" data-slot="label" :for="labelFor">
    <slot />
  </label>
</template>
