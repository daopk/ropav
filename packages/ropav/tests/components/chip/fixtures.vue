<script setup lang="ts" vapor>
import type { ChipRootProps } from "@/components/chip";

import { Chip } from "@/components/chip";

/**
 * `content` picks which shape of children the chip is handed, which is the thing under
 * test: React decides whether to wrap by looking at the children it was given.
 */
defineProps<
  ChipRootProps & {
    content?: "text" | "number" | "explicit" | "icon" | "none";
    label?: string;
  }
>();
</script>

<template>
  <Chip :class="$props.class" :color="$props.color" :size="$props.size" :variant="$props.variant">
    <template v-if="$props.content === 'explicit'">
      <Chip.Label>Explicit label</Chip.Label>
    </template>
    <template v-else-if="$props.content === 'icon'">
      <svg data-testid="leading-icon" />
      <Chip.Label>Explicit label</Chip.Label>
    </template>
    <template v-else-if="$props.content === 'number'">24</template>
    <template v-else-if="$props.content !== 'none'">{{ $props.label ?? "Label" }}</template>
  </Chip>
</template>
