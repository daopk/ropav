<script setup lang="ts">
import { Label, Slider, SliderFill, SliderOutput, SliderThumb, SliderTrack } from "ropav";
</script>

<template>
  <div class="stack">
    <Slider :default-value="30">
      <Label>Volume</Label>
      <SliderOutput />
      <SliderTrack>
        <SliderFill />
        <SliderThumb />
      </SliderTrack>
    </Slider>

    <Slider :default-value="[20, 70]">
      <Label>Price range</Label>
      <SliderOutput />
      <SliderTrack>
        <SliderFill />
        <SliderThumb :index="0" />
        <SliderThumb :index="1" />
      </SliderTrack>
    </Slider>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  width: calc(var(--spacing) * 64);
  flex-direction: column;
  gap: calc(var(--spacing) * 6);
}
</style>
