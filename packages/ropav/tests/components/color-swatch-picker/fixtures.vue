<script setup lang="ts" vapor>
import type { ColorSwatchPickerProps } from "@/components/color-swatch-picker";
import type { Color } from "@/utils/color-types";

import {
  ColorSwatchPicker,
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerSwatch,
} from "@/components/color-swatch-picker";

defineProps<
  ColorSwatchPickerProps & {
    /** The palette to render. */
    colors?: (Color | string)[];
    /** Colours rendered as disabled items. */
    disabled?: string[];
    /** A style put on every item by the caller, to see what survives. */
    itemStyle?: string;
    /** Renders a caller's own indicator content instead of the checkmark. */
    withCustomIndicator?: boolean;
    /** Leaves the indicator out, so an item is a bare swatch. */
    withoutIndicator?: boolean;
  }
>();

defineEmits<{ change: [value: Color] }>();
</script>

<template>
  <ColorSwatchPicker
    :aria-label="$props.ariaLabel"
    :aria-labelledby="$props.ariaLabelledby"
    :class="$props.class"
    :default-value="$props.defaultValue"
    :layout="$props.layout"
    :size="$props.size"
    :value="$props.value"
    :variant="$props.variant"
    @change="$emit('change', $event)"
  >
    <ColorSwatchPickerItem
      v-for="color in $props.colors ?? ['#F43F5E', '#D946EF', '#8B5CF6']"
      :key="String(color)"
      :color="color"
      :is-disabled="$props.disabled?.includes(String(color))"
      :style="$props.itemStyle"
    >
      <ColorSwatchPickerSwatch />
      <ColorSwatchPickerIndicator v-if="$props.withCustomIndicator">
        <span data-testid="custom-indicator">picked</span>
      </ColorSwatchPickerIndicator>
      <ColorSwatchPickerIndicator v-else-if="!$props.withoutIndicator" />
    </ColorSwatchPickerItem>
  </ColorSwatchPicker>
</template>
