<script setup lang="ts" vapor>
import type {DateInputGroupSuffixProps} from "./date-input-group.types";

import {computed} from "vue";

import {useDateInputGroupContext} from "./date-input-group.context";

const props = defineProps<DateInputGroupSuffixProps>();

const group = useDateInputGroupContext();

const styles = computed(() => group?.slots.value.suffix({class: props.class}) ?? props.class);
</script>

<template>
  <div :class="styles" data-slot="date-input-group-suffix">
    <slot />
  </div>
</template>
