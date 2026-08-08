<script setup lang="ts" vapor>
import type {RadioControlProps} from "./radio.types";

import {composeSlotClassName} from "../../utils/compose";

import {useRadioContext} from "./radio.context";

const props = defineProps<RadioControlProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useRadioContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.control, props.class)" data-slot="radio-control">
    <slot />
  </span>
</template>
