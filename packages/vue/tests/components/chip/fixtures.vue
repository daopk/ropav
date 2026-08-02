<script setup lang="ts" vapor>
import type {ChipRootProps} from "@/components/chip";

import {Chip} from "@/components/chip";

defineProps<ChipRootProps & {withSlot?: boolean}>();
</script>

<template>
  <Chip
    :class="$props.class"
    :color="$props.color"
    :label="$props.label"
    :size="$props.size"
    :variant="$props.variant"
  >
    <template v-if="$props.withSlot">
      <svg data-testid="leading-icon" />
      <Chip.Label>Explicit label</Chip.Label>
    </template>
  </Chip>
</template>
