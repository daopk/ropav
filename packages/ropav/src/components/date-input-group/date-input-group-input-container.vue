<script setup lang="ts" vapor>
import type { DateInputGroupInputContainerProps } from "./date-input-group.types";

import { computed } from "vue";

import { useDateInputGroupContext } from "./date-input-group.context";

const props = defineProps<DateInputGroupInputContainerProps>();

const group = useDateInputGroupContext();

const styles = computed(
  () => group?.slots.value.inputContainer({ class: props.class }) ?? props.class,
);
</script>

<template>
  <div :class="styles" data-slot="date-input-group-input-container">
    <slot />
  </div>
</template>
