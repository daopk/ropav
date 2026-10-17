<script setup lang="ts" vapor>
import type { SliderProps } from "@/components/slider";

import { Label } from "@/components/label";
import { Slider, SliderFill, SliderOutput, SliderThumb, SliderTrack } from "@/components/slider";

defineProps<
  SliderProps & {
    /** Leaves the visible label out, so the group has to name itself. */
    withoutLabel?: boolean;
    /** Leaves the output out, so a bare track is all the slider holds. */
    withoutOutput?: boolean;
    /** Name submitted with the form, put on the first thumb. */
    name?: string;
    /** `id` of a form the thumb submits with, for a slider rendered outside it. */
    form?: string;
    /** Renders a preview of the value under a hovering pointer, placed where a press would go. */
    withHoverPreview?: boolean;
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
    <SliderOutput v-if="!$props.withoutOutput" />
    <SliderTrack v-slot="{ hoverPercent, hoverValue, values }">
      <span
        v-if="$props.withHoverPreview && hoverValue !== null"
        data-testid="hover-preview"
        :style="{ left: `${(hoverPercent ?? 0) * 100}%`, position: 'absolute' }"
        >{{ hoverValue }}</span
      >
      <SliderFill />
      <SliderThumb
        v-for="(_, index) in values"
        :key="index"
        :form="index === 0 ? $props.form : undefined"
        :index="index"
        :name="index === 0 ? $props.name : undefined"
      />
    </SliderTrack>
  </Slider>
</template>
