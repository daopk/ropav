<script setup lang="ts" vapor>
import type { ProgressBarRootProps } from "@/components/progress-bar";

import { Label } from "@/components/label";
import { ProgressBar } from "@/components/progress-bar";

withDefaults(
  defineProps<
    ProgressBarRootProps & {
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
    :is-indeterminate="$props.isIndeterminate"
    :max-value="$props.maxValue"
    :min-value="$props.minValue"
    :size="$props.size"
    :value="$props.value"
    :value-label="$props.valueLabel"
  >
    <Label v-if="$props.withLabel">Loading</Label>
    <ProgressBar.Output v-if="$props.customOutput" :class="$props.outputClass" data-testid="output">
      Custom
    </ProgressBar.Output>
    <ProgressBar.Output v-else :class="$props.outputClass" data-testid="output" />
    <ProgressBar.Track :class="$props.trackClass" data-testid="track">
      <ProgressBar.Fill
        :class="$props.fillClass"
        data-testid="fill"
        :style="{ backgroundColor: 'red', width: '1%' }"
      />
    </ProgressBar.Track>
    <span data-testid="slot-indeterminate">{{ slotProps.isIndeterminate }}</span>
    <span data-testid="slot-percentage">{{ slotProps.percentage }}</span>
    <span data-testid="slot-value-text">{{ slotProps.valueText }}</span>
  </ProgressBar>
  <span id="ext">External</span>
</template>
