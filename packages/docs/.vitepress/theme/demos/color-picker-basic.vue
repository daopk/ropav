<script setup lang="ts">
import {
  ColorArea,
  ColorAreaThumb,
  ColorPicker,
  ColorPickerPopover,
  ColorPickerTrigger,
  ColorSlider,
  ColorSliderThumb,
  ColorSliderTrack,
  ColorSwatch,
  Label,
} from "ropav";
</script>

<template>
  <ColorPicker default-value="#0485f7">
    <ColorPickerTrigger>
      <ColorSwatch size="lg" />
      <Label>Brand colour</Label>
    </ColorPickerTrigger>

    <ColorPickerPopover>
      <ColorArea
        aria-label="Saturation and brightness"
        class="picker"
        color-space="hsb"
        x-channel="saturation"
        y-channel="brightness"
      >
        <ColorAreaThumb />
      </ColorArea>

      <ColorSlider channel="hue" class="channel" color-space="hsb">
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    </ColorPickerPopover>
  </ColorPicker>
</template>

<style scoped>
.picker {
  max-width: 100%;
}

.channel {
  padding-inline: var(--rp-spacing);
}
</style>
