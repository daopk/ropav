<script setup lang="ts" vapor>
import type {MeterTrackProps} from "./meter.types";

import {composeSlotClassName} from "../../utils/compose";

import {useMeterContext} from "./meter.context";

const props = defineProps<MeterTrackProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useMeterContext();
</script>

<template>
  <div :class="composeSlotClassName(slots.track, props.class)" data-slot="meter-track">
    <slot />
  </div>
</template>
