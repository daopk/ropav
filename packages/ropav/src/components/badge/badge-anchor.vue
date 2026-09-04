<script setup lang="ts" vapor>
import type { BadgeAnchorProps } from "./badge.types";

const props = defineProps<BadgeAnchorProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['badge-anchor', props.class]" data-slot="badge-anchor">
    <slot />
  </span>
</template>
