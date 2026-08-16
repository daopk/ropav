<script setup lang="ts" vapor>
import type {MeterRootProps} from "@/components/meter";

import {Label} from "@/components/label";
import {Meter} from "@/components/meter";

defineProps<
  MeterRootProps & {
    customOutput?: boolean;
    fillClass?: string;
    outputClass?: string;
    trackClass?: string;
  }
>();
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
    <Label>Storage</Label>
    <Meter.Output v-if="$props.customOutput" :class="$props.outputClass" data-testid="output">
      Custom
    </Meter.Output>
    <Meter.Output v-else :class="$props.outputClass" data-testid="output" />
    <Meter.Track :class="$props.trackClass" data-testid="track">
      <Meter.Fill
        :class="$props.fillClass"
        data-testid="fill"
        :style="{backgroundColor: 'red', width: '1%'}"
      />
    </Meter.Track>
    <span data-testid="slot-percentage">{{ slotProps.percentage }}</span>
    <span data-testid="slot-value-text">{{ slotProps.valueText }}</span>
  </Meter>
</template>
