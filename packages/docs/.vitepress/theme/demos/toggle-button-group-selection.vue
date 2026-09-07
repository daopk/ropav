<script setup lang="ts">
import { ToggleButton, ToggleButtonGroup, ToggleButtonGroupSeparator } from "ropav";

const alignments = [
  { id: "left", label: "Left" },
  { id: "center", label: "Centre" },
  { id: "right", label: "Right" },
] as const;

const styles = [
  { id: "bold", label: "Bold" },
  { id: "italic", label: "Italic" },
] as const;
</script>

<template>
  <div class="stack">
    <ToggleButtonGroup
      aria-label="Alignment"
      :default-selected-keys="['left']"
      disallow-empty-selection
    >
      <template v-for="(item, index) in alignments" :key="item.id">
        <ToggleButton :id="item.id">
          <ToggleButtonGroupSeparator v-if="index > 0" />
          {{ item.label }}
        </ToggleButton>
      </template>
    </ToggleButtonGroup>

    <ToggleButtonGroup aria-label="Text style" selection-mode="multiple">
      <template v-for="(item, index) in styles" :key="item.id">
        <ToggleButton :id="item.id">
          <ToggleButtonGroupSeparator v-if="index > 0" />
          {{ item.label }}
        </ToggleButton>
      </template>
    </ToggleButtonGroup>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 6);
}
</style>
