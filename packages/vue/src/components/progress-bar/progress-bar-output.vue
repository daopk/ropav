<script setup lang="ts" vapor>
import type {ProgressBarOutputProps} from "./progress-bar.types";

import {composeSlotClassName} from "../../utils/compose";

import {useProgressBarContext} from "./progress-bar.context";

const props = defineProps<ProgressBarOutputProps>();

defineSlots<{default?: () => unknown}>();

const {slots, state} = useProgressBarContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.output, props.class)" data-slot="progress-bar-output">
    <slot>{{ state.valueText.value }}</slot>
  </span>
</template>
