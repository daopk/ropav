<script setup lang="ts">
import { ColorSlider, ColorSliderOutput, ColorSliderThumb, ColorSliderTrack, Label } from "ropav";
import { shallowRef } from "vue";

const color = shallowRef("hsl(200, 100%, 50%)");

const channels = [
  { channel: "hue", label: "Hue" },
  { channel: "saturation", label: "Saturation" },
  { channel: "lightness", label: "Lightness" },
] as const;
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <ColorSlider
      v-for="item in channels"
      :key="item.channel"
      v-model:value="color"
      :channel="item.channel"
      color-space="hsl"
    >
      <Label>{{ item.label }}</Label>
      <ColorSliderOutput />
      <ColorSliderTrack>
        <ColorSliderThumb />
      </ColorSliderTrack>
    </ColorSlider>
  </div>
</template>
