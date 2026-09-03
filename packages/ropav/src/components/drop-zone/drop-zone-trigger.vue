<script setup lang="ts" vapor>
import type { DropZoneTriggerProps } from "./drop-zone.types";

import { composeSlotClassName } from "../../utils/compose";

import { useDropZoneContext } from "./drop-zone.context";

const props = defineProps<DropZoneTriggerProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useDropZoneContext();

// Deliberately not a button and not focusable: a keyboard reaches this component through the
// zone's own file input, and a second stop for the same action would only be one to tab past.
// A pointer press lands here and reaches the zone by bubbling.
</script>

<template>
  <span :class="composeSlotClassName(slots.trigger, props.class)" data-slot="drop-zone-trigger">
    <slot />
  </span>
</template>
