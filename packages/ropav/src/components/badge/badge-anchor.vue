<script setup lang="ts" vapor>
import type { BadgeAnchorProps } from "./badge.types";

import { badgeVariants } from "@ropav/styles";

import { composeSlotClassName } from "../../utils/compose";

const props = defineProps<BadgeAnchorProps>();

defineSlots<{ default?: () => unknown }>();

// The anchor wraps the root rather than sitting under it, so there is no context to read the
// slots from. No variant reaches this slot, so resolving the recipe with none is the whole of it.
const slots = badgeVariants();
</script>

<template>
  <span :class="composeSlotClassName(slots.anchor, props.class)" data-slot="badge-anchor">
    <slot />
  </span>
</template>
