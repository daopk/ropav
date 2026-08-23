<script setup lang="ts" vapor>
import type {MeterRootProps, MeterSlotProps} from "./meter.types";

import {meterVariants} from "@heroui/styles";
import {computed} from "vue";

import {useProgressLabeling} from "../../composables/use-progress-labeling";
import {useProgressValue} from "../../composables/use-progress-value";
import {composeSlotClassName} from "../../utils/compose";

import {provideMeterContext} from "./meter.context";

const props = defineProps<MeterRootProps>();

defineSlots<{default?: (props: MeterSlotProps) => unknown}>();

const {ariaLabelledby, id} = useProgressLabeling({
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  id: () => props.id,
});

const state = useProgressValue({
  formatOptions: () => props.formatOptions,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  value: () => props.value,
  valueLabel: () => props.valueLabel,
});
const slots = computed(() => meterVariants({color: props.color, size: props.size}));

provideMeterContext({slots, state});
</script>

<template>
  <div
    :id="id"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="ariaLabelledby"
    :aria-valuemax="state.maxValue.value"
    :aria-valuemin="state.minValue.value"
    :aria-valuenow="state.value.value"
    :aria-valuetext="state.valueText.value"
    :class="composeSlotClassName(slots.base, props.class)"
    data-slot="meter"
    role="meter progressbar"
  >
    <slot :percentage="state.percentage.value ?? 0" :value-text="state.valueText.value" />
  </div>
</template>
