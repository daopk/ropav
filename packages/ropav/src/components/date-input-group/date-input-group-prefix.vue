<script setup lang="ts" vapor>
import type { DateInputGroupPrefixProps } from "./date-input-group.types";

import { computed } from "vue";

import { useDateInputGroupContext } from "./date-input-group.context";

const props = defineProps<DateInputGroupPrefixProps>();

const group = useDateInputGroupContext();

const styles = computed(() => group?.slots.value.prefix({ class: props.class }) ?? props.class);
</script>

<template>
  <div :class="styles" data-slot="date-input-group-prefix">
    <slot />
  </div>
</template>
