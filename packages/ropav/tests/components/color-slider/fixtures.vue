<script setup lang="ts" vapor>
import type { ColorSliderRootProps } from "@/components/color-slider";
import type { Color } from "@/utils/color-types";

import { ColorSlider } from "@/components/color-slider";
import { Label } from "@/components/label";

defineProps<
  ColorSliderRootProps & {
    /** Leaves the visible label out, so the track has to name itself. */
    withoutLabel?: boolean;
    /** Leaves the output out, which the stylesheet detects with `:has()`. */
    withoutOutput?: boolean;
  }
>();

defineEmits<{
  change: [value: Color];
  changeEnd: [value: Color];
}>();
</script>

<template>
  <ColorSlider
    :id="$props.id"
    :aria-describedby="$props.ariaDescribedby"
    :aria-label="$props.ariaLabel"
    :aria-labelledby="$props.ariaLabelledby"
    :channel="$props.channel"
    :class="$props.class"
    :color-space="$props.colorSpace"
    :default-value="$props.defaultValue"
    :form="$props.form"
    :is-disabled="$props.isDisabled"
    :name="$props.name"
    :orientation="$props.orientation"
    :value="$props.value"
    @change="$emit('change', $event)"
    @change-end="$emit('changeEnd', $event)"
  >
    <Label v-if="!$props.withoutLabel">Channel</Label>
    <ColorSlider.Output v-if="!$props.withoutOutput" />
    <ColorSlider.Track>
      <ColorSlider.Thumb />
    </ColorSlider.Track>
  </ColorSlider>
</template>
