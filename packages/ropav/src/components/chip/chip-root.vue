<script setup lang="ts" vapor>
import type { ChipRootProps } from "./chip.types";

import { chipVariants } from "@ropav/styles";
import { computed } from "vue";

import ChipAutoLabel from "./chip-auto-label";
import { provideChipContext } from "./chip.context";

const props = defineProps<ChipRootProps>();

defineSlots<{ default?: () => unknown }>();

const slots = computed(() =>
  chipVariants({ color: props.color, size: props.size, variant: props.variant }),
);

provideChipContext({ slots });
</script>

<template>
  <span :class="slots.base({ class: props.class })" data-slot="chip">
    <ChipAutoLabel>
      <slot />
    </ChipAutoLabel>
  </span>
</template>
