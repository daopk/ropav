<script setup lang="ts" vapor>
import type {SliderRootProps} from "@/components/slider";

import {Label} from "@/components/label";
import {Slider} from "@/components/slider";

defineProps<
  SliderRootProps & {
    /** Leaves the visible label out, so the group has to name itself. */
    withoutLabel?: boolean;
    /** Name submitted with the form, put on the first thumb. */
    name?: string;
    /** `id` of a form the thumb submits with, for a slider rendered outside it. */
    form?: string;
  }
>();

defineEmits<{
  change: [value: number | number[]];
  changeEnd: [value: number | number[]];
}>();
</script>

<template>
  <Slider
    :aria-label="$props.ariaLabel"
    :class="$props.class"
    :default-value="$props.defaultValue"
    :format-options="$props.formatOptions"
    :is-disabled="$props.isDisabled"
    :max-value="$props.maxValue"
    :min-value="$props.minValue"
    :orientation="$props.orientation"
    :step="$props.step"
    :value="$props.value"
    @change="$emit('change', $event)"
    @change-end="$emit('changeEnd', $event)"
  >
    <Label v-if="!$props.withoutLabel">Volume</Label>
    <Slider.Output />
    <Slider.Track v-slot="{values}">
      <Slider.Fill />
      <Slider.Thumb
        v-for="(_, index) in values"
        :key="index"
        :form="index === 0 ? $props.form : undefined"
        :index="index"
        :name="index === 0 ? $props.name : undefined"
      />
    </Slider.Track>
  </Slider>
</template>
