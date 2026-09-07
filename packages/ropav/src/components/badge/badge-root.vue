<script setup lang="ts" vapor>
import type { BadgeRootProps } from "./badge.types";

import { badgeVariants } from "@ropav/styles";
import { computed } from "vue";

import { composeSlotClassName } from "../../utils/compose";

import BadgeAutoLabel from "./badge-auto-label";

const props = defineProps<BadgeRootProps>();

defineSlots<{ default?: () => unknown }>();

const slots = computed(() =>
  badgeVariants({
    color: props.color,
    placement: props.placement,
    size: props.size,
    variant: props.variant,
  }),
);
</script>

<template>
  <span :class="composeSlotClassName(slots.base, props.class)" data-slot="badge">
    <BadgeAutoLabel>
      <slot />
    </BadgeAutoLabel>
  </span>
</template>
