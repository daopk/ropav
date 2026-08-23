<script setup lang="ts" vapor>
import type { FieldsetLegendProps } from "./fieldset.types";

import { computed } from "vue";

import { useFieldsetContext } from "./fieldset.context";

const props = defineProps<FieldsetLegendProps>();

const fieldset = useFieldsetContext();

const styles = computed(() => fieldset?.slots.value.legend({ class: props.class }) ?? props.class);
</script>

<template>
  <legend :class="styles" data-slot="fieldset-legend">
    <slot />
  </legend>
</template>
