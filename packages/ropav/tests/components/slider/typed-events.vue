<script setup lang="ts" vapor>
import { ref } from "vue";

/**
 * Never rendered: type-checked only, by `vue-tsc`. `change` and `change-end` follow the shape of
 * the value the slider was given, so each handler here only accepts the one shape.
 */
import { Slider, SliderThumb, SliderTrack } from "@/components/slider";

const takesNumber = (value: number) => value;
const takesRange = (value: number[]) => value;

// Reported as any number, not as the literal the slider started from.
const volume = ref(30);
</script>

<template>
  <Slider :default-value="30" @change="takesNumber" @change-end="takesNumber">
    <SliderTrack><SliderThumb /></SliderTrack>
  </Slider>

  <Slider
    :default-value="30"
    @change="
      (value) => {
        volume = value;
        volume = 99;
        takesNumber(value);
      }
    "
  >
    <SliderTrack><SliderThumb /></SliderTrack>
  </Slider>

  <Slider v-model:value="volume">
    <SliderTrack><SliderThumb /></SliderTrack>
  </Slider>

  <Slider :value="[20, 70]" @change="takesRange" @change-end="takesRange">
    <SliderTrack><SliderThumb :index="0" /><SliderThumb :index="1" /></SliderTrack>
  </Slider>

  <!-- @vue-expect-error A single value never reports an array. -->
  <Slider :default-value="30" @change="takesRange">
    <SliderTrack><SliderThumb /></SliderTrack>
  </Slider>

  <!-- @vue-expect-error A range never reports a number. -->
  <Slider :value="[20, 70]" @change-end="takesNumber">
    <SliderTrack><SliderThumb :index="0" /><SliderThumb :index="1" /></SliderTrack>
  </Slider>
</template>
