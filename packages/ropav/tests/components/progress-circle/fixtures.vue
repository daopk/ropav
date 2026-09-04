<script setup lang="ts" vapor>
import type { ProgressCircleProps } from "@/components/progress-circle";

import { Label } from "@/components/label";
import {
  ProgressCircle,
  ProgressCircleFillCircle,
  ProgressCircleTrack,
  ProgressCircleTrackCircle,
} from "@/components/progress-circle";

withDefaults(
  defineProps<
    ProgressCircleProps & {
      fillCircleClass?: string;
      trackCircleClass?: string;
      trackClass?: string;
      withLabel?: boolean;
    }
  >(),
  {
    fillCircleClass: undefined,
    isIndeterminate: undefined,
    trackCircleClass: undefined,
    trackClass: undefined,
  },
);
</script>

<template>
  <ProgressCircle
    :id="$props.id"
    v-slot="slotProps"
    :aria-describedby="$props.ariaDescribedby"
    :aria-label="$props.ariaLabel"
    :aria-labelledby="$props.ariaLabelledby"
    :class="$props.class"
    :color="$props.color"
    data-testid="root"
    :format-options="$props.formatOptions"
    :is-indeterminate="$props.isIndeterminate"
    :max-value="$props.maxValue"
    :min-value="$props.minValue"
    :size="$props.size"
    :value="$props.value"
    :value-label="$props.valueLabel"
  >
    <Label v-if="$props.withLabel">Loading</Label>
    <ProgressCircleTrack :class="$props.trackClass" data-testid="track">
      <ProgressCircleTrackCircle :class="$props.trackCircleClass" data-testid="track-circle" />
      <ProgressCircleFillCircle :class="$props.fillCircleClass" data-testid="fill-circle" />
    </ProgressCircleTrack>
    <span data-testid="slot-indeterminate">{{ slotProps.isIndeterminate }}</span>
    <span data-testid="slot-percentage">{{ slotProps.percentage }}</span>
    <span data-testid="slot-value-text">{{ slotProps.valueText }}</span>
  </ProgressCircle>
  <span id="ext">External</span>
</template>
