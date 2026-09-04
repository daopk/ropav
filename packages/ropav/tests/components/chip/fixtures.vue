<script setup lang="ts" vapor>
import type { ChipProps } from "@/components/chip";

import { Chip, ChipLabel } from "@/components/chip";

/**
 * `content` picks which shape of children the chip is handed, which is the thing under
 * test: React decides whether to wrap by looking at the children it was given.
 */
defineProps<
  ChipProps & {
    content?: "text" | "number" | "explicit" | "icon" | "none";
    label?: string;
  }
>();
</script>

<template>
  <Chip :class="$props.class" :color="$props.color" :size="$props.size" :variant="$props.variant">
    <template v-if="$props.content === 'explicit'">
      <ChipLabel>Explicit label</ChipLabel>
    </template>
    <template v-else-if="$props.content === 'icon'">
      <svg data-testid="leading-icon" />
      <ChipLabel>Explicit label</ChipLabel>
    </template>
    <template v-else-if="$props.content === 'number'">24</template>
    <template v-else-if="$props.content !== 'none'">{{ $props.label ?? "Label" }}</template>
  </Chip>
</template>
