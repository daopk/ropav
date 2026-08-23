<script setup lang="ts" vapor>
import type {SliderRootProps, SliderSlotProps} from "./slider.types";

import {sliderVariants} from "@ropav/styles";
import {computed, shallowRef} from "vue";

import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {useId} from "../../composables/use-id";
import {useNumberFormatter} from "../../composables/use-number-formatter";
import {useSlider} from "../../composables/use-slider";
import {useSliderState} from "../../composables/use-slider-state";
import {dataAttr} from "../../utils/assertion";
import {useFieldsetContext} from "../fieldset/fieldset.context";

import {provideSliderContext} from "./slider.context";

const props = withDefaults(defineProps<SliderRootProps>(), {isDisabled: undefined});

const fieldset = useFieldsetContext();

// The slider renders as a `<div>`, which `<fieldset disabled>` does not reach, so the state has
// to be told outright.
const fieldsetIsDisabled = computed(() => props.isDisabled ?? fieldset?.isDisabled.value);

const emit = defineEmits<{
  change: [value: number | number[]];
  changeEnd: [value: number | number[]];
  "update:value": [value: number | number[]];
}>();

defineSlots<{default?: (props: SliderSlotProps) => unknown}>();

const sliderId = useId(() => props.id);

// `@internationalized/number` rather than `Intl` directly, so the `signDisplay` and unit-style
// fallbacks are there for engines that lack them — and so the locale comes from whatever is in
// force above rather than from the runtime default.
const numberFormatter = useNumberFormatter(() => props.formatOptions);

const state = useSliderState({
  defaultValue: () => props.defaultValue,
  isDisabled: () => fieldsetIsDisabled.value,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  numberFormatter,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  onChangeEnd: (value) => emit("changeEnd", value),
  orientation: () => props.orientation,
  step: () => props.step,
  value: () => props.value,
});

const trackEl = shallowRef<HTMLElement | null>(null);

const setTrackEl = (element: unknown) => {
  trackEl.value = element instanceof HTMLElement ? element : null;
};

// A visible label names the group, and each thumb points at it too so it is announced with
// the thumb's own value.
const {context: fieldIds, labelId} = useFieldIds({slots: ["label"]});

provideFieldIdsContext(fieldIds);

const slider = useSlider({
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  id: sliderId,
  labelId,
  state,
  trackEl,
});

const styles = computed(() => sliderVariants());

provideSliderContext({setTrackEl, slider, slots: styles, state, trackEl});

/**
 * The label carries no `for`: pointing it at the first thumb makes VoiceOver announce that
 * thumb by the slider's name alone and drop its own. Clicking it still has to reach the
 * thumb, so the click is picked up here instead.
 */
const onClick = (event: MouseEvent) => {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest("[data-slot='label']")) return;

  slider.focusFirstThumb();
};
</script>

<template>
  <div
    v-bind="slider.groupProps.value"
    :class="styles.base({class: props.class})"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-orientation="state.orientation.value"
    data-slot="slider"
    @click="onClick"
  >
    <slot
      :is-disabled="state.isDisabled.value"
      :orientation="state.orientation.value"
      :values="state.values.value"
    />
  </div>
</template>
