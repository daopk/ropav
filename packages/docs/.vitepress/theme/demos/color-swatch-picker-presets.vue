<script setup lang="ts">
import {
  ColorSwatchPicker,
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerSwatch,
} from "ropav";

const presets = ["#f43f5e", "#d946ef", "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#84cc16"];
</script>

<template>
  <ColorSwatchPicker aria-label="Brand colour" default-value="#3b82f6" variant="square">
    <ColorSwatchPickerItem v-for="preset in presets" :key="preset" :color="preset">
      <ColorSwatchPickerSwatch />
      <ColorSwatchPickerIndicator />
    </ColorSwatchPickerItem>
  </ColorSwatchPicker>
</template>
