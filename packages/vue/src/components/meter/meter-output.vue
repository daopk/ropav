<script setup lang="ts" vapor>
import type {MeterOutputProps} from "./meter.types";

import {composeSlotClassName} from "../../utils/compose";

import {useMeterContext} from "./meter.context";

const props = defineProps<MeterOutputProps>();

defineSlots<{default?: () => unknown}>();

const {slots, state} = useMeterContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.output, props.class)" data-slot="meter-output">
    <slot>{{ state.valueText.value }}</slot>
  </span>
</template>
