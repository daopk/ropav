<script setup lang="ts" vapor>
import type { SwitchThumbProps } from "./switch.types";

import { composeSlotClassName } from "../../utils/compose";

import { useSwitchContext } from "./switch.context";

const props = defineProps<SwitchThumbProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useSwitchContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.thumb, props.class)" data-slot="switch-thumb">
    <slot />
  </span>
</template>
