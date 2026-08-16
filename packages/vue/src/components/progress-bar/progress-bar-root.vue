<script setup lang="ts" vapor>
import type {ProgressBarRootProps, ProgressBarSlotProps} from "./progress-bar.types";

import {progressBarVariants} from "@heroui/styles";
import {computed} from "vue";

import {useProgressLabeling} from "../../composables/use-progress-labeling";
import {useProgressValue} from "../../composables/use-progress-value";
import {composeSlotClassName} from "../../utils/compose";

import {provideProgressBarContext} from "./progress-bar.context";

const props = withDefaults(defineProps<ProgressBarRootProps>(), {isIndeterminate: undefined});

defineSlots<{default?: (props: ProgressBarSlotProps) => unknown}>();

const {ariaLabelledby, id} = useProgressLabeling({
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  id: () => props.id,
});

const state = useProgressValue({
  formatOptions: () => props.formatOptions,
  isIndeterminate: () => props.isIndeterminate,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  value: () => props.value,
  valueLabel: () => props.valueLabel,
});
const slots = computed(() => progressBarVariants({color: props.color, size: props.size}));

provideProgressBarContext({slots, state});
</script>

<template>
  <div
    :id="id"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="ariaLabelledby"
    :aria-valuemax="state.maxValue.value"
    :aria-valuemin="state.minValue.value"
    :aria-valuenow="state.isIndeterminate.value ? undefined : state.value.value"
    :aria-valuetext="state.valueText.value"
    :class="composeSlotClassName(slots.base, props.class)"
    data-slot="progress-bar"
    role="progressbar"
  >
    <slot
      :is-indeterminate="state.isIndeterminate.value"
      :percentage="state.percentage.value"
      :value-text="state.valueText.value"
    />
  </div>
</template>
