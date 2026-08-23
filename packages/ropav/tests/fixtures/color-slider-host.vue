<script setup lang="ts" vapor>
import type {ColorSliderHostProps} from "./color-slider.types";

import {shallowRef} from "vue";

import {useColorSlider} from "@/composables/use-color-slider";
import {useColorSliderState} from "@/composables/use-color-slider-state";

// `isDisabled` declares `default: undefined`: Vue casts an absent Boolean prop to `false`, and a
// forwarded `false` is not the same as absent.
const props = withDefaults(defineProps<ColorSliderHostProps>(), {isDisabled: undefined});

const trackEl = shallowRef<HTMLElement | null>(null);
const inputEl = shallowRef<HTMLInputElement | null>(null);

const setTrackEl = (element: unknown) => {
  trackEl.value = element instanceof HTMLElement ? element : null;
};

const setInputEl = (element: unknown) => {
  inputEl.value = element instanceof HTMLInputElement ? element : null;
};

const state = useColorSliderState({
  channel: () => props.channel ?? "hue",
  colorSpace: () => props.colorSpace,
  defaultValue: () => props.defaultValue,
  isDisabled: () => props.isDisabled,
  onChange: props.onChange,
  orientation: () => props.orientation,
  value: () => props.value,
});

const slider = useColorSlider({
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  channel: () => props.channel ?? "hue",
  form: () => props.form,
  id: () => props.id ?? "color-slider",
  inputEl,
  isDisabled: () => props.isDisabled,
  labelId: () => props.labelId,
  name: () => props.name,
  state,
  trackEl,
});

props.onReady?.({slider, state});
</script>

<template>
  <div :ref="setTrackEl" data-testid="track" v-bind="slider.trackAttrs.value">
    <div data-testid="thumb">
      <input :ref="setInputEl" v-bind="slider.inputProps.value" />
    </div>
  </div>
</template>
