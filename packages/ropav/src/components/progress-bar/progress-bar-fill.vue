<script setup lang="ts" vapor>
import type {ProgressBarFillProps} from "./progress-bar.types";

import {computed} from "vue";

import {composeSlotClassName} from "../../utils/compose";

import {useProgressBarContext} from "./progress-bar.context";

const props = defineProps<ProgressBarFillProps>();

const {slots, state} = useProgressBarContext();
const widthStyle = computed(() =>
  state.isIndeterminate.value ? {width: undefined} : {width: `${state.percentage.value ?? 0}%`},
);
</script>

<template>
  <div
    :class="composeSlotClassName(slots.fill, props.class)"
    data-slot="progress-bar-fill"
    :style="[props.style, widthStyle]"
  />
</template>
