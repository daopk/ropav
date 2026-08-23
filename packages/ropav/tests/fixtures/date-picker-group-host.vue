<script setup lang="ts" vapor>
import type { DatePickerGroupHostProps } from "./date-picker-group.types";

import { computed, shallowRef } from "vue";

import { useDatePickerGroup } from "@/composables/use-date-picker-group";

const props = withDefaults(defineProps<DatePickerGroupHostProps>(), {
  disableArrowNavigation: undefined,
});

const element = shallowRef<HTMLElement | null>(null);
const segments = computed(() => props.placeholders ?? [true, true, true]);

const group = useDatePickerGroup({
  disableArrowNavigation: () => props.disableArrowNavigation,
  element,
  setOpen: props.setOpen,
});

props.onReady?.(group);
</script>

<template>
  <div
    ref="element"
    data-slot="group"
    @click="group.handlers.onClick"
    @dragstart="group.handlers.onDragstart"
    @keydown="group.onKeydown"
    @mousedown="group.handlers.onMousedown"
    @pointerdown="group.handlers.onPointerdown"
    @pointerenter="group.handlers.onPointerenter"
    @pointerleave="group.handlers.onPointerleave"
    @pointerup="group.handlers.onPointerup"
  >
    <template v-for="(isPlaceholder, index) in segments" :key="index">
      <span v-if="index > 0" aria-hidden="true" data-slot="separator">/</span>
      <span
        :data-index="index"
        :data-placeholder="isPlaceholder ? 'true' : undefined"
        data-slot="segment"
        tabindex="0"
        >{{ index }}</span
      >
    </template>
  </div>
</template>
