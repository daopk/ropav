<script setup lang="ts">
import { Slider, SliderFill, SliderThumb, SliderTrack } from "ropav";
</script>

<template>
  <div class="stack">
    <Slider aria-label="Volume" class="slim" :default-value="40">
      <SliderTrack>
        <SliderFill />
        <SliderThumb />
      </SliderTrack>
    </Slider>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  width: calc(var(--rp-spacing) * 64);
  flex-direction: column;
}

/* A 4px bar in a 16px band, and a round knob that hangs half past either end. */
.slim {
  --slider-track-thickness: 1rem;
  --slider-rail-thickness: 0.25rem;
  --slider-thumb-length: 0.75rem;
  --slider-thumb-thickness: 0.75rem;
  --slider-thumb-radius: 50%;
  --slider-thumb-inset: 0px;
}
</style>
