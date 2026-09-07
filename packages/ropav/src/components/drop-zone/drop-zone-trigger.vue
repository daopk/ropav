<script setup lang="ts" vapor>
import type { DropZoneTriggerProps } from "./drop-zone.types";

const props = defineProps<DropZoneTriggerProps>();

defineSlots<{ default?: () => unknown }>();

// Deliberately not a button and not focusable: a keyboard reaches this component through the
// zone's own file input, and a second stop for the same action would only be one to tab past.
// A pointer press lands here and reaches the zone by bubbling.
</script>

<template>
  <span :class="['rp-drop-zone__trigger', props.class]" data-slot="drop-zone-trigger">
    <slot />
  </span>
</template>
