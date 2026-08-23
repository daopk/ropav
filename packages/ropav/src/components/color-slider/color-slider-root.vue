<script setup lang="ts" vapor>
import type { Color, ColorSpace } from "../../utils/color-types";
import type { ColorSliderRootProps, ColorSliderSlotProps } from "./color-slider.types";

import { colorSliderVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { useColorSlider } from "../../composables/use-color-slider";
import { useColorSliderState } from "../../composables/use-color-slider-state";
import { provideFieldIdsContext, useFieldIds } from "../../composables/use-field-ids";
import { useId } from "../../composables/use-id";
import { dataAttr } from "../../utils/assertion";
import { useColorValueContext } from "../color-picker/color-picker.context";

import { provideColorSliderContext } from "./color-slider.context";

/** Channels that exist in exactly one colour space, and which one. */
const CHANNEL_TO_REQUIRED_COLOR_SPACE: Partial<Record<string, ColorSpace>> = {
  blue: "rgb",
  brightness: "hsb",
  green: "rgb",
  lightness: "hsl",
  red: "rgb",
};

/** Channels that exist in `hsl` and `hsb` but not in `rgb`. */
const HSL_HSB_ONLY_CHANNELS = new Set(["hue", "saturation"]);

/**
 * Reconcile a channel with the colour space it was asked to work in.
 *
 * A combination that cannot exist would otherwise throw out of the colour model on the first
 * render, so it is corrected here and reported — loudly, because the markup asking for it is
 * wrong and silently drawing a different slider would hide that.
 */
const getValidColorSpace = (channel: string, colorSpace?: ColorSpace): ColorSpace | undefined => {
  const requiredSpace = CHANNEL_TO_REQUIRED_COLOR_SPACE[channel];

  if (requiredSpace && colorSpace && colorSpace !== requiredSpace) {
    // eslint-disable-next-line no-console
    console.warn(
      `[Ropav ColorSlider] Invalid combination: channel="${channel}" requires colorSpace="${requiredSpace}", ` +
        `but received colorSpace="${colorSpace}". Auto-correcting to "${requiredSpace}".`,
    );

    return requiredSpace;
  }

  if (HSL_HSB_ONLY_CHANNELS.has(channel) && colorSpace === "rgb") {
    // eslint-disable-next-line no-console
    console.warn(
      `[Ropav ColorSlider] Invalid combination: channel="${channel}" is not available in RGB color space. ` +
        `Use colorSpace="hsl" or colorSpace="hsb" instead. Auto-correcting to "hsl".`,
    );

    return "hsl";
  }

  return colorSpace;
};

const props = withDefaults(defineProps<ColorSliderRootProps>(), { isDisabled: undefined });

const emit = defineEmits<{
  change: [value: Color];
  changeEnd: [value: Color];
  "update:value": [value: Color];
}>();

defineSlots<{ default?: (props: ColorSliderSlotProps) => unknown }>();

const sliderId = useId(() => props.id);

const channel = computed(() => props.channel);
const colorSpace = computed(() => getValidColorSpace(props.channel, props.colorSpace));

/**
 * The colour a `ColorPicker` above is holding, when there is one.
 *
 * A prop still wins whenever it is present, and the picker is told about every change as well as
 * the caller — chained, not replaced, so a component with its own handler does not cut the
 * picker's update path. See `ColorValueContext`.
 */
const owner = useColorValueContext();

const state = useColorSliderState({
  channel,
  colorSpace,
  defaultValue: () => props.defaultValue,
  isDisabled: () => props.isDisabled,
  onChange: (value) => {
    owner?.setValue(value);
    emit("change", value);
    emit("update:value", value);
  },
  onChangeEnd: (value) => emit("changeEnd", value),
  orientation: () => props.orientation,
  value: () => (props.value !== undefined ? props.value : owner?.value.value),
});

const trackEl = shallowRef<HTMLElement | null>(null);
const inputEl = shallowRef<HTMLInputElement | null>(null);

const setTrackEl = (element: unknown) => {
  trackEl.value = element instanceof HTMLElement ? element : null;
};

const setInputEl = (element: unknown) => {
  inputEl.value = element instanceof HTMLInputElement ? element : null;
};

// A visible label names the group, and the thumb points at it too so it is announced with the
// thumb's own value.
const { context: fieldIds, labelId } = useFieldIds({ slots: ["label"] });

provideFieldIdsContext(fieldIds);

const slider = useColorSlider({
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  channel,
  form: () => props.form,
  id: sliderId,
  inputEl,
  isDisabled: () => props.isDisabled,
  labelId,
  name: () => props.name,
  state,
  trackEl,
});

const styles = computed(() => colorSliderVariants());

provideColorSliderContext({ channel, setInputEl, setTrackEl, slider, slots: styles, state });

/**
 * The label carries no `for`: pointing it at the thumb makes VoiceOver announce the thumb by the
 * slider's name alone and drop its own value. Clicking it still has to reach the thumb, so the
 * click is picked up here instead.
 */
const onClick = (event: MouseEvent) => {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest("[data-slot='label']")) return;

  slider.focusThumb();
};
</script>

<template>
  <div
    :class="styles.base({ class: props.class })"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-orientation="state.orientation.value"
    data-slot="color-slider"
    @click="onClick"
  >
    <slot
      :color="state.value.value"
      :is-disabled="state.isDisabled.value"
      :orientation="state.orientation.value"
    />
  </div>
</template>
