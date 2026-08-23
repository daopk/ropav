<script setup lang="ts" vapor>
import type { ProgressCircleRootProps } from "@/components/progress-circle";

import { Label } from "@/components/label";
import { ProgressCircle } from "@/components/progress-circle";

withDefaults(
  defineProps<
    ProgressCircleRootProps & {
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
    <ProgressCircle.Track :class="$props.trackClass" data-testid="track">
      <ProgressCircle.TrackCircle :class="$props.trackCircleClass" data-testid="track-circle" />
      <ProgressCircle.FillCircle :class="$props.fillCircleClass" data-testid="fill-circle" />
    </ProgressCircle.Track>
    <span data-testid="slot-indeterminate">{{ slotProps.isIndeterminate }}</span>
    <span data-testid="slot-percentage">{{ slotProps.percentage }}</span>
    <span data-testid="slot-value-text">{{ slotProps.valueText }}</span>
  </ProgressCircle>
  <span id="ext">External</span>
</template>
