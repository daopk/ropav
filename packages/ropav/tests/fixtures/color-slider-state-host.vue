<script setup lang="ts" vapor>
import type {ColorSliderStateHostProps} from "./color-slider-state.types";

import {useColorSliderState} from "@/composables/use-color-slider-state";

// `isDisabled` declares `default: undefined`: Vue casts an absent Boolean prop to `false`, and a
// forwarded `false` is not the same as absent.
const props = withDefaults(defineProps<ColorSliderStateHostProps>(), {isDisabled: undefined});

props.onReady?.(
  useColorSliderState({
    channel: () => props.channel ?? "hue",
    colorSpace: () => props.colorSpace,
    defaultValue: () => props.defaultValue,
    isDisabled: () => props.isDisabled,
    onChange: props.onChange,
    onChangeEnd: props.onChangeEnd,
    value: () => props.value,
  }),
);
</script>

<template>
  <span data-slot="color-slider-state-host" />
</template>
