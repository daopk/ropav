<script setup lang="ts" vapor>
import type {ChipRootProps} from "./chip.types";

import {chipVariants} from "@heroui/styles";
import {computed} from "vue";

import ChipLabel from "./chip-label.vue";
import {provideChipContext} from "./chip.context";

const props = defineProps<ChipRootProps>();

defineSlots<{default?: () => unknown}>();

const slots = computed(() =>
  chipVariants({color: props.color, size: props.size, variant: props.variant}),
);

provideChipContext({slots});
</script>

<template>
  <span :class="slots.base({class: props.class})" data-slot="chip">
    <!--
      Slot fallback, not a check on the slot's contents: reading a slot in Vapor renders
      it, so the `label` shorthand is expressed as what renders when nothing is passed.
    -->
    <slot>
      <ChipLabel>{{ props.label }}</ChipLabel>
    </slot>
  </span>
</template>
