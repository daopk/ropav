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

// Inside a container that names itself after its label — a collection item, a field root —
// the label takes the id the container points `aria-labelledby` at. Standing on its own it
// takes no id, and the caller wires `for`/`id` by hand as they would in plain HTML.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimLabelId();
</script>

<template>
  <label :id="id" :class="styles" data-slot="label">
    <slot />
  </label>
</template>
