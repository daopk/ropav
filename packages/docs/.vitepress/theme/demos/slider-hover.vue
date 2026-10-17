<script setup lang="ts">
import { Slider, SliderFill, SliderThumb, SliderTrack } from "ropav";
</script>

<template>
  <div class="stack">
    <Slider aria-label="Position" :default-value="20">
      <SliderTrack v-slot="{ hoverPercent, hoverValue }">
        <SliderFill />
        <SliderThumb />
        <span
          v-if="hoverValue !== null"
          aria-hidden="true"
          class="preview"
          :style="{ left: `${(hoverPercent ?? 0) * 100}%` }"
        >
          {{ hoverValue }}%
        </span>
      </SliderTrack>
    </Slider>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  width: calc(var(--rp-spacing) * 64);
  flex-direction: column;
  padding-block-start: calc(var(--rp-spacing) * 8);
}

/* Above the track, centred on where a press would put the thumb. */
.preview {
  position: absolute;
  bottom: calc(100% + var(--rp-spacing) * 2);
  translate: -50% 0;
  padding: var(--rp-spacing) calc(var(--rp-spacing) * 2);
  border-radius: min(32px, var(--rp-component-radius));
  background-color: var(--rp-overlay);
  box-shadow: var(--rp-shadow-overlay);
  font-size: var(--rp-text-xs);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  white-space: nowrap;
}
</style>
