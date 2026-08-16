<script setup lang="ts" vapor>
import type {BadgeLabelProps} from "./badge.types";

import {composeSlotClassName} from "../../utils/compose";

import {useBadgeContext} from "./badge.context";

const props = defineProps<BadgeLabelProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useBadgeContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.label, props.class)" data-slot="badge-label">
    <slot />
  </span>
</template>
