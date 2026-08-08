<script setup lang="ts" vapor>
import type {SwitchIconProps} from "./switch.types";

import {composeSlotClassName} from "../../utils/compose";

import {useSwitchContext} from "./switch.context";

const props = defineProps<SwitchIconProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useSwitchContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.icon, props.class)" data-slot="switch-icon">
    <slot />
  </span>
</template>
