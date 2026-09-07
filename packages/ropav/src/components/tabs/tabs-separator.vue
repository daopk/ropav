<script setup lang="ts" vapor>
import type { TabsSeparatorProps } from "./tabs.types";

const props = defineProps<TabsSeparatorProps>();
</script>

<template>
  <span
    aria-hidden="true"
    :class="['rp-tabs__separator', props.class]"
    data-slot="tabs-separator"
  />
</template>
