<script setup lang="ts" vapor>
import type {ProgressBarRootProps, ProgressBarSlotProps} from "./progress-bar.types";

import {progressBarVariants} from "@heroui/styles";
import {computed} from "vue";

import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {useId} from "../../composables/use-id";
import {useProgressValue} from "../../composables/use-progress-value";
import {composeSlotClassName} from "../../utils/compose";

import {provideProgressBarContext} from "./progress-bar.context";

const props = withDefaults(defineProps<ProgressBarRootProps>(), {isIndeterminate: undefined});

defineSlots<{default?: (props: ProgressBarSlotProps) => unknown}>();

const id = useId(() => props.id);
const {context: fieldIds, labelId} = useFieldIds({
  labelElementType: "span",
  slots: props.ariaLabel || props.ariaLabelledby ? [] : ["label"],
});

provideFieldIdsContext(fieldIds);

const state = useProgressValue({
  formatOptions: () => props.formatOptions,
  isIndeterminate: () => props.isIndeterminate,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  value: () => props.value,
  valueLabel: () => props.valueLabel,
});
const slots = computed(() => progressBarVariants({color: props.color, size: props.size}));
const ariaLabelledby = computed(() => {
  const external = props.ariaLabelledby?.trim().split(/\s+/).filter(Boolean) ?? [];
  const ids = props.ariaLabel
    ? external.length > 0
      ? [id.value, ...external]
      : []
    : [labelId.value, ...external];
  const unique = [...new Set(ids.filter((value): value is string => Boolean(value)))];

  return unique.length > 0 ? unique.join(" ") : undefined;
});

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
