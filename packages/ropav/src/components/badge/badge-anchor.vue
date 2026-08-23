<script setup lang="ts" vapor>
import type { BadgeAnchorProps } from "./badge.types";

import { cx } from "tailwind-variants";
import { computed } from "vue";

const props = defineProps<BadgeAnchorProps>();

defineSlots<{ default?: () => unknown }>();

const styles = computed(() => cx("badge-anchor", props.class));
</script>

<template>
  <span :class="styles" data-slot="badge-anchor">
    <slot />
  </span>
</template>
