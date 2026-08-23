<script setup lang="ts" vapor>
import type {MeterFillProps} from "./meter.types";

import {computed} from "vue";

import {composeSlotClassName} from "../../utils/compose";

import {useMeterContext} from "./meter.context";

const props = defineProps<MeterFillProps>();

const {slots, state} = useMeterContext();
const widthStyle = computed(() => ({width: `${state.percentage.value ?? 0}%`}));
</script>

<template>
  <div
    :class="composeSlotClassName(slots.fill, props.class)"
    data-slot="meter-fill"
    :style="[props.style, widthStyle]"
  />
</template>
