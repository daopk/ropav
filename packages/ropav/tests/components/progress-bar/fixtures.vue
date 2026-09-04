<script setup lang="ts" vapor>
import type { ProgressBarProps } from "@/components/progress-bar";

import { Label } from "@/components/label";
import {
  ProgressBar,
  ProgressBarFill,
  ProgressBarOutput,
  ProgressBarTrack,
} from "@/components/progress-bar";

withDefaults(
  defineProps<
    ProgressBarProps & {
      customOutput?: boolean;
      fillClass?: string;
      outputClass?: string;
      trackClass?: string;
      withLabel?: boolean;
    }
  >(),
  {
    fillClass: undefined,
    isIndeterminate: undefined,
    outputClass: undefined,
    trackClass: undefined,
    withLabel: true,
  },
);
</script>

<template>
  <ProgressBar
    :id="$props.id"
    v-slot="slotProps"
    :aria-describedby="$props.ariaDescribedby"
    :aria-label="$props.ariaLabel"
    :aria-labelledby="$props.ariaLabelledby"
    :class="$props.class"
    :color="$props.color"
    data-testid="root"
    :format-options="$props.formatOptions"
    :is-animated="$props.isAnimated"
    :is-indeterminate="$props.isIndeterminate"
    :is-striped="$props.isStriped"
    :max-value="$props.maxValue"
    :min-value="$props.minValue"
    :size="$props.size"
    :value="$props.value"
    :value-label="$props.valueLabel"
  >
    <Label v-if="$props.withLabel">Loading</Label>
    <ProgressBarOutput v-if="$props.customOutput" :class="$props.outputClass" data-testid="output">
      Custom
    </ProgressBarOutput>
    <ProgressBarOutput v-else :class="$props.outputClass" data-testid="output" />
    <ProgressBarTrack :class="$props.trackClass" data-testid="track">
      <ProgressBarFill
        :class="$props.fillClass"
        data-testid="fill"
        :style="{ backgroundColor: 'red', width: '1%' }"
      />
    </ProgressBarTrack>
    <span data-testid="slot-indeterminate">{{ slotProps.isIndeterminate }}</span>
    <span data-testid="slot-percentage">{{ slotProps.percentage }}</span>
    <span data-testid="slot-value-text">{{ slotProps.valueText }}</span>
  </ProgressBar>
  <span id="ext">External</span>
</template>
