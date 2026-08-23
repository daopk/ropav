<script setup lang="ts" vapor>
import type { SwitchControlProps } from "./switch.types";

import { composeSlotClassName } from "../../utils/compose";

import { useSwitchContext } from "./switch.context";

const props = defineProps<SwitchControlProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useSwitchContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.control, props.class)" data-slot="switch-control">
    <slot />
  </span>
</template>
