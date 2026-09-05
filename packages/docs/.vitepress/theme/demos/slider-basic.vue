<script setup lang="ts">
import { Label, Slider, SliderFill, SliderOutput, SliderThumb, SliderTrack } from "ropav";
</script>

<template>
  <div class="flex w-64 flex-col gap-6">
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
