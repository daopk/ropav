<script setup lang="ts" vapor>
import type { MeterProps } from "@/components/meter";

import { Label } from "@/components/label";
import { Meter, MeterFill, MeterOutput, MeterTrack } from "@/components/meter";

withDefaults(
  defineProps<
    MeterProps & {
      customOutput?: boolean;
      fillClass?: string;
      outputClass?: string;
      trackClass?: string;
      withLabel?: boolean;
    }
  >(),
  {
    fillClass: undefined,
    outputClass: undefined,
    trackClass: undefined,
    withLabel: true,
  },
);
</script>

<template>
  <Meter
    :id="$props.id"
    v-slot="slotProps"
    :aria-describedby="$props.ariaDescribedby"
    :aria-label="$props.ariaLabel"
    :aria-labelledby="$props.ariaLabelledby"
    :class="$props.class"
    :color="$props.color"
    data-testid="root"
    :format-options="$props.formatOptions"
    :max-value="$props.maxValue"
    :min-value="$props.minValue"
    :size="$props.size"
    :value="$props.value"
    :value-label="$props.valueLabel"
  >
    <Label v-if="$props.withLabel">Storage</Label>
    <MeterOutput v-if="$props.customOutput" :class="$props.outputClass" data-testid="output">
      Custom
    </MeterOutput>
    <MeterOutput v-else :class="$props.outputClass" data-testid="output" />
    <MeterTrack :class="$props.trackClass" data-testid="track">
      <MeterFill
        :class="$props.fillClass"
        data-testid="fill"
        :style="{ backgroundColor: 'red', width: '1%' }"
      />
    </MeterTrack>
    <span data-testid="slot-percentage">{{ slotProps.percentage }}</span>
    <span data-testid="slot-value-text">{{ slotProps.valueText }}</span>
  </Meter>
  <span id="ext">External</span>
</template>
