<script setup lang="ts" vapor>
import type { ColorPickerProps } from "@/components/color-picker";
import type { Color } from "@/utils/color-types";

import { ColorArea, ColorAreaThumb } from "@/components/color-area";
import { ColorField } from "@/components/color-field";
import {
  ColorInputGroup,
  ColorInputGroupInput,
  ColorInputGroupPrefix,
} from "@/components/color-input-group";
import { ColorPicker, ColorPickerPopover, ColorPickerTrigger } from "@/components/color-picker";
import { ColorSlider, ColorSliderThumb, ColorSliderTrack } from "@/components/color-slider";
import { ColorSwatch } from "@/components/color-swatch";
import {
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorSwatchPickerSwatch,
} from "@/components/color-swatch-picker";
import { Label } from "@/components/label";

/*
 * Every three-state boolean declares an explicit `undefined` default. Vue casts an absent boolean
 * prop to `false`, and forwarding that `false` down would turn the picker *controlled* and hold it
 * shut — the popover would then never open, however it was asked to.
 */
withDefaults(
  defineProps<
    ColorPickerProps & {
      /** A colour put on the slider itself, to see which one wins. */
      sliderValue?: Color | string;
      /** A colour put on the swatch itself, to see which one wins. */
      swatchValue?: Color | string;
      /** Whether the slider carries a handler of its own, which must not cut the picker's. */
      withSliderChange?: boolean;
      /** Renders the swatch picker and the colour field inside the popover too. */
      withEverything?: boolean;
      /** Pins the colour field's own value to `null`, which has to beat the picker's colour. */
      withEmptyField?: boolean;
    }
  >(),
  { defaultOpen: undefined, isOpen: undefined, sliderValue: undefined, swatchValue: undefined },
);

defineEmits<{
  change: [value: Color];
  openChange: [isOpen: boolean];
  sliderChange: [value: Color];
}>();
</script>

<template>
  <ColorPicker
    :class="$props.class"
    :default-open="$props.defaultOpen"
    :default-value="$props.defaultValue"
    :is-open="$props.isOpen"
    :value="$props.value"
    @change="$emit('change', $event)"
    @open-change="$emit('openChange', $event)"
  >
    <ColorPickerTrigger>
      <ColorSwatch :color="$props.swatchValue" size="lg" />
      <Label>Pick a color</Label>
    </ColorPickerTrigger>
    <ColorPickerPopover>
      <ColorArea
        aria-label="Color area"
        color-space="hsb"
        x-channel="saturation"
        y-channel="brightness"
      >
        <ColorAreaThumb />
      </ColorArea>
      <ColorSlider
        v-if="$props.withSliderChange"
        channel="hue"
        color-space="hsb"
        :value="$props.sliderValue"
        @change="$emit('sliderChange', $event)"
      >
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
      <ColorSlider v-else channel="hue" color-space="hsb" :value="$props.sliderValue">
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
      <template v-if="$props.withEverything">
        <ColorSwatchPicker size="xs">
          <ColorSwatchPickerItem
            v-for="preset in ['#EF4444', '#22C55E']"
            :key="preset"
            :color="preset"
          >
            <ColorSwatchPickerSwatch />
          </ColorSwatchPickerItem>
        </ColorSwatchPicker>
        <ColorField aria-label="Color field" :value="$props.withEmptyField ? null : undefined">
          <ColorInputGroup>
            <ColorInputGroupPrefix>
              <ColorSwatch size="xs" />
            </ColorInputGroupPrefix>
            <ColorInputGroupInput />
          </ColorInputGroup>
        </ColorField>
      </template>
    </ColorPickerPopover>
  </ColorPicker>
</template>
