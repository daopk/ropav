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
  <div class="stack">
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

<style scoped>
.stack {
  display: flex;
  width: 100%;
  max-width: var(--container-sm);
  flex-direction: column;
  gap: calc(var(--spacing) * 4);
}
</style>
