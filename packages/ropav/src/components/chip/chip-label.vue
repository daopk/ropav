<script setup lang="ts" vapor>
import type { ChipLabelProps } from "./chip.types";

import { composeSlotClassName } from "../../utils/compose";

import { useChipContext } from "./chip.context";

const props = defineProps<ChipLabelProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useChipContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.label, props.class)" data-slot="chip-label">
    <slot />
  </span>
</template>
